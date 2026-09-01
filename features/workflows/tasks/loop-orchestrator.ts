import { metadata } from "@trigger.dev/sdk"
import type { DeserializedJson } from "@trigger.dev/core"
import type { Edge } from "@xyflow/react"
import type { Stagehand } from "@browserbasehq/stagehand"
import { nodeRegistry, type NodeType, type StepNodeType } from "../nodes/node-registry"
import type { QueueItem, RunStep } from "./types"
import { discoverNextReadyChildren } from "./graph-traversal"
import { executeSingleNodeStep } from "./single-step-runner"
import { interpolate, type ConditionCriterion } from "../lib"
import {
  parseLoopItems,
  parseMaxIterations,
  shouldContinueWhileLoop,
  type LoopMode,
  type WhileRuleMode,
  type LoopFailurePolicy,
} from "../nodes/loop"

export interface ExecuteLoopStepParams {
  nodeId: string
  edgeId?: string
  byId: Map<string, StepNodeType>
  steps: RunStep[]
  results: Record<string, unknown>
  secrets?: Record<string, string>
  triggerData?: Record<string, unknown>
  outgoingEdges: Map<string, Edge[]>
  incomingEdges: Map<string, Edge[]>
  activeEdges: Set<string>
  disabledEdges: Set<string>
  completedNodeIds: Set<string>
  failedNodeIds: Set<string>
  failedBranches: Array<{ nodeId: string; title?: string; error: string }>
  getStagehand: () => Promise<Stagehand>
  signal?: AbortSignal
  readyQueue: QueueItem[]
}

/**
 * Orchestrates loop execution:
 * 1. Parses items / count / condition modes.
 * 2. Manages per-iteration state, UI pulsing animations, and DFS branch traversal.
 * 3. Handles error policies (continue vs halt).
 * 4. Activates done handle upon completion and enqueues downstream steps.
 */
export async function executeLoopStep({
  nodeId,
  edgeId,
  byId,
  steps,
  results,
  secrets,
  triggerData,
  outgoingEdges,
  incomingEdges,
  activeEdges,
  disabledEdges,
  completedNodeIds,
  failedNodeIds,
  failedBranches,
  getStagehand,
  signal,
  readyQueue,
}: ExecuteLoopStepParams): Promise<void> {
  const node = byId.get(nodeId)
  if (!node) return

  const def = nodeRegistry[node.data.type]
  const type = node.data.type as NodeType
  const title = node.data.title || def?.label || node.data.type || "Loop"
  const kind = node.data.kind || def?.kind || "action"

  let step = steps.find(
    (s) =>
      (edgeId ? s.edgeId === edgeId : s.nodeId === nodeId || s.id === nodeId) &&
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

  const rawMode = (node.data.values?.mode || "for_each") as LoopMode
  const itemsInput = node.data.values?.items
  const countStr = node.data.values?.count
  const rawMax = node.data.values?.maxIterations
  const delayMs = parseInt(node.data.values?.batchDelayMs || "0", 10)
  const onItemFailure = (node.data.values?.onItemFailure || "continue") as LoopFailurePolicy
  const whileRuleMode = (node.data.values?.whileRuleMode || "until") as WhileRuleMode
  let conditions: ConditionCriterion[] = []
  try {
    conditions = JSON.parse(node.data.values?.conditions || "[]")
  } catch {}

  const interpolatedItemsInput = interpolate(itemsInput, results)
  const interpolatedCountStr = interpolate(countStr, results)
  const maxCap = parseMaxIterations(interpolate(rawMax, results))
  const items = parseLoopItems(interpolatedItemsInput, rawMode, interpolatedCountStr, maxCap)

  const outEdges = outgoingEdges.get(nodeId) || []
  const doneEdges = outEdges.filter(
    (e) => (e.sourceHandle || (e as { sourceHandleId?: string }).sourceHandleId) === "done"
  )
  const loopEdges = outEdges.filter((e) => {
    const h = e.sourceHandle || (e as { sourceHandleId?: string }).sourceHandleId
    return h === "loop" || h === "body"
  })

  // Upper branch first (by canvas Y position)
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
      ? shouldContinueWhileLoop(conditions, "and", whileRuleMode, results)
      : true

  if (items.length === 0 || (rawMode === "while" && !initialWhileContinue)) {
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

    for (const edge of doneEdges) activeEdges.add(edge.id)
    for (const edge of loopEdges) disabledEdges.add(edge.id)

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
    for (const edge of loopEdges) activeEdges.add(edge.id)

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
        if (!shouldContinue) break
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
          const subTitle = subNode.data.title || subDef?.label || subType
          const subKind = subNode.data.kind || subDef?.kind || "action"
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

      // Execute the entire loop branch for this iteration using DFS and single-step runner
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
        const subNode = byId.get(subItem.nodeId)
        if (!subNode) continue

        if (subNode.data.type === "loop") {
          try {
            await executeLoopStep({
              nodeId: subItem.nodeId,
              edgeId: subItem.edgeId,
              byId,
              steps,
              results,
              secrets,
              triggerData,
              outgoingEdges,
              incomingEdges,
              activeEdges,
              disabledEdges,
              completedNodeIds: iterationCompletedNodes,
              failedNodeIds,
              failedBranches,
              getStagehand,
              signal,
              readyQueue: branchQueue,
            })
            iterationCompletedNodes.add(subItem.nodeId)
            completedNodeIds.add(subItem.nodeId)
            lastBranchResult = results[subItem.nodeId]
          } catch (nestedErr) {
            iterationHasFailure = true
            if (onItemFailure === "halt") {
              throw nestedErr
            }
            lastBranchResult = {
              error:
                nestedErr instanceof Error
                  ? nestedErr.message
                  : String(nestedErr),
            }
            break
          }
          continue
        }

        const res = await executeSingleNodeStep({
          nodeId: subItem.nodeId,
          edgeId: subItem.edgeId,
          byId,
          steps,
          results,
          secrets,
          triggerData,
          outgoingEdges,
          incomingEdges,
          activeEdges,
          disabledEdges,
          completedNodeIds: iterationCompletedNodes,
          failedNodeIds,
          failedBranches,
          getStagehand,
          signal,
        })

        if (res.isFailure) {
          iterationHasFailure = true
          if (onItemFailure === "halt") {
            throw res.error || new Error("Step in loop branch failed")
          }
          lastBranchResult = { error: res.step?.error || "Step failed" }
          break
        }

        iterationCompletedNodes.add(subItem.nodeId)
        completedNodeIds.add(subItem.nodeId)
        lastBranchResult = res.result
        branchQueue.unshift(...res.readyChildren)
      }

      if (iterationHasFailure) failureCount++
      else successCount++

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
}
