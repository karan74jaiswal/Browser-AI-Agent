import {
  evaluateIfConditions,
  compareValues,
} from "@/features/workflows/lib/evaluate-condition"
import { interpolate } from "@/features/workflows/lib/interpolate"
import type {
  SwitchRouteRule,
  SwitchValueCase,
} from "../../../types/flow"

export type { SwitchRouteRule, SwitchValueCase }


export interface SwitchNodeOutput {
  outputIndex: number | "fallback"
  outputName: string
  branch: string
  value?: unknown
  reason: string
}

export async function switchNode({
  values,
  results = {},
}: {
  values: Record<string, string>
  results?: Record<string, unknown>
}): Promise<SwitchNodeOutput> {
  const mode = values.mode || "rules"
  const fallbackEnabled = values.fallbackEnabled !== "false"
  const fallbackName = values.fallbackName || "Fallback"

  if (mode === "value") {
    const rawExpression = values.valueExpression || ""
    const evaluatedExpression = interpolate(rawExpression, results)
    let cases: SwitchValueCase[] = []
    try {
      if (values.cases) {
        cases = JSON.parse(values.cases)
      }
    } catch {}

    for (let i = 0; i < cases.length; i++) {
      const c = cases[i]
      const targetVal = interpolate(c.value || "", results)
      const matched = compareValues(
        evaluatedExpression,
        c.operator || "equals",
        targetVal
      )
      if (matched) {
        return {
          outputIndex: i,
          outputName: c.name || `Case ${i + 1}`,
          branch: String(i),
          value: evaluatedExpression,
          reason: `Matched Case ${i + 1} (${c.name || `Case ${i + 1}`})`,
        }
      }
    }
  } else {
    // Rules mode (n8n standard)
    let routes: SwitchRouteRule[] = []
    try {
      if (values.rules) {
        routes = JSON.parse(values.rules)
      }
    } catch {}

    for (let i = 0; i < routes.length; i++) {
      const route = routes[i]
      const combinator = route.combinator || "and"
      const conditions = route.conditions || []
      const matched = evaluateIfConditions(conditions, combinator, results)

      if (matched) {
        return {
          outputIndex: i,
          outputName: route.name || `Route ${i + 1}`,
          branch: String(i),
          reason: `Matched Route ${i + 1} (${route.name || `Route ${i + 1}`})`,
        }
      }
    }
  }

  // Fallback route if no rule matched
  if (fallbackEnabled) {
    return {
      outputIndex: "fallback",
      outputName: fallbackName,
      branch: "fallback",
      reason: `No switch conditions matched; routed to ${fallbackName}`,
    }
  }

  return {
    outputIndex: -1,
    outputName: "None",
    branch: "none",
    reason: "No conditions matched and fallback disabled",
  }
}
