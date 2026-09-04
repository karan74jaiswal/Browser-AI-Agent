import { z } from "zod"
import {
  nodeRegistry,
  type StepNodeType,
} from "@/features/workflows/system"
import type { WorkflowGraph } from "@/lib/db"

export const WorkflowExportSchema = z.object({
  $schema: z.string().optional(),
  version: z.string().default("1.0"),
  name: z.string().min(1, "Workflow name is required"),
  description: z.string().optional(),
  exportedAt: z.string().optional(),
  graph: z.object({
    nodes: z.array(
      z.object({
        id: z.string(),
        type: z.string().default("step"),
        position: z.object({
          x: z.number(),
          y: z.number(),
        }),
        data: z.object({
          kind: z.enum(["trigger", "action"]).default("action"),
          title: z.string().default("Step"),
          type: z.string(),
          values: z.record(z.string(), z.unknown()).default({}),
        }),
      })
    ),
    edges: z.array(
      z.object({
        id: z.string(),
        source: z.string(),
        target: z.string(),
        sourceHandle: z.string().nullable().optional(),
        targetHandle: z.string().nullable().optional(),
        type: z.string().optional(),
      })
    ),
  }),
})

export type WorkflowExportData = z.infer<typeof WorkflowExportSchema>

/**
 * Validates and parses raw JSON into a typed WorkflowExportData structure.
 * Checks that all node types exist in the nodeRegistry.
 */
export function parseAndValidateWorkflowJson(rawJson: string): {
  success: boolean
  data?: WorkflowExportData
  error?: string
} {
  try {
    const parsed = JSON.parse(rawJson)
    const result = WorkflowExportSchema.safeParse(parsed)
    if (!result.success) {
      const firstError =
        result.error.issues?.[0]?.message || "Invalid workflow format"
      return { success: false, error: firstError }
    }

    const { data } = result
    // Verify nodes have valid registry types
    for (const node of data.graph.nodes) {
      if (!(node.data.type in nodeRegistry)) {
        return {
          success: false,
          error: `Unknown node type "${node.data.type}" found in workflow.`,
        }
      }
    }

    return { success: true, data }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Invalid JSON file",
    }
  }
}

/**
 * Serializes workflow into a formatted JSON string for export.
 */
export function serializeWorkflowForExport(
  name: string,
  graph: WorkflowGraph,
  description?: string
): string {
  const title = (name || "").trim() || "Workflow"
  const exportData: WorkflowExportData = {
    $schema: "browser-ai-agent/workflow/v1",
    version: "1.0",
    name: title,
    description: description || "Exported from Browser AI Agent",
    exportedAt: new Date().toISOString(),
    graph: {
      nodes: graph.nodes as StepNodeType[],
      edges: graph.edges,
    },
  }
  return JSON.stringify(exportData, null, 2)
}

/**
 * Triggers a browser file download of the workflow JSON.
 * The downloaded file is named directly after the workflow title.
 */
export function downloadWorkflowJson(
  name: string,
  graph: WorkflowGraph,
  description?: string
): void {
  const title = (name || "").trim() || "Workflow"
  const jsonString = serializeWorkflowForExport(title, graph, description)
  const blob = new Blob([jsonString], { type: "application/json" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  // Sanitize illegal filesystem characters while preserving the exact title and casing
  const fileName = title.replace(/[\\/:*?"<>|]/g, "_").trim()
  a.href = url
  a.download = `${fileName}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
