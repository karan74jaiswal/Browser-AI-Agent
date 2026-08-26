import toposort from "toposort"
import { WorkflowGraph } from "@/lib/db"
import { extractAllTokenReferences } from "./parse-token-reference"

export function validateGraph({ edges, nodes }: WorkflowGraph): string[] {
  const problems: string[] = []
  const triggerNodes = nodes.filter(
    (node) => node.data.kind == "trigger"
  ).length

  if (nodes.length == 0)
    problems.push("A workflow needs one or more nodes to run")
  if (triggerNodes !== 1)
    problems.push(
      `A workflow needs exactly one trigger, found (${triggerNodes}).`
    )
  if (edges.length == 0) problems.push("Connect your nodes before running")
  else {
    try {
      toposort(edges.map((e) => [e.source, e.target]))
    } catch {
      problems.push("Workflow has a cycle, remove the loop before running")
    }
  }

  // Check for disconnected or deleted token references
  const nodeById = new Map(nodes.map((n) => [n.id, n]))
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

  const getAncestorNodeIds = (startNodeId: string): Set<string> => {
    const ancestors = new Set<string>()
    const queue = [...(targetToSources.get(startNodeId) || [])]
    while (queue.length > 0) {
      const current = queue.shift()!
      if (!ancestors.has(current)) {
        ancestors.add(current)
        const parents = targetToSources.get(current) || []
        for (const p of parents) {
          if (!ancestors.has(p)) queue.push(p)
        }
      }
    }
    return ancestors
  }

  for (const node of nodes) {
    const values = node.data?.values ?? {}
    const ancestors = getAncestorNodeIds(node.id)

    for (const rawVal of Object.values(values)) {
      if (typeof rawVal !== "string") continue
      const refs = extractAllTokenReferences(rawVal)
      for (const ref of refs) {
        const sourceNode = nodeById.get(ref.nodeId)
        if (!sourceNode) {
          problems.push(
            `"${node.data?.title || "Step"}" references a deleted step.`
          )
        } else if (!ancestors.has(ref.nodeId)) {
          problems.push(
            `"${node.data?.title || "Step"}" references "${sourceNode.data?.title || "Step"}", but they are not connected.`
          )
        }
      }
    }
  }

  return problems
}
