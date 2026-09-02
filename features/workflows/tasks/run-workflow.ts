import { logger, metadata, task } from "@trigger.dev/sdk"
import { getWorkflow } from "@/features/workflows/data"
import type { NodeType, StepNodeType } from "../nodes/node-registry"
import type {
  QueueItem,
  RunStep,
  RunWorkflowTaskInput,
  RunWorkflowTaskOutput,
} from "./types"
import { createBrowserSessionManager } from "./browser-manager"
import { buildEdgeMaps, findTriggerNode } from "./graph-traversal"
import { purgeUnchosenSiblingBranches } from "./merge-synchronizer"
import { executeSingleNodeStep } from "./single-step-runner"
import { executeLoopStep } from "./loop-orchestrator"
import { getDecryptedOrgSecrets } from "@/features/credentials/data"

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
    { workflowId, orgId, triggerData, triggerNodeId }: RunWorkflowTaskInput,
    { signal }
  ): Promise<RunWorkflowTaskOutput> => {
    const workflow = await getWorkflow(orgId, workflowId)

    if (!workflow?.graph) {
      throw new Error(`Workflow ${workflowId} has no graph`)
    }

    const { nodes, edges } = workflow.graph
    const byId = new Map<string, StepNodeType>(nodes.map((n) => [n.id, n]))

    // Load and decrypt organization credentials in-memory for this run
    const orgSecrets = await getDecryptedOrgSecrets(orgId)

    // Map incoming and outgoing connections for dependency graph execution
    const { incomingEdges, outgoingEdges } = buildEdgeMaps(edges)
    const activeEdges = new Set<string>()
    const disabledEdges = new Set<string>()
    const completedNodeIds = new Set<string>()
    const failedNodeIds = new Set<string>()
    const failedBranches: Array<{
      nodeId: string
      title?: string
      error: string
    }> = []

    // Determine entry point (trigger node)
    const triggerNode = findTriggerNode(nodes, triggerNodeId)
    const readyQueue: QueueItem[] = [{ nodeId: triggerNode.id }]
    const results: Record<string, unknown> = {
      secrets: orgSecrets,
    }
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

        const node = byId.get(nodeId)
        if (!node) continue

        const type = node.data.type as NodeType

        // Loop Node: delegate to loop orchestrator for multi-iteration execution
        if (type === "loop") {
          await executeLoopStep({
            nodeId,
            edgeId,
            byId,
            steps,
            results,
            secrets: orgSecrets,
            triggerData,
            outgoingEdges,
            incomingEdges,
            activeEdges,
            disabledEdges,
            completedNodeIds,
            failedNodeIds,
            failedBranches,
            getStagehand: browserManager.getStagehand,
            signal,
            readyQueue,
          })
          continue
        }

        // Standard Step: execute single step lifecycle
        const { step, readyChildren, isFailure, error } =
          await executeSingleNodeStep({
            nodeId,
            edgeId,
            byId,
            steps,
            results,
            secrets: orgSecrets,
            triggerData,
            outgoingEdges,
            incomingEdges,
            activeEdges,
            disabledEdges,
            completedNodeIds,
            failedNodeIds,
            failedBranches,
            getStagehand: browserManager.getStagehand,
            signal,
          })

        if (isFailure) {
          hasFailedStep = true
          if (!firstFailureError) {
            firstFailureError =
              error instanceof Error
                ? error
                : new Error(step?.error || "Step failed")
          }
          if (readyChildren.length > 0) {
            readyQueue.unshift(...readyChildren)
          }
          continue
        }

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
