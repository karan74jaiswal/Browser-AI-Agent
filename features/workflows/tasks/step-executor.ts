import type { Edge } from "@xyflow/react"
import type { Stagehand } from "@browserbasehq/stagehand"
import { nodeExecutors } from "../nodes/node-executors"
import { switchNode } from "../nodes/switch"
import {
  evaluateIfConditions,
  interpolate,
  type ConditionCriterion,
  type LogicalCombinator,
} from "../lib"
import type { StepNodeType } from "../nodes/node-registry"

export const pace = (ms: number = 600) =>
  new Promise((resolve) => setTimeout(resolve, ms))

export interface ExecuteStepParams {
  node: StepNodeType
  results: Record<string, unknown>
  triggerData?: Record<string, unknown>
  outgoingEdges: Map<string, Edge[]>
  activeEdges: Set<string>
  disabledEdges: Set<string>
  getStagehand: () => Promise<Stagehand>
}

/**
 * Executes a single workflow node (condition evaluation, trigger fallback, or action executor),
 * resolves upstream tokens via interpolation, and activates the corresponding downstream edges.
 */
export async function executeStep({
  node,
  results,
  triggerData,
  outgoingEdges,
  activeEdges,
  disabledEdges,
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
    for (const edge of outEdges) {
      const handle =
        (edge as { sourceHandleId?: string | null; sourceHandle?: string | null })
          .sourceHandleId ||
        (edge as { sourceHandleId?: string | null; sourceHandle?: string | null })
          .sourceHandle ||
        "true"

      if (handle === winningHandle) {
        activeEdges.add(edge.id)
      } else {
        disabledEdges.add(edge.id)
      }
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
    for (const edge of outEdges) {
      const handle =
        (edge as { sourceHandleId?: string | null; sourceHandle?: string | null })
          .sourceHandleId ||
        (edge as { sourceHandleId?: string | null; sourceHandle?: string | null })
          .sourceHandle ||
        "0"

      if (handle === winningHandle) {
        activeEdges.add(edge.id)
      } else {
        disabledEdges.add(edge.id)
      }
    }
  } else if (node.data.type === "google-form-trigger") {
    result = triggerData ?? {
      formId: "sample-form-id",
      formTitle: "Sample Form",
      responseId: "sample-response-id",
      respondentEmail: "test@example.com",
      timestamp: new Date().toISOString(),
      responses: {
        "Sample Question": "Sample Answer",
      },
    }
    results[nodeId] = result

    const outEdges = outgoingEdges.get(nodeId) || []
    for (const edge of outEdges) {
      activeEdges.add(edge.id)
    }
  } else if (node.data.type === "stripe-trigger") {
    result = triggerData ?? {
      amount: "49.00",
      currency: "USD",
      customerEmail: "customer@example.com",
      customerId: "cus_sample12345",
      eventType:
        node.data.values?.eventType || "payment_intent.succeeded",
      status: "succeeded",
      paymentIntentId: "pi_sample12345",
      rawEvent: {
        id: "evt_sample12345",
        type: node.data.values?.eventType || "payment_intent.succeeded",
      },
    }
    results[nodeId] = result

    const outEdges = outgoingEdges.get(nodeId) || []
    for (const edge of outEdges) {
      activeEdges.add(edge.id)
    }
  } else {
    const executor = nodeExecutors[node.data.type]
    if (executor) {
      result = await executor({
        values: interpolatedValues,
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
