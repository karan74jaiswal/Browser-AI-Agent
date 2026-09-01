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
import { getDecryptedOrgSecrets } from "@/features/credentials/data"
import { interpolate, type ConditionCriterion } from "../lib"
import {
  parseLoopItems,
  parseMaxIterations,
  shouldContinueWhileLoop,
  type LoopMode,
  type WhileRuleMode,
  type LoopFailurePolicy,
} from "../nodes/loop"

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
    const triggerNode = findTriggerNode(nodes)
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
            (edgeId
              ? s.edgeId === edgeId
              : s.nodeId === nodeId || s.id === nodeId) &&
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

        if (type === "loop") {
          const rawMode = (node.data.values?.mode || "for_each") as LoopMode
          const itemsInput = node.data.values?.items
          const countStr = node.data.values?.count
          const rawMax = node.data.values?.maxIterations
          const delayMs = parseInt(node.data.values?.batchDelayMs || "0", 10)
          const onItemFailure = (node.data.values?.onItemFailure ||
            "continue") as LoopFailurePolicy
          const whileRuleMode = (node.data.values?.whileRuleMode ||
            "until") as WhileRuleMode
          let conditions: ConditionCriterion[] = []
          try {
            conditions = JSON.parse(node.data.values?.conditions || "[]")
          } catch {}

          const interpolatedItemsInput = interpolate(itemsInput, results)
          const interpolatedCountStr = interpolate(countStr, results)
          const maxCap = parseMaxIterations(interpolate(rawMax, results))
          const items = parseLoopItems(
            interpolatedItemsInput,
            rawMode,
            interpolatedCountStr,
            maxCap
          )

          const outEdges = outgoingEdges.get(nodeId) || []
          const doneEdges = outEdges.filter(
            (e) =>
              (e.sourceHandle ||
                (e as { sourceHandleId?: string }).sourceHandleId) === "done"
          )
          const loopEdges = outEdges.filter((e) => {
            const h =
              e.sourceHandle ||
              (e as { sourceHandleId?: string }).sourceHandleId
            return h === "loop" || h === "body"
          })

          // Sort loop branch roots by canvas Y coordinate (upper branch first)
          loopEdges.sort((a, b) => {
            const nodeA = byId.get(a.target)
            const nodeB = byId.get(b.target)
            return (nodeA?.position.y ?? 0) - (nodeB?.position.y ?? 0)
          })

          const iterationResults: unknown[] = []
          let successCount = 0
          let failureCount = 0

          const initialWhileContinue =
            rawMode === "while"
              ? shouldContinueWhileLoop(
                  conditions,
                  "and",
                  whileRuleMode,
                  results
                )
              : true

          if (
            items.length === 0 ||
            (rawMode === "while" && !initialWhileContinue)
          ) {
            const finalOutput = {
              item: null,
              index: 0,
              iteration: 0,
              total: 0,
              isFirst: true,
              isLast: true,
              results: [],
              successCount: 0,
              failureCount: 0,
              completed: true,
              branch: "done",
            }
            results[nodeId] = finalOutput

            for (const edge of doneEdges) {
              activeEdges.add(edge.id)
            }
            for (const edge of loopEdges) {
              disabledEdges.add(edge.id)
            }

            completedNodeIds.add(nodeId)
            const completedAt = Date.now()
            step.status = "done"
            step.completedAt = completedAt
            step.duration = completedAt - startedAt
            step.durationMs = completedAt - startedAt
            step.output = finalOutput as DeserializedJson

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
          } else {
            for (const edge of loopEdges) {
              activeEdges.add(edge.id)
            }

            const totalItems = rawMode === "while" ? maxCap : items.length

            for (let i = 0; i < totalItems; i++) {
              if (signal?.aborted) {
                throw new Error("Workflow run was canceled")
              }

              if (rawMode === "while") {
                const shouldContinue = shouldContinueWhileLoop(
                  conditions,
                  "and",
                  whileRuleMode,
                  results
                )
                if (!shouldContinue) {
                  break
                }
              }

              const currentItem = items[i]
              const isFirst = i === 0
              const isLast = i === totalItems - 1

              results[nodeId] = {
                item: currentItem,
                index: i,
                iteration: i + 1,
                total: totalItems,
                isFirst,
                isLast,
                results: iterationResults,
                successCount,
                failureCount,
                completed: false,
                branch: "loop",
              }

              step.output = {
                branch: "loop",
                iteration: i + 1,
                total: totalItems,
                item: currentItem as DeserializedJson,
              }
              metadata.set("steps", steps)
              await metadata.flush()

              if (delayMs > 0 && i > 0) {
                await new Promise((r) => setTimeout(r, delayMs))
              }

              // Emit pending step for the initial loop branch node(s) so that the wire animates blue with traveling particle
              for (const edge of loopEdges) {
                const subNode = byId.get(edge.target)
                if (subNode) {
                  const subDef = nodeRegistry[subNode.data.type]
                  const subType = subNode.data.type as NodeType
                  const subTitle =
                    subNode.data.title || subDef?.label || subType
                  const subKind =
                    subNode.data.kind || subDef?.kind || "action"
                  steps.push({
                    id: crypto.randomUUID(),
                    nodeId: edge.target,
                    edgeId: edge.id,
                    type: subType,
                    title: subTitle,
                    kind: subKind,
                    status: "pending",
                  })
                }
              }
              metadata.set("steps", steps)
              await metadata.flush()
              if (!triggerData) {
                await new Promise((r) => setTimeout(r, 400))
              }

              // Execute the entire loop branch for this iteration using DFS
              const branchQueue: QueueItem[] = loopEdges.map((e) => ({
                nodeId: e.target,
                edgeId: e.id,
              }))

              let lastBranchResult: unknown = currentItem
              let iterationHasFailure = false
              const iterationCompletedNodes = new Set<string>()

              while (branchQueue.length > 0) {
                if (signal?.aborted) {
                  throw new Error("Workflow run was canceled")
                }

                const subItem = branchQueue.shift()!
                const subNodeId = subItem.nodeId
                const subEdgeId = subItem.edgeId
                const subNode = byId.get(subNodeId)
                if (!subNode) continue

                const subDef = nodeRegistry[subNode.data.type]
                const subType = subNode.data.type as NodeType
                const subTitle =
                  subNode.data.title || subDef?.label || subType
                const subKind =
                  subNode.data.kind || subDef?.kind || "action"

                const subStartedAt = Date.now()
                let subStep = steps.find(
                  (s) =>
                    (subEdgeId
                      ? s.edgeId === subEdgeId
                      : s.nodeId === subNodeId || s.id === subNodeId) &&
                    s.status === "pending"
                )

                if (!subStep) {
                  subStep = {
                    id: crypto.randomUUID(),
                    nodeId: subNodeId,
                    edgeId: subEdgeId,
                    type: subType,
                    title: subTitle,
                    kind: subKind,
                    status: "running",
                    startedAt: subStartedAt,
                  }
                  steps.push(subStep)
                } else {
                  subStep.status = "running"
                  subStep.startedAt = subStartedAt
                }

                metadata.set("steps", steps)
                await metadata.flush()

                try {
                  const subResult = await executeStep({
                    node: subNode,
                    results,
                    secrets: orgSecrets,
                    triggerData,
                    outgoingEdges,
                    incomingEdges,
                    activeEdges,
                    disabledEdges,
                    failedBranches,
                    byId,
                    getStagehand: browserManager.getStagehand,
                  })

                  iterationCompletedNodes.add(subNodeId)
                  completedNodeIds.add(subNodeId)

                  const subCompletedAt = Date.now()
                  subStep.status = "done"
                  subStep.completedAt = subCompletedAt
                  subStep.duration = subCompletedAt - subStartedAt
                  subStep.durationMs = subCompletedAt - subStartedAt
                  subStep.output =
                    (subResult as DeserializedJson) ?? { completed: true }
                  lastBranchResult = subResult

                  const { readyChildren, pendingSteps } =
                    discoverNextReadyChildren({
                      nodeId: subNodeId,
                      outgoingEdges,
                      incomingEdges,
                      activeEdges,
                      disabledEdges,
                      completedNodeIds: iterationCompletedNodes,
                      failedNodeIds,
                      byId,
                    })

                  steps.push(...pendingSteps)
                  branchQueue.unshift(...readyChildren)

                  metadata.set("steps", steps)
                  await metadata.flush()
                } catch (subErr) {
                  iterationHasFailure = true
                  const isAbort =
                    signal?.aborted ||
                    (subErr instanceof Error &&
                      subErr.message.includes("canceled"))

                  const subCompletedAt = Date.now()
                  subStep.status = isAbort ? "canceled" : "failed"
                  subStep.completedAt = subCompletedAt
                  subStep.duration = subCompletedAt - subStartedAt
                  subStep.durationMs = subCompletedAt - subStartedAt
                  subStep.error = isAbort
                    ? "Workflow run was canceled"
                    : subErr instanceof Error
                      ? subErr.message
                      : String(subErr)

                  metadata.set("steps", steps)
                  await metadata.flush()

                  if (isAbort || onItemFailure === "halt") {
                    throw subErr
                  }

                  lastBranchResult = {
                    error:
                      subErr instanceof Error
                        ? subErr.message
                        : String(subErr),
                  }
                  break
                }
              }

              if (iterationHasFailure) {
                failureCount++
              } else {
                successCount++
              }

              iterationResults.push(lastBranchResult)
            }

            const finalOutput = {
              item: items[items.length - 1] ?? null,
              index: iterationResults.length - 1,
              iteration: iterationResults.length,
              total: iterationResults.length,
              isFirst: false,
              isLast: true,
              results: iterationResults,
              successCount,
              failureCount,
              completed: true,
              branch: "done",
            }
            results[nodeId] = finalOutput

            for (const edge of loopEdges) {
              disabledEdges.add(edge.id)
              activeEdges.delete(edge.id)
            }
            for (const edge of doneEdges) {
              activeEdges.add(edge.id)
            }

            completedNodeIds.add(nodeId)
            const completedAt = Date.now()
            step.status = "done"
            step.completedAt = completedAt
            step.duration = completedAt - startedAt
            step.durationMs = completedAt - startedAt
            step.output = finalOutput as DeserializedJson

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
          continue
        }

        try {
          const result = await executeStep({
            node,
            results,
            secrets: orgSecrets,
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
