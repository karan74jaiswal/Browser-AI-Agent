import type { WorkflowGraph } from "@/lib/db"
import type { StepNodeType } from "@/features/workflows/nodes/node-registry"
import type { Edge } from "@xyflow/react"
import type { WorkflowTemplate } from "../types"

/**
 * Replaces all token references matching {{ oldNodeId.path }} with {{ newNodeId.path }}
 * across any string template or nested JSON structure.
 */
export function remapTokenString(
  templateStr: string,
  idMap: Map<string, string>
): string {
  if (!templateStr || typeof templateStr !== "string") return templateStr

  return templateStr.replace(
    /\{\{\s*([a-zA-Z0-9_-]+)(?:\.([^}\s]+))?\s*\}\}/g,
    (fullMatch, oldNodeId: string, path: string | undefined) => {
      const lower = oldNodeId.toLowerCase().trim()
      if (lower === "secrets" || lower === "vault" || lower === "secret") {
        return fullMatch
      }
      const newNodeId = idMap.get(oldNodeId)
      if (newNodeId) {
        const pathSuffix = path ? `.${path}` : ""
        return `{{ ${newNodeId}${pathSuffix} }}`
      }
      return fullMatch
    }
  )
}

/**
 * Clones a template's workflow graph, generating brand new unique IDs for all nodes and edges,
 * remapping token references and handles, and generating fresh webhook secrets for triggers.
 */
export function cloneTemplateGraph(template: WorkflowTemplate): WorkflowGraph {
  const originalNodes = template.graph.nodes ?? []
  const originalEdges = template.graph.edges ?? []

  const idMap = new Map<string, string>()
  for (const node of originalNodes) {
    idMap.set(node.id, crypto.randomUUID())
  }

  const clonedNodes: StepNodeType[] = originalNodes.map((node) => {
    const newId = idMap.get(node.id) || crypto.randomUUID()
    const nodeType = node.data?.type
    const rawValues = node.data?.values ?? {}
    const newValues: Record<string, string> = {}

    for (const [key, val] of Object.entries(rawValues)) {
      if (typeof val === "string") {
        newValues[key] = remapTokenString(val, idMap)
      } else {
        newValues[key] = val
      }
    }

    // Generate fresh webhook secret for trigger nodes requiring webhook isolation
    if (
      nodeType === "stripe-trigger" ||
      nodeType === "google-form-trigger" ||
      node.data?.kind === "trigger"
    ) {
      if (rawValues.secret || nodeType === "stripe-trigger" || nodeType === "google-form-trigger") {
        newValues.secret = `whsec_${crypto.randomUUID().replace(/-/g, "")}`
      }
    }

    return {
      id: newId,
      type: "step",
      position: {
        x: Math.round(node.position?.x ?? 0),
        y: Math.round(node.position?.y ?? 0),
      },
      data: {
        type: node.data.type,
        kind: node.data.kind,
        title: node.data.title,
        values: newValues,
      },
    }
  })

  const clonedEdges: Edge[] = originalEdges.map((edge) => ({
    id: crypto.randomUUID(),
    source: idMap.get(edge.source) || edge.source,
    target: idMap.get(edge.target) || edge.target,
    sourceHandle: edge.sourceHandle ?? null,
    targetHandle: edge.targetHandle ?? null,
  }))

  return {
    nodes: clonedNodes,
    edges: clonedEdges,
  }
}
