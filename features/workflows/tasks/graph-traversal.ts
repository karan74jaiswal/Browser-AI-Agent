import type { Edge } from "@xyflow/react"
import {
  nodeRegistry,
  type NodeType,
  type StepNodeType,
} from "../nodes/node-registry"
import type { QueueItem, RunStep } from "./types"
import { evaluateMergeReadiness } from "./merge-synchronizer"

// Re-export getBranchAncestorNodeIds for backward compatibility
export { getBranchAncestorNodeIds } from "./merge-synchronizer"

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
 * Finds the starting trigger node of the workflow.
 */
export function findTriggerNode(nodes: StepNodeType[]): StepNodeType {
  const triggerNode = nodes.find((n) => n.data?.kind === "trigger") || nodes[0]
  if (!triggerNode) {
    throw new Error("No start node found in workflow")
  }
  return triggerNode
}

/**
 * Discovers downstream connected children from active edges, registers them
 * as pending steps for canvas animation, and sorts sibling branches top-to-bottom
 * by canvas Y-coordinate for DFS prioritization.
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
    const targetId = edge.target
    if (!targetId) continue

    const childNode = byId.get(targetId)
    if (!childNode) continue

    // Handle Merge / Join node synchronization across multiple branches
    if (childNode.data?.type === "merge" && incomingEdges) {
      if (
        completedNodeIds.has(targetId) ||
        newReadyChildren.some((c) => c.nodeId === targetId)
      ) {
        continue
      }

      const { isReady, edgeId } = evaluateMergeReadiness({
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
      })

      if (!isReady || !edgeId) continue
      newReadyChildren.push({ nodeId: targetId, edgeId })

      // Register child node as "pending" for canvas handoff animation
      const childDef = nodeRegistry[childNode.data.type]
      pendingSteps.push({
        id: crypto.randomUUID(),
        nodeId: targetId,
        edgeId,
        type: childNode.data.type as NodeType,
        title:
          childNode.data.title ||
          childDef?.label ||
          childNode.data.type ||
          "Step",
        kind: childNode.data.kind || childDef?.kind || "action",
        status: "pending",
      })
    } else {
      // Standard single-parent node (Option B: requires active edge)
      if (!activeEdges.has(edge.id)) continue
      newReadyChildren.push({ nodeId: targetId, edgeId: edge.id })

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
