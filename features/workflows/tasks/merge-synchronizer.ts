import type { Edge } from "@xyflow/react"
import type { StepNodeType } from "../nodes/node-registry"
import type { QueueItem, RunStep } from "./types"
import { cascadeDisabledEdges } from "./graph-traversal"

/**
 * Recursively finds all ancestor nodes of unchosen incoming branches to a Merge node
 * that have not yet executed and should be pruned.
 */
export function getBranchAncestorNodeIds(
  rootNodeIds: string[],
  incomingEdges: Map<string, Edge[]>,
  completedNodeIds: Set<string>
): Set<string> {
  const result = new Set<string>()
  const queue = [...rootNodeIds]
  while (queue.length > 0) {
    const curr = queue.shift()!
    if (!result.has(curr) && !completedNodeIds.has(curr)) {
      result.add(curr)
      const inEdges = incomingEdges.get(curr) || []
      for (const inE of inEdges) {
        if (inE.source && !completedNodeIds.has(inE.source)) {
          queue.push(inE.source)
        }
      }
    }
  }
  return result
}

export interface EvaluateMergeReadinessParams {
  nodeId: string
  edge: Edge
  targetId: string
  childNode: StepNodeType
  incomingEdges?: Map<string, Edge[]>
  outgoingEdges: Map<string, Edge[]>
  activeEdges: Set<string>
  disabledEdges: Set<string>
  completedNodeIds: Set<string>
  failedNodeIds: Set<string>
  byId: Map<string, StepNodeType>
}

export interface EvaluateMergeReadinessResult {
  isReady: boolean
  edgeId?: string
}

/**
 * Evaluates whether a Merge node is ready to execute based on its mode:
 * - "first" (Pass-Through / Winner): Ready as soon as the first active branch finishes.
 * - "combine" & "array": Ready when ALL incoming branches have resolved (active & done, or pruned/failed).
 */
export function evaluateMergeReadiness({
  nodeId,
  edge,
  targetId,
  childNode,
  incomingEdges,
  outgoingEdges,
  activeEdges,
  disabledEdges,
  completedNodeIds,
  failedNodeIds,
  byId,
}: EvaluateMergeReadinessParams): EvaluateMergeReadinessResult {
  if (!incomingEdges) {
    return { isReady: false }
  }

  const inEdges = incomingEdges.get(targetId) || []
  const mode = childNode.data.values?.mode || "combine"

  if (mode === "first") {
    // Pass-Through / First Winner mode:
    // The first active branch that completes triggers Merge immediately and prunes other branches
    const isCurrentActive = activeEdges.has(edge.id)
    const isCurrentCompleted =
      (completedNodeIds.has(nodeId) || nodeId === edge.source) &&
      !failedNodeIds.has(nodeId)

    if (isCurrentActive && isCurrentCompleted) {
      activeEdges.add(edge.id)

      // Prune other remaining incoming edges
      const newlyPruned: string[] = []
      for (const inEdge of inEdges) {
        if (inEdge.id !== edge.id) {
          disabledEdges.add(inEdge.id)
          newlyPruned.push(inEdge.id)
        }
      }
      if (newlyPruned.length > 0) {
        cascadeDisabledEdges(newlyPruned, outgoingEdges, disabledEdges, byId)
      }
      return { isReady: true, edgeId: edge.id }
    } else {
      // If current branch was disabled or failed, check if any other branch is still running
      let hasPending = false
      for (const inEdge of inEdges) {
        if (!disabledEdges.has(inEdge.id) && !failedNodeIds.has(inEdge.source)) {
          hasPending = true
          break
        }
      }
      if (!hasPending) {
        const mergeOutEdges = outgoingEdges.get(targetId) || []
        for (const outE of mergeOutEdges) {
          disabledEdges.add(outE.id)
        }
      }
      return { isReady: false }
    }
  }

  // Standard "combine" and "array" modes: wait for all incoming branches to resolve
  let allResolved = true
  let hasActiveIncoming = false

  for (const inEdge of inEdges) {
    const isEdgeDisabled = disabledEdges.has(inEdge.id)
    const isEdgeActive = activeEdges.has(inEdge.id)
    const isSourceCompleted =
      completedNodeIds.has(inEdge.source) ||
      inEdge.source === nodeId ||
      failedNodeIds.has(inEdge.source)

    if (isEdgeDisabled) {
      // Pruned branch is resolved
      continue
    }

    if (isEdgeActive && isSourceCompleted) {
      if (!failedNodeIds.has(inEdge.source)) {
        hasActiveIncoming = true
      }
      continue
    }

    // Branch is still pending / unresolved upstream
    allResolved = false
    break
  }

  if (!allResolved) {
    // Hold Merge node until other parallel branches finish or prune
    return { isReady: false }
  }

  if (hasActiveIncoming) {
    activeEdges.add(edge.id)
    return { isReady: true, edgeId: edge.id }
  } else {
    // All incoming branches were pruned or failed -> cascade disable
    const mergeOutEdges = outgoingEdges.get(targetId) || []
    for (const outE of mergeOutEdges) {
      disabledEdges.add(outE.id)
    }
    return { isReady: false }
  }
}

export interface PurgeSiblingBranchesParams {
  readyChildren: QueueItem[]
  incomingEdges: Map<string, Edge[]>
  completedNodeIds: Set<string>
  disabledEdges: Set<string>
  readyQueue: QueueItem[]
  steps: RunStep[]
  byId: Map<string, StepNodeType>
  currentNodeId: string
}

/**
 * When a Merge node is triggered in "first" (Pass-Through / Winner) mode,
 * removes any pending queue items from unchosen sibling branches and marks them skipped.
 */
export function purgeUnchosenSiblingBranches({
  readyChildren,
  incomingEdges,
  completedNodeIds,
  disabledEdges,
  readyQueue,
  steps,
  byId,
  currentNodeId,
}: PurgeSiblingBranchesParams): void {
  for (const child of readyChildren) {
    const childNode = byId.get(child.nodeId)
    if (
      childNode &&
      childNode.data?.type === "merge" &&
      childNode.data.values?.mode === "first"
    ) {
      const inEdges = incomingEdges.get(childNode.id) || []
      const unchosenRootSourceIds = inEdges
        .filter((inE) => inE.source && inE.source !== currentNodeId)
        .map((inE) => inE.source)

      const siblingBranchNodeIds = getBranchAncestorNodeIds(
        unchosenRootSourceIds,
        incomingEdges,
        completedNodeIds
      )

      // Purge unchosen sibling branch items from readyQueue
      for (let i = readyQueue.length - 1; i >= 0; i--) {
        const item = readyQueue[i]
        const qNodeId = typeof item === "string" ? item : item.nodeId
        const qEdgeId = typeof item === "string" ? undefined : item.edgeId

        if (
          siblingBranchNodeIds.has(qNodeId) ||
          (qEdgeId && disabledEdges.has(qEdgeId))
        ) {
          readyQueue.splice(i, 1)

          // Mark pending step for purged node as skipped
          const s = steps.find(
            (step) =>
              (qEdgeId ? step.edgeId === qEdgeId : (step.nodeId === qNodeId || step.id === qNodeId)) &&
              step.status === "pending"
          )
          if (s) {
            s.status = "skipped"
          }
        }
      }
    }
  }
}
