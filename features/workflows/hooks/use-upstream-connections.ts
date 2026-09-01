import { useMemo } from "react"
import { useEdges, useNodes, type Edge, type Node } from "@xyflow/react"

import {
  nodeRegistry,
  type NodeType,
  type StepNodeType,
} from "@/features/workflows/nodes/node-registry"

export type UpstreamConnection = {
  token: string
  label: string
  type: NodeType
  nodeId: string
  path: string
}

/**
 * Pure helper that extracts all declared outputs from every ancestor node upstream
 * of the given target node in a workflow graph.
 *
 * @param node - The selected / target node.
 * @param nodes - Array of all nodes in the flow.
 * @param edges - Array of all edges in the flow.
 * @returns Array of upstream connections with ready-to-insert tokens, friendly labels, and node types.
 */
export function getUpstreamConnections(
  node: StepNodeType | Node | null | undefined,
  nodes: (StepNodeType | Node)[],
  edges: Edge[]
): UpstreamConnection[] {
  if (!node || !node.id) {
    return []
  }

  // Map each target node ID to its upstream source node IDs
  const targetToSources = new Map<string, string[]>()
  for (const edge of edges) {
    if (!edge.source || !edge.target) continue
    const sources = targetToSources.get(edge.target)
    if (sources) {
      sources.push(edge.source)
    } else {
      targetToSources.set(edge.target, [edge.source])
    }
  }

  // Lookup map for fast node retrieval by ID
  const nodeById = new Map<string, StepNodeType | Node>()
  for (const n of nodes) {
    nodeById.set(n.id, n)
  }

  // BFS to traverse all upstream ancestor nodes (preventing cycles/duplicates)
  const upstreamNodes: (StepNodeType | Node)[] = []
  const visited = new Set<string>([node.id])
  const queue: string[] = []

  const directParents = targetToSources.get(node.id) || []
  for (const parentId of directParents) {
    if (!visited.has(parentId)) {
      visited.add(parentId)
      queue.push(parentId)
    }
  }

  while (queue.length > 0) {
    const currentId = queue.shift()!
    const currentNode = nodeById.get(currentId)
    if (currentNode) {
      upstreamNodes.push(currentNode)
    }

    const parents = targetToSources.get(currentId) || []
    for (const parentId of parents) {
      if (!visited.has(parentId)) {
        visited.add(parentId)
        queue.push(parentId)
      }
    }
  }

  // Collect declared outputs from each upstream node
  const connections: UpstreamConnection[] = []
  for (const upstreamNode of upstreamNodes) {
    const data = upstreamNode.data as StepNodeType["data"] | undefined
    if (!data?.type) continue

    const nodeType = data.type as NodeType
    const def = nodeRegistry[nodeType]
    if (!def) continue

    const nodeTitle = data.title || def.label || nodeType
    const outputs = def.outputs || []

    for (const output of outputs) {
      connections.push({
        token: `{{ ${upstreamNode.id}.${output.path} }}`,
        label: `${nodeTitle} · ${output.label}`,
        type: nodeType,
        nodeId: upstreamNode.id,
        path: output.path,
      })
    }
  }

  return connections
}

/**
 * Hook that returns every output produced by any node upstream of the currently selected node.
 * Each output includes a ready-to-insert `{{ }}` token, a friendly label (e.g. "Open URL 1 · Title"),
 * and the source node's type.
 *
 * Traverses all connections back up the graph (not just direct parents) and re-computes
 * automatically as edges or nodes change.
 *
 * @param node - The currently selected node.
 * @returns Array of upstream connections.
 */
export function useUpstreamConnections(
  node?: StepNodeType | Node | null
): UpstreamConnection[] {
  const nodes = useNodes<StepNodeType>()
  const edges = useEdges()

  // Structural fingerprint: only changes when node IDs, types, titles, or connections change (ignores x, y coordinate dragging)
  const structuralKey = useMemo(() => {
    if (!node?.id) return ""
    const nodesDigest = nodes
      .map((n) => `${n.id}:${n.data?.type ?? ""}:${n.data?.title ?? ""}`)
      .join("|")
    const edgesDigest = edges.map((e) => `${e.source}->${e.target}`).join("|")
    return `${node.id}#${nodesDigest}#${edgesDigest}`
  }, [node?.id, nodes, edges])

  return useMemo(() => {
    return getUpstreamConnections(node, nodes, edges)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [structuralKey])
}
