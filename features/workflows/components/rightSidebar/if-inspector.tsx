"use client"

import { useMemo } from "react"
import { useReactFlow } from "@xyflow/react"
import { Plus, Trash2, GitBranch, CheckCircle2, XCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

import {
  ConditionCriterion,
  ConditionOperator,
  LogicalCombinator,
} from "../../lib"
import { StepNodeType } from "../../nodes/node-registry"
import { TokenInputHandle, TokenInput } from "../token-input"

const FRIENDLY_OPERATORS: { label: string; value: ConditionOperator }[] = [
  { label: "is equal to", value: "equals" },
  { label: "is not equal to", value: "not_equals" },
  { label: "contains", value: "contains" },
  { label: "does not contain", value: "not_contains" },
  { label: "starts with", value: "starts_with" },
  { label: "ends with", value: "ends_with" },
  { label: "is greater than (>)", value: "greater_than" },
  { label: "is less than (<)", value: "less_than" },
  { label: "is greater or equal (>=)", value: "greater_than_or_equal" },
  { label: "is less or equal (<=)", value: "less_than_or_equal" },
  { label: "is empty / not set", value: "is_empty" },
  { label: "is not empty / has value", value: "is_not_empty" },
  { label: "matches regex", value: "regex_match" },
  { label: "does not match regex", value: "not_regex_match" },
]

export default function IfInspector({
  node,
  onFocusField,
  registerInputRef,
}: {
  node: StepNodeType
  onFocusField?: (key: string) => void
  registerInputRef?: (key: string, handle: TokenInputHandle | null) => void
}) {
  const { updateNodeData } = useReactFlow<StepNodeType>()

  const combinator =
    (node.data.values?.combinator as LogicalCombinator) || "and"
  const rawConditions = node.data.values?.conditions

  const conditions = useMemo<ConditionCriterion[]>(() => {
    try {
      if (rawConditions) {
        const parsed = JSON.parse(rawConditions)
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed
        }
      }
    } catch {}
    return [
      {
        id: crypto.randomUUID(),
        left: "",
        operator: "equals",
        right: "",
      },
    ]
  }, [rawConditions])

  const getLatestConditions = (): ConditionCriterion[] => {
    try {
      if (node.data.values?.conditions) {
        const parsed = JSON.parse(node.data.values.conditions)
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed
        }
      }
    } catch {}
    return conditions
  }

  const handleUpdateCondition = (
    id: string,
    updates: Partial<ConditionCriterion>
  ) => {
    const currentList = getLatestConditions()
    const next = currentList.map((c) =>
      c.id === id ? { ...c, ...updates } : c
    )
    updateNodeData(node.id, {
      values: {
        ...node.data.values,
        conditions: JSON.stringify(next),
      },
    })
  }

  const handleAddCondition = () => {
    const currentList = getLatestConditions()
    const next: ConditionCriterion[] = [
      ...currentList,
      {
        id: crypto.randomUUID(),
        left: "",
        operator: "equals",
        right: "",
      },
    ]
    updateNodeData(node.id, {
      values: {
        ...node.data.values,
        conditions: JSON.stringify(next),
      },
    })
  }

  const handleRemoveCondition = (id: string) => {
    const currentList = getLatestConditions()
    if (currentList.length <= 1) return
    const next = currentList.filter((c) => c.id !== id)
    updateNodeData(node.id, {
      values: {
        ...node.data.values,
        conditions: JSON.stringify(next),
      },
    })
  }

  const handleSetCombinator = (nextCombinator: LogicalCombinator) => {
    updateNodeData(node.id, {
      values: {
        ...node.data.values,
        combinator: nextCombinator,
      },
    })
  }

  return (
    <div className="flex flex-col gap-3.5 border-t border-border pt-3">
      {/* Friendly Header Summary & Match Rule Selector */}
      <div className="flex flex-col gap-2 rounded-lg border border-border/80 bg-muted/30 p-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-1.5">
            <GitBranch className="size-3.5 shrink-0 text-muted-foreground" />
            <span className="truncate text-xs font-semibold">
              Branching Logic
            </span>
          </div>
          <span className="shrink-0 text-[11px] text-muted-foreground">
            {conditions.length}{" "}
            {conditions.length === 1 ? "condition" : "conditions"}
          </span>
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-border/50 pt-1">
          <span className="text-[11px] text-muted-foreground">Match:</span>
          <div className="flex items-center rounded-md border border-border bg-background p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={() => handleSetCombinator("and")}
              className={cn(
                "cursor-pointer rounded px-2 py-0.5 text-[11px] font-medium transition-colors",
                combinator === "and"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              All (AND)
            </button>
            <button
              type="button"
              onClick={() => handleSetCombinator("or")}
              className={cn(
                "cursor-pointer rounded px-2 py-0.5 text-[11px] font-medium transition-colors",
                combinator === "or"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Any (OR)
            </button>
          </div>
        </div>
      </div>

      {/* Condition Cards */}
      <div className="flex min-w-0 flex-col gap-2.5">
        {conditions.map((criterion, idx) => {
          const isUnary =
            criterion.operator === "is_empty" ||
            criterion.operator === "is_not_empty"

          return (
            <div key={criterion.id} className="flex min-w-0 flex-col gap-2">
              {/* Divider for 2nd+ conditions */}
              {idx > 0 && (
                <div className="flex items-center gap-2 px-1">
                  <div className="h-px flex-1 bg-border/60" />
                  <span className="rounded-full border border-border bg-muted/80 px-2 py-0.5 text-[10px] font-semibold text-muted-foreground uppercase">
                    {combinator === "and" ? "AND" : "OR"}
                  </span>
                  <div className="h-px flex-1 bg-border/60" />
                </div>
              )}

              {/* Condition Row Card */}
              <div className="flex min-w-0 flex-col gap-2 rounded-lg border border-border bg-card/60 p-2.5 shadow-2xs">
                {/* Header with Condition # & Delete */}
                <div className="flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1.5">
                    <span className="flex size-4 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-muted-foreground">
                      {idx + 1}
                    </span>
                    <span className="text-[11px] font-medium text-foreground">
                      Condition
                    </span>
                  </div>
                  {conditions.length > 1 && (
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => handleRemoveCondition(criterion.id)}
                      className="size-5 cursor-pointer text-muted-foreground hover:text-destructive"
                      title="Remove condition"
                    >
                      <Trash2 className="size-3" />
                    </Button>
                  )}
                </div>

                {/* Step 1: Left value / Variable */}
                <div className="flex min-w-0 flex-col gap-1">
                  <span className="text-[10px] font-medium text-muted-foreground">
                    Value to check
                  </span>
                  <TokenInput
                    ref={(handle) =>
                      registerInputRef?.(
                        `condition-${criterion.id}-left`,
                        handle
                      )
                    }
                    value={criterion.left}
                    onFocus={() =>
                      onFocusField?.(`condition-${criterion.id}-left`)
                    }
                    onChange={(val) =>
                      handleUpdateCondition(criterion.id, { left: val })
                    }
                    currentNodeId={node.id}
                    placeholder="e.g. {{ Step 1 · Status }}"
                  />
                </div>

                {/* Step 2: Comparison Operator */}
                <div className="flex min-w-0 flex-col gap-1">
                  <span className="text-[10px] font-medium text-muted-foreground">
                    Comparison
                  </span>
                  <Select
                    value={criterion.operator}
                    onValueChange={(val) =>
                      handleUpdateCondition(criterion.id, {
                        operator: val as ConditionOperator,
                      })
                    }
                  >
                    <SelectTrigger className="h-7 w-full min-w-0 text-xs font-normal">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {FRIENDLY_OPERATORS.map((op) => (
                        <SelectItem
                          key={op.value}
                          value={op.value}
                          className="text-xs"
                        >
                          {op.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Step 3: Right Target Value (if binary operator) */}
                {!isUnary && (
                  <div className="flex min-w-0 flex-col gap-1">
                    <span className="text-[10px] font-medium text-muted-foreground">
                      Expected value
                    </span>
                    <TokenInput
                      ref={(handle) =>
                        registerInputRef?.(
                          `condition-${criterion.id}-right`,
                          handle
                        )
                      }
                      value={criterion.right}
                      onFocus={() =>
                        onFocusField?.(`condition-${criterion.id}-right`)
                      }
                      onChange={(val) =>
                        handleUpdateCondition(criterion.id, { right: val })
                      }
                      currentNodeId={node.id}
                      placeholder="e.g. success or {{ value }}"
                    />
                  </div>
                )}
              </div>
            </div>
          )
        })}

        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={handleAddCondition}
          className="h-7.5 w-full cursor-pointer gap-1.5 border-dashed text-xs text-muted-foreground hover:text-foreground"
        >
          <Plus className="size-3.5" />
          <span>Add Condition</span>
        </Button>
      </div>

      {/* Visual Branch Guide (Clear Intuition) */}
      <div className="flex flex-col gap-1.5 rounded-lg border border-border/60 bg-muted/20 p-2 text-[11px] text-muted-foreground">
        <div className="flex items-center gap-1.5 font-medium text-foreground">
          <CheckCircle2 className="size-3 shrink-0 text-emerald-500" />
          <span>True branch:</span>
          <span className="truncate font-normal text-muted-foreground">
            Runs when{" "}
            {combinator === "and"
              ? "all conditions match"
              : "any condition matches"}
          </span>
        </div>
        <div className="flex items-center gap-1.5 font-medium text-foreground">
          <XCircle className="size-3 shrink-0 text-muted-foreground" />
          <span>False branch:</span>
          <span className="truncate font-normal text-muted-foreground">
            Runs if conditions are not met
          </span>
        </div>
      </div>
    </div>
  )
}
