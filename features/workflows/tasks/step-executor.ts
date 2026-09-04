import type { Edge } from "@xyflow/react"
import type { Stagehand } from "@browserbasehq/stagehand"
import {
  systemNodeTriggerFallbacks,
  type StepNodeType,
} from "@/features/workflows/system"
import {
  nodeExecutors,
  switchNode,
  mergeNode,
} from "@/features/workflows/system/executors"
import { cascadeDisabledEdges } from "./graph-traversal"
import {
  evaluateIfConditions,
  interpolate,
  type ConditionCriterion,
  type LogicalCombinator,
} from "../lib"

export const pace = (ms: number = 600) =>
  new Promise((resolve) => setTimeout(resolve, ms))

export interface ExecuteStepParams {
  node: StepNodeType
  results: Record<string, unknown>
  secrets?: Record<string, string>
  triggerData?: Record<string, unknown>
  outgoingEdges: Map<string, Edge[]>
  incomingEdges?: Map<string, Edge[]>
  activeEdges: Set<string>
  disabledEdges: Set<string>
  failedBranches?: Array<{ nodeId: string; title?: string; error: string }>
  byId?: Map<string, StepNodeType>
  getStagehand: () => Promise<Stagehand>
}

/**
 * Executes a single workflow node (condition evaluation, trigger fallback, or action executor),
 * resolves upstream tokens via interpolation, and activates the corresponding downstream edges.
 */
export async function executeStep({
  node,
  results,
  secrets,
  triggerData,
  outgoingEdges,
  incomingEdges,
  activeEdges,
  disabledEdges,
  failedBranches = [],
  byId,
  getStagehand,
}: ExecuteStepParams): Promise<unknown> {
  const nodeId = node.id
  const type = node.data.type

  const interpolatedValues = Object.fromEntries(
    Object.entries(node.data.values ?? {}).map(([key, value]) => [
      key,
      interpolate(value, results),
    ])
  )

  let result: unknown

  if (type === "if") {
    const combinator =
      (node.data.values?.combinator as LogicalCombinator) || "and"
    let conditions: ConditionCriterion[] = []
    try {
      if (node.data.values?.conditions) {
        conditions = JSON.parse(node.data.values.conditions)
      }
    } catch {}

    const evaluationResult = evaluateIfConditions(
      conditions,
      combinator,
      results
    )
    const activeBranch = evaluationResult ? "true" : "false"
    const winningHandle = activeBranch

    result = {
      result: evaluationResult,
      branch: activeBranch,
      reason: `Evaluated ${evaluationResult ? "TRUE" : "FALSE"} via ${combinator.toUpperCase()} combinator`,
    }
    results[nodeId] = result

    const outEdges = outgoingEdges.get(nodeId) || []
    const newlyDisabled: string[] = []
    for (const edge of outEdges) {
      const handle =
        (
          edge as {
            sourceHandleId?: string | null
            sourceHandle?: string | null
          }
        ).sourceHandleId ||
        (
          edge as {
            sourceHandleId?: string | null
            sourceHandle?: string | null
          }
        ).sourceHandle ||
        "true"

      if (handle === winningHandle) {
        activeEdges.add(edge.id)
      } else {
        disabledEdges.add(edge.id)
        newlyDisabled.push(edge.id)
      }
    }

    if (newlyDisabled.length > 0 && byId) {
      cascadeDisabledEdges(newlyDisabled, outgoingEdges, disabledEdges, byId)
    }
  } else if (type === "switch") {
    const switchRes = await switchNode({
      values: node.data.values ?? {},
      results,
    })
    result = switchRes
    results[nodeId] = result

    const winningHandle = switchRes.branch
    const outEdges = outgoingEdges.get(nodeId) || []
    const newlyDisabled: string[] = []
    for (const edge of outEdges) {
      const handle =
        (
          edge as {
            sourceHandleId?: string | null
            sourceHandle?: string | null
          }
        ).sourceHandleId ||
        (
          edge as {
            sourceHandleId?: string | null
            sourceHandle?: string | null
          }
        ).sourceHandle ||
        "0"

      if (handle === winningHandle) {
        activeEdges.add(edge.id)
      } else {
        disabledEdges.add(edge.id)
        newlyDisabled.push(edge.id)
      }
    }

    if (newlyDisabled.length > 0 && byId) {
      cascadeDisabledEdges(newlyDisabled, outgoingEdges, disabledEdges, byId)
    }
  } else if (type === "merge") {
    const inEdges = incomingEdges?.get(nodeId) || []
    const incomingNodeIds = inEdges.map((e) => e.source)
    const activeIncomingNodeIds = inEdges
      .filter((e) => activeEdges.has(e.id))
      .map((e) => e.source)

    const mergeRes = await mergeNode({
      values: node.data.values ?? {},
      results,
      incomingNodeIds,
      activeIncomingNodeIds,
      failedBranches,
    })
    result = mergeRes
    results[nodeId] = result

    const outEdges = outgoingEdges.get(nodeId) || []
    for (const edge of outEdges) {
      activeEdges.add(edge.id)
    }
  } else if (node.data.kind === "trigger" || systemNodeTriggerFallbacks[type]) {
    const fallbackFn = systemNodeTriggerFallbacks[type]
    const fallbackData = fallbackFn ? fallbackFn(node.data.values ?? {}) : {}
    result = triggerData ?? results[nodeId] ?? fallbackData
    results[nodeId] = result

    const outEdges = outgoingEdges.get(nodeId) || []
    for (const edge of outEdges) {
      activeEdges.add(edge.id)
    }
  } else {
    const executor = nodeExecutors[node.data.type as keyof typeof nodeExecutors]

    if (executor) {
      result = await executor({
        values: interpolatedValues,
        secrets,
        getStagehand,
      })
    }
    results[nodeId] = result

    const outEdges = outgoingEdges.get(nodeId) || []
    for (const edge of outEdges) {
      activeEdges.add(edge.id)
    }
  }

  if (!triggerData) {
    await pace(400)
  }

  return result
}
