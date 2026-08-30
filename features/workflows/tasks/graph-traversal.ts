import type { Edge } from "@xyflow/react"
import {
  nodeRegistry,
  type NodeType,
  type StepNodeType,
} from "../nodes/node-registry"
import type { QueueItem, RunStep } from "./types"

/**
 * Builds incoming and outgoing edge index maps for fast graph traversal lookups.
 */
export function buildEdgeMaps(edges: Edge[]) {
  const incomingEdges = new Map<string, Edge[]>()
  const outgoingEdges = new Map<string, Edge[]>()

  for (const edge of edges) {
    if (!edge.source || !edge.target) continue

    const inList = incomingEdges.get(edge.target) || []
    inList.push(edge)
    incomingEdges.set(edge.target, inList)

    const outList = outgoingEdges.get(edge.source) || []
    outList.push(edge)
    outgoingEdges.set(edge.source, outList)
  }

  return { incomingEdges, outgoingEdges }
}

/**
 * Recursively propagates disabled edges down non-merge branches so downstream
 * Merge nodes know that incoming paths were pruned.
 */
export function cascadeDisabledEdges(
  edgeIds: string[],
  outgoingEdges: Map<string, Edge[]>,
  disabledEdges: Set<string>,
  byId: Map<string, StepNodeType>
): void {
  const queue = [...edgeIds]
  while (queue.length > 0) {
    const edgeId = queue.shift()!
    disabledEdges.add(edgeId)

    for (const [, edges] of outgoingEdges.entries()) {
      const matchedEdge = edges.find((e) => e.id === edgeId)
      if (matchedEdge && matchedEdge.target) {
        const targetNode = byId.get(matchedEdge.target)
        if (targetNode && targetNode.data?.type !== "merge") {
          const childOutEdges = outgoingEdges.get(matchedEdge.target) || []
          for (const childEdge of childOutEdges) {
            if (!disabledEdges.has(childEdge.id)) {
              disabledEdges.add(childEdge.id)
              queue.push(childEdge.id)
            }
          }
        }
      }
    }
  }
}

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

/**
 * Finds the starting trigger node of the workflow.
 */
export function findTriggerNode(nodes: StepNodeType[]): StepNodeType {
  const triggerNode =
    nodes.find((n) => n.data?.kind === "trigger") || nodes[0]
  if (!triggerNode) {
    throw new Error("No start node found in workflow")
  }
  return triggerNode
}

/**
 * Discovers downstream connected children from active edges, registers them
 * as pending steps for canvas animation, and sorts sibling branches top-to-bottom
 * by canvas Y-coordinate for DFS prioritization.
 *
 * For "merge" nodes, it verifies that all incoming branch paths have resolved
 * (either active & completed, or disabled / failed) before enqueuing execution.
 */
export function discoverNextReadyChildren({
  nodeId,
  outgoingEdges,
  incomingEdges,
  activeEdges,
  disabledEdges = new Set(),
  completedNodeIds = new Set(),
  failedNodeIds = new Set(),
  byId,
}: {
  nodeId: string
  outgoingEdges: Map<string, Edge[]>
  incomingEdges?: Map<string, Edge[]>
  activeEdges: Set<string>
  disabledEdges?: Set<string>
  completedNodeIds?: Set<string>
  failedNodeIds?: Set<string>
  byId: Map<string, StepNodeType>
}): {
  readyChildren: QueueItem[]
  pendingSteps: RunStep[]
} {
  const outEdges = outgoingEdges.get(nodeId) || []
  const newReadyChildren: QueueItem[] = []
  const pendingSteps: RunStep[] = []

  for (const edge of outEdges) {
    if (!activeEdges.has(edge.id)) continue

    const targetId = edge.target
    if (!targetId) continue

    const childNode = byId.get(targetId)
    if (!childNode) continue

    // Handle Merge / Join node synchronization across multiple branches
    if (childNode.data?.type === "merge" && incomingEdges) {
      if (completedNodeIds.has(targetId) || newReadyChildren.some((c) => c.nodeId === targetId)) {
        continue
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
          newReadyChildren.push({ nodeId: targetId, edgeId: edge.id })

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
          continue
        }
      } else {
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
          continue
        }

        if (hasActiveIncoming) {
          activeEdges.add(edge.id)
          newReadyChildren.push({ nodeId: targetId, edgeId: edge.id })
        } else {
          // All incoming branches were pruned or failed -> cascade disable
          const mergeOutEdges = outgoingEdges.get(targetId) || []
          for (const outE of mergeOutEdges) {
            disabledEdges.add(outE.id)
          }
          continue
        }
      }
    } else {
      // Standard single-parent node
      newReadyChildren.push({ nodeId: targetId, edgeId: edge.id })
    }

    // Register child node as "pending" for canvas handoff animation
    const childDef = nodeRegistry[childNode.data.type]
    pendingSteps.push({
      id: crypto.randomUUID(),
      nodeId: targetId,
      edgeId: edge.id,
      type: childNode.data.type as NodeType,
      title:
        childNode.data.title ||
        childDef?.label ||
        childNode.data.type ||
        "Step",
      kind: childNode.data.kind || childDef?.kind || "action",
      status: "pending",
    })
  }

  // Top-to-Bottom Canvas Priority: Sort sibling branches by canvas Y-coordinate
  newReadyChildren.sort((a, b) => {
    const nodeA = byId.get(a.nodeId)
    const nodeB = byId.get(b.nodeId)
    const yA = nodeA?.position?.y ?? 0
    const yB = nodeB?.position?.y ?? 0
    if (yA !== yB) return yA - yB

    const xA = nodeA?.position?.x ?? 0
    const xB = nodeB?.position?.x ?? 0
    return xA - xB
  })

  return { readyChildren: newReadyChildren, pendingSteps }
}
