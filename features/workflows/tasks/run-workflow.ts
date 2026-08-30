import { logger, metadata, task } from "@trigger.dev/sdk"
import type { DeserializedJson } from "@trigger.dev/core"
import { getWorkflow } from "@/features/workflows/data"
import {
  nodeRegistry,
  type NodeType,
  type StepNodeType,
} from "../nodes/node-registry"
import type {
  QueueItem,
  RunStep,
  RunWorkflowTaskInput,
  RunWorkflowTaskOutput,
} from "./types"
import { createBrowserSessionManager } from "./browser-manager"
import {
  buildEdgeMaps,
  discoverNextReadyChildren,
  findTriggerNode,
} from "./graph-traversal"
import { purgeUnchosenSiblingBranches } from "./merge-synchronizer"
import { executeStep } from "./step-executor"

export type {
  RunStep,
  QueueItem,
  RunWorkflowTaskInput,
  RunWorkflowTaskOutput,
} from "./types"

export const runWorkflowTask = task({
  id: "run-workflow",
  maxDuration: 300, // 5-minute timeout cap to prevent runaway browser compute
  queue: {
    concurrencyLimit: 3, // Matches your Browserbase plan limit
  },
  retry: {
    maxAttempts: 1,
  },
  run: async (
    { workflowId, orgId, triggerData }: RunWorkflowTaskInput,
    { signal }
  ): Promise<RunWorkflowTaskOutput> => {
    const workflow = await getWorkflow(orgId, workflowId)

    if (!workflow?.graph) {
      throw new Error(`Workflow ${workflowId} has no graph`)
    }

    const { nodes, edges } = workflow.graph
    const byId = new Map<string, StepNodeType>(nodes.map((n) => [n.id, n]))

    // Map incoming and outgoing connections for dependency graph execution
    const { incomingEdges, outgoingEdges } = buildEdgeMaps(edges)
    const activeEdges = new Set<string>()
    const disabledEdges = new Set<string>()
    const completedNodeIds = new Set<string>()
    const failedNodeIds = new Set<string>()
    const failedBranches: Array<{ nodeId: string; title?: string; error: string }> = []

    // Determine entry point (trigger node)
    const triggerNode = findTriggerNode(nodes)
    const readyQueue: QueueItem[] = [{ nodeId: triggerNode.id }]
    const results: Record<string, unknown> = {}
    const steps: RunStep[] = []

    logger.log(`Running Workflow: ${workflow.name}`)

    const browserManager = createBrowserSessionManager()
    let hasFailedStep = false
    let firstFailureError: Error | null = null

    try {
      while (readyQueue.length > 0) {
        const item = readyQueue.shift()!
        const nodeId = typeof item === "string" ? item : item.nodeId
        const edgeId = typeof item === "string" ? undefined : item.edgeId

        if (signal?.aborted) {
          for (const s of steps) {
            if (s.status === "running") s.status = "canceled"
            else if (s.status === "pending") s.status = "skipped"
          }
          metadata.set("steps", steps)
          await metadata.flush()
          throw new Error("Workflow run was canceled")
        }

        const node = byId.get(nodeId)
        if (!node) continue

        const def = nodeRegistry[node.data.type]
        const type = node.data.type as NodeType
        const title = node.data.title || def?.label || node.data.type || "Step"
        const kind = node.data.kind || def?.kind || "action"

        let step = steps.find(
          (s) =>
            (edgeId ? s.edgeId === edgeId : (s.nodeId === nodeId || s.id === nodeId)) &&
            s.status === "pending"
        )
        const startedAt = Date.now()
        if (!step) {
          step = {
            id: crypto.randomUUID(),
            nodeId,
            edgeId,
            type,
            title,
            kind,
            status: "running",
            startedAt,
          }
          steps.push(step)
        } else {
          step.status = "running"
          step.startedAt = startedAt
        }

        metadata.set("steps", steps)
        await metadata.flush()

        logger.log(`Running step: ${title} (${type})`)

        try {
          const result = await executeStep({
            node,
            results,
            triggerData,
            outgoingEdges,
            incomingEdges,
            activeEdges,
            disabledEdges,
            failedBranches,
            byId,
            getStagehand: browserManager.getStagehand,
          })

          completedNodeIds.add(nodeId)

          const completedAt = Date.now()
          step.status = "done"
          step.completedAt = completedAt
          step.duration = completedAt - startedAt
          step.durationMs = completedAt - startedAt
          step.output = (result as DeserializedJson) ?? { completed: true }

          // Discover ready downstream child nodes
          const { readyChildren, pendingSteps } = discoverNextReadyChildren({
            nodeId,
            outgoingEdges,
            incomingEdges,
            activeEdges,
            disabledEdges,
            completedNodeIds,
            failedNodeIds,
            byId,
          })

          steps.push(...pendingSteps)

          // Depth-First (DFS): Prepend direct child branch nodes to the front of readyQueue
          readyQueue.unshift(...readyChildren)

          // If a Merge node was triggered in "first" mode, purge loser sibling branches
          purgeUnchosenSiblingBranches({
            readyChildren,
            incomingEdges,
            completedNodeIds,
            disabledEdges,
            readyQueue,
            steps,
            byId,
            currentNodeId: nodeId,
          })

          metadata.set("steps", steps)
          await metadata.flush()
        } catch (error) {
          const isAbort =
            signal?.aborted ||
            (error instanceof Error && error.message.includes("canceled"))

          const completedAt = Date.now()
          step.status = isAbort ? "canceled" : "failed"
          step.completedAt = completedAt
          step.duration = completedAt - startedAt
          step.durationMs = completedAt - startedAt
          step.error = isAbort
            ? "Workflow run was canceled"
            : error instanceof Error
              ? error.message
              : String(error)

          metadata.set("steps", steps)
          await metadata.flush()

          if (isAbort) {
            for (const s of steps) {
              if (s.status === "pending") s.status = "skipped"
            }
            metadata.set("steps", steps)
            await metadata.flush()
            throw error
          }

          // Branch-isolated failure: record failure and allow parallel sibling branches to continue
          hasFailedStep = true
          failedNodeIds.add(nodeId)
          failedBranches.push({
            nodeId,
            title,
            error: step.error || String(error),
          })

          if (!firstFailureError) {
            firstFailureError =
              error instanceof Error ? error : new Error(String(error))
          }
          logger.error(
            `Step "${title}" failed: ${step.error}. Pruning branch and synchronizing parallel branches.`
          )

          // Prune outgoing edges of the failed node down this branch
          const outEdges = outgoingEdges.get(nodeId) || []
          for (const edge of outEdges) {
            disabledEdges.add(edge.id)
          }

          // Check if any downstream Merge node can now proceed with remaining healthy branches
          const { readyChildren, pendingSteps } = discoverNextReadyChildren({
            nodeId,
            outgoingEdges,
            incomingEdges,
            activeEdges,
            disabledEdges,
            completedNodeIds,
            failedNodeIds,
            byId,
          })
          steps.push(...pendingSteps)
          readyQueue.unshift(...readyChildren)

          metadata.set("steps", steps)
          await metadata.flush()
        }
      }

      // Sweep any remaining unreached pending steps
      for (const s of steps) {
        if (s.status === "pending") {
          s.status = "skipped"
        }
      }
      metadata.set("steps", steps)
      await metadata.flush()

      // If a step failed and was not resolved by a downstream Merge node, throw
      const mergeNodes = nodes.filter((n) => n.data?.type === "merge")
      const hasSuccessfulMerge = mergeNodes.some(
        (m) => results[m.id] !== undefined
      )
      if (hasFailedStep && !hasSuccessfulMerge) {
        throw (
          firstFailureError || new Error("Workflow finished with failed steps")
        )
      }
    } finally {
      await browserManager.close()
    }

    return { steps, sessionId: browserManager.getSessionId() }
  },
})
