import type {
  ConditionCriterion,
  ConditionOperator,
  LogicalCombinator,
} from "@/features/workflows/lib/evaluate-condition"

export type LoopMode = "for_each" | "count" | "while"
export type WhileRuleMode = "while" | "until"
export type LoopFailurePolicy = "continue" | "halt"

export type SwitchRouteRule = {
  id: string
  name: string
  combinator: LogicalCombinator
  conditions: ConditionCriterion[]
}

export type SwitchValueCase = {
  id: string
  name: string
  operator: ConditionOperator
  value: string
}
