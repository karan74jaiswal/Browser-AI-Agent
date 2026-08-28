"use client"

import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useReactFlow } from "@xyflow/react"
import { Trash2, Plus } from "lucide-react"

import { Label } from "@/components/ui/label"
import { useMemo } from "react"
import {
  ConditionCriterion,
  ConditionOperator,
  LogicalCombinator,
} from "../../lib"
import { StepNodeType } from "../../nodes/node-registry"
import { TokenInputHandle, TokenInput } from "../token-input"

const CONDITION_OPERATORS: { label: string; value: ConditionOperator }[] = [
  { label: "equals (==)", value: "equals" },
  { label: "not equals (!=)", value: "not_equals" },
  { label: "contains", value: "contains" },
  { label: "does not contain", value: "not_contains" },
  { label: "starts with", value: "starts_with" },
  { label: "ends with", value: "ends_with" },
  { label: "greater than (>)", value: "greater_than" },
  { label: "less than (<)", value: "less_than" },
  { label: "greater than or equal (>=)", value: "greater_than_or_equal" },
  { label: "less than or equal (<=)", value: "less_than_or_equal" },
  { label: "is empty", value: "is_empty" },
  { label: "is not empty", value: "is_not_empty" },
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

  const handleUpdateCondition = (
    id: string,
    updates: Partial<ConditionCriterion>
  ) => {
    const next = conditions.map((c) => (c.id === id ? { ...c, ...updates } : c))
    updateNodeData(node.id, {
      values: {
        ...node.data.values,
        conditions: JSON.stringify(next),
      },
    })
  }

  const handleAddCondition = () => {
    const next: ConditionCriterion[] = [
      ...conditions,
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
    if (conditions.length <= 1) return
    const next = conditions.filter((c) => c.id !== id)
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
    <div className="flex flex-col gap-3 border-t border-border pt-3">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-semibold">Conditions</Label>
        <span className="text-[11px] text-muted-foreground">
          {conditions.length} {conditions.length === 1 ? "rule" : "rules"}
        </span>
      </div>

      <div className="flex flex-col gap-2">
        {conditions.map((criterion, idx) => {
          const isUnary =
            criterion.operator === "is_empty" ||
            criterion.operator === "is_not_empty"

          return (
            <div key={criterion.id} className="flex flex-col gap-2">
              {/* Combinator row between condition 1 and condition 2 */}
              {idx === 1 && (
                <div className="my-1 flex items-center gap-2">
                  <div className="h-px flex-1 bg-border" />
                  <div className="flex items-center gap-1.5 rounded border border-border bg-muted/60 px-2 py-0.5">
                    <span className="text-[10px] font-medium text-muted-foreground">
                      Match
                    </span>
                    <Select
                      value={combinator}
                      onValueChange={(val) =>
                        handleSetCombinator(val as LogicalCombinator)
                      }
                    >
                      <SelectTrigger className="h-5 border-0 bg-transparent px-1.5 text-[10px] font-bold tracking-wider uppercase shadow-none">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="and">ALL (AND)</SelectItem>
                        <SelectItem value="or">ANY (OR)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="h-px flex-1 bg-border" />
                </div>
              )}

              {/* Inherited combinator badge for condition 3 and later */}
              {idx > 1 && (
                <div className="my-1 flex items-center gap-2">
                  <div className="h-px flex-1 bg-border" />
                  <span className="rounded border border-border bg-muted px-2 py-0.5 text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                    {combinator.toUpperCase()}
                  </span>
                  <div className="h-px flex-1 bg-border" />
                </div>
              )}

              {/* Condition Box */}
              <div className="flex flex-col gap-1.5 rounded-md border border-border bg-card/50 p-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-muted-foreground">
                    Condition {idx + 1}
                  </span>
                  {conditions.length > 1 && (
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => handleRemoveCondition(criterion.id)}
                      className="size-5 cursor-pointer text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="size-3" />
                    </Button>
                  )}
                </div>

                {/* Left Input */}
                <TokenInput
                  ref={(handle) =>
                    registerInputRef?.(`condition-${criterion.id}-left`, handle)
                  }
                  value={criterion.left}
                  onFocus={() =>
                    onFocusField?.(`condition-${criterion.id}-left`)
                  }
                  onChange={(val) =>
                    handleUpdateCondition(criterion.id, { left: val })
                  }
                  currentNodeId={node.id}
                  placeholder="e.g. {{ Step 1.status }}"
                />

                {/* Operator Select */}
                <Select
                  value={criterion.operator}
                  onValueChange={(val) =>
                    handleUpdateCondition(criterion.id, {
                      operator: val as ConditionOperator,
                    })
                  }
                >
                  <SelectTrigger className="h-7 font-mono text-[11px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CONDITION_OPERATORS.map((op) => (
                      <SelectItem key={op.value} value={op.value}>
                        {op.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Right Input (if binary) */}
                {!isUnary && (
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
                    placeholder="Value or {{ token }}"
                  />
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
          className="h-7 w-full cursor-pointer gap-1 border-dashed text-[11px] text-muted-foreground hover:text-foreground"
        >
          <Plus className="size-3" />
          <span>Add Condition</span>
        </Button>
      </div>
    </div>
  )
}
