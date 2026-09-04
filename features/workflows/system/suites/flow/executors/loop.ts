import {
  evaluateIfConditions,
  type ConditionCriterion,
  type LogicalCombinator,
} from "@/features/workflows/lib/evaluate-condition"

import type {
  LoopMode,
  WhileRuleMode,
  LoopFailurePolicy,
} from "../../../types/flow"

export type { LoopMode, WhileRuleMode, LoopFailurePolicy }


export interface LoopNodeValues {
  mode?: LoopMode
  items?: string
  count?: string
  whileRuleMode?: WhileRuleMode
  conditions?: string
  combinator?: LogicalCombinator
  maxIterations?: string
  batchDelayMs?: string
  onItemFailure?: LoopFailurePolicy
}

export interface LoopIterationState {
  item: unknown
  index: number
  iteration: number
  total: number
  isFirst: boolean
  isLast: boolean
  results: unknown[]
  successCount: number
  failureCount: number
  completed: boolean
}

const DEFAULT_MAX_ITERATIONS = 50
const ABSOLUTE_MAX_ITERATIONS = 500

/**
 * Extracts a numeric safety cap for loop executions.
 */
export function parseMaxIterations(rawMax?: string | number): number {
  if (!rawMax) return DEFAULT_MAX_ITERATIONS
  const parsed = parseInt(String(rawMax).trim(), 10)
  if (isNaN(parsed) || parsed <= 0) return DEFAULT_MAX_ITERATIONS
  return Math.min(parsed, ABSOLUTE_MAX_ITERATIONS)
}

/**
 * Parses input items into an iterable array based on the selected loop mode.
 */
export function parseLoopItems(
  rawInput: unknown,
  mode: LoopMode = "for_each",
  countStr?: string,
  maxCap: number = DEFAULT_MAX_ITERATIONS
): unknown[] {
  if (mode === "count") {
    const count = parseInt(String(countStr ?? "5").trim(), 10)
    const validCount = isNaN(count) || count < 0 ? 0 : count
    return Array.from({ length: validCount }, (_, i) => i)
  }

  if (mode === "while") {
    // In while mode, items are virtual iteration indices up to safety cap
    const cap = Math.min(maxCap, ABSOLUTE_MAX_ITERATIONS)
    return Array.from({ length: cap }, (_, i) => i)
  }

  // for_each mode
  if (rawInput == null || rawInput === "") {
    return []
  }

  if (Array.isArray(rawInput)) {
    return rawInput
  }

  if (typeof rawInput === "string") {
    const trimmed = rawInput.trim()
    if (!trimmed) return []

    // Try parsing JSON string
    try {
      const parsed = JSON.parse(trimmed)
      if (Array.isArray(parsed)) {
        return parsed
      }
      if (parsed && typeof parsed === "object") {
        // If object has a top-level array property (e.g. { data: [...] } or { items: [...] })
        for (const key of ["items", "data", "results", "users", "rows", "records"]) {
          if (Array.isArray((parsed as Record<string, unknown>)[key])) {
            return (parsed as Record<string, unknown>)[key] as unknown[]
          }
        }
        return [parsed]
      }
    } catch {}

    // Try splitting newline or comma-separated values
    if (trimmed.includes("\n")) {
      return trimmed
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
    }

    if (trimmed.includes(",")) {
      return trimmed
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
    }

    return [trimmed]
  }

  if (typeof rawInput === "object") {
    for (const key of ["items", "data", "results", "users", "rows", "records"]) {
      if (Array.isArray((rawInput as Record<string, unknown>)[key])) {
        return (rawInput as Record<string, unknown>)[key] as unknown[]
      }
    }
    return [rawInput]
  }

  return [rawInput]
}

/**
 * Evaluates whether a while/until condition indicates that looping should continue.
 */
export function shouldContinueWhileLoop(
  conditions: ConditionCriterion[],
  combinator: LogicalCombinator = "and",
  whileRuleMode: WhileRuleMode = "while",
  results: Record<string, unknown>
): boolean {
  if (!conditions || conditions.length === 0) {
    return false
  }

  const evaluation = evaluateIfConditions(conditions, combinator, results)

  if (whileRuleMode === "until") {
    // "Until condition is TRUE" means: Keep looping while evaluation is FALSE
    return !evaluation
  }

  // "While condition is TRUE" means: Keep looping while evaluation is TRUE
  return evaluation
}

/**
 * Standard Loop Node Executor returning initial loop metadata.
 */
export async function loopNode({
  values,
  results: _results = {},
}: {
  values: Record<string, string>
  results?: Record<string, unknown>
}): Promise<LoopIterationState> {
  const mode = (values.mode as LoopMode) || "for_each"
  const maxCap = parseMaxIterations(values.maxIterations)
  const items = parseLoopItems(values.items, mode, values.count, maxCap)
  const total = items.length

  const firstItem = total > 0 ? items[0] : null

  return {
    item: firstItem,
    index: 0,
    iteration: 1,
    total,
    isFirst: true,
    isLast: total <= 1,
    results: [],
    successCount: 0,
    failureCount: 0,
    completed: total === 0,
  }
}
