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

    for (const [key, rawVal] of Object.entries(values)) {
      if (node.data?.type === "if" && key === "conditions") continue
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

    if (node.data?.type === "if") {
      try {
        if (values.conditions) {
          const criteria = JSON.parse(values.conditions)
          if (Array.isArray(criteria)) {
            for (let i = 0; i < criteria.length; i++) {
              const criterion = criteria[i]
              if (!criterion.left?.trim()) {
                problems.push(
                  `Condition ${i + 1} on "${node.data?.title || "If"}" is missing a left value/token.`
                )
              }

              const fieldValues = [criterion.left, criterion.right].filter(
                (v): v is string => typeof v === "string" && v.length > 0
              )
              for (const fieldVal of fieldValues) {
                const refs = extractAllTokenReferences(fieldVal)
                for (const ref of refs) {
                  const sourceNode = nodeById.get(ref.nodeId)
                  if (!sourceNode) {
                    problems.push(
                      `Condition ${i + 1} on "${node.data?.title || "If"}" references a deleted step.`
                    )
                  } else if (!ancestors.has(ref.nodeId)) {
                    problems.push(
                      `Condition ${i + 1} on "${node.data?.title || "If"}" references "${sourceNode.data?.title || "Step"}", but they are not connected.`
                    )
                  }
                }
              }
            }
          }
        }
      } catch {}
    }
  }

  return problems
}
