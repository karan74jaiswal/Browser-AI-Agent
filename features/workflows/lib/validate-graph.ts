import toposort from "toposort"
import { WorkflowGraph } from "@/lib/db"

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
  return problems
}
