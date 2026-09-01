"use client"

import { useMemo, useState } from "react"
import { useReactFlow } from "@xyflow/react"
import {
  Copy,
  Check,
  Layers,
  Hash,
  Timer,
  ShieldAlert,
  ChevronDown,
  Sparkles,
} from "lucide-react"
import { toast } from "sonner"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

import { ConditionCriterion, ConditionOperator } from "../../lib"
import { StepNodeType } from "../../nodes/node-registry"
import type { LoopMode, WhileRuleMode, LoopFailurePolicy } from "../../nodes/loop"
import { TokenInput, TokenInputHandle } from "../token-input"

const FRIENDLY_OPERATORS: { label: string; value: ConditionOperator }[] = [
  { label: "is equal to", value: "equals" },
  { label: "is not equal to", value: "not_equals" },
  { label: "contains", value: "contains" },
  { label: "does not contain", value: "not_contains" },
  { label: "is empty / not set", value: "is_empty" },
  { label: "is not empty / has value", value: "is_not_empty" },
  { label: "is greater than (>)", value: "greater_than" },
  { label: "is less than (<)", value: "less_than" },
]

export default function LoopInspector({
  node,
  onFocusField,
  registerInputRef,
}: {
  node: StepNodeType
  onFocusField?: (key: string) => void
  registerInputRef?: (key: string, handle: TokenInputHandle | null) => void
}) {
  const { updateNodeData } = useReactFlow<StepNodeType>()
  const [copiedToken, setCopiedToken] = useState<string | null>(null)
  const [showAdvanced, setShowAdvanced] = useState(false)

  const nodeValues = node.data.values || {}
  const mode = (nodeValues.mode as LoopMode) || "for_each"
  const items = nodeValues.items || ""
  const count = nodeValues.count || "5"
  const maxIterations = nodeValues.maxIterations || "50"
  const batchDelayMs = nodeValues.batchDelayMs || "0"
  const onItemFailure =
    (nodeValues.onItemFailure as LoopFailurePolicy) || "continue"
  const whileRuleMode =
    (nodeValues.whileRuleMode as WhileRuleMode) || "until"
  const rawConditions = nodeValues.conditions

  const conditions: ConditionCriterion[] = useMemo(() => {
    try {
      if (rawConditions) {
        const parsed = JSON.parse(rawConditions)
        if (Array.isArray(parsed) && parsed.length > 0) return parsed
      }
    } catch {}
    return [
      {
        id: "default-condition",
        left: "",
        operator: "equals",
        right: "",
      },
    ]
  }, [rawConditions])

  const setField = (key: string, value: string) => {
    updateNodeData(node.id, {
      values: {
        ...(node.data.values || {}),
        [key]: value,
      },
    })
  }

  const handleModeChange = (newMode: LoopMode) => {
    setField("mode", newMode)
  }

  const handleConditionChange = (
    field: "left" | "operator" | "right",
    val: string
  ) => {
    const current = conditions[0] || {
      id: "default-condition",
      left: "",
      operator: "equals",
      right: "",
    }
    const updated = [
      {
        ...current,
        [field]: val,
      },
    ]
    setField("conditions", JSON.stringify(updated))
  }

  const copyToken = (token: string) => {
    navigator.clipboard.writeText(token)
    setCopiedToken(token)
    toast.success(`Copied ${token} to clipboard!`)
    setTimeout(() => setCopiedToken(null), 2000)
  }

  const condition = conditions[0] || {
    id: "default-condition",
    left: "",
    operator: "equals",
    right: "",
  }

  const isUnary =
    condition.operator === "is_empty" || condition.operator === "is_not_empty"

  return (
    <div className="flex w-full min-w-0 max-w-full flex-col gap-4 p-4 text-xs">
      {/* 1. Loop Mode Segmented Picker */}
      <div className="flex w-full min-w-0 flex-col gap-2">
        <Label className="text-xs font-semibold text-foreground">
          What would you like to loop?
        </Label>
        <div className="grid w-full min-w-0 grid-cols-3 gap-1 rounded-lg border border-border bg-muted/40 p-1">
          <button
            type="button"
            onClick={() => handleModeChange("for_each")}
            className={cn(
              "flex min-w-0 flex-col items-center justify-center gap-1 rounded-md px-1.5 py-2 text-center transition-all",
              mode === "for_each"
                ? "border border-border bg-background font-medium text-foreground shadow-xs"
                : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
            )}
          >
            <Layers className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span className="w-full min-w-0 truncate text-[11px] leading-tight">
              List of items
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleModeChange("count")}
            className={cn(
              "flex min-w-0 flex-col items-center justify-center gap-1 rounded-md px-1.5 py-2 text-center transition-all",
              mode === "count"
                ? "border border-border bg-background font-medium text-foreground shadow-xs"
                : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
            )}
          >
            <Hash className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span className="w-full min-w-0 truncate text-[11px] leading-tight">
              Fixed count
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleModeChange("while")}
            className={cn(
              "flex min-w-0 flex-col items-center justify-center gap-1 rounded-md px-1.5 py-2 text-center transition-all",
              mode === "while"
                ? "border border-border bg-background font-medium text-foreground shadow-xs"
                : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
            )}
          >
            <Timer className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span className="w-full min-w-0 truncate text-[11px] leading-tight">
              Condition
            </span>
          </button>
        </div>
      </div>

      {/* 2. Mode-Specific Configuration */}
      {mode === "for_each" && (
        <div className="flex w-full min-w-0 flex-col gap-2 rounded-lg border border-border/80 bg-card p-3 shadow-2xs">
          <div className="flex items-center justify-between gap-1">
            <Label className="text-xs font-semibold text-foreground">
              Select list / data
            </Label>
            <span className="shrink-0 text-[10px] text-muted-foreground">
              Insert token
            </span>
          </div>
          <div className="w-full min-w-0">
            <TokenInput
              id={`${node.id}-items`}
              value={items}
              placeholder="e.g. {{ HTTP Request · data.items }} or [1, 2, 3]"
              onChange={(val) => setField("items", val)}
              onFocus={() => onFocusField?.("items")}
              currentNodeId={node.id}
              ref={(handle) => registerInputRef?.("items", handle)}
            />
          </div>
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            Pick a list from a previous step (like rows from a sheet, users from
            an API, or search results).
          </p>
        </div>
      )}

      {mode === "count" && (
        <div className="flex w-full min-w-0 flex-col gap-2 rounded-lg border border-border/80 bg-card p-3 shadow-2xs">
          <Label className="text-xs font-semibold text-foreground">
            How many times should this repeat?
          </Label>
          <Input
            type="number"
            min="1"
            max="500"
            value={count}
            onChange={(e) => setField("count", e.target.value)}
            className="h-8 w-full min-w-0 text-xs"
            placeholder="e.g. 5"
          />
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            Repeats the connected branch this exact number of times.
          </p>
        </div>
      )}

      {mode === "while" && (
        <div className="flex w-full min-w-0 flex-col gap-3 rounded-lg border border-border/80 bg-card p-3 shadow-2xs">
          <div className="flex w-full min-w-0 flex-col gap-1.5">
            <Label className="text-xs font-semibold text-foreground">
              Repeating rule
            </Label>
            <Select
              value={whileRuleMode}
              onValueChange={(val: WhileRuleMode) =>
                setField("whileRuleMode", val)
              }
            >
              <SelectTrigger className="h-8 w-full min-w-0 text-xs font-normal [&>span]:truncate">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-60 max-w-(--radix-select-trigger-width)">
                <SelectItem value="until" className="text-xs">
                  Repeat UNTIL condition is met (e.g. job done)
                </SelectItem>
                <SelectItem value="while" className="text-xs">
                  Repeat WHILE condition is true (e.g. pending)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex w-full min-w-0 flex-col gap-2 pt-1">
            <Label className="text-xs font-semibold text-foreground">
              Value to check
            </Label>
            <div className="w-full min-w-0">
              <TokenInput
                id={`${node.id}-condition-left`}
                value={condition.left || ""}
                placeholder="e.g. {{ HTTP Request · data.status }}"
                onChange={(val) => handleConditionChange("left", val)}
                onFocus={() => onFocusField?.("conditions")}
                currentNodeId={node.id}
                ref={(handle) => registerInputRef?.("conditions", handle)}
              />
            </div>

            <div className="flex w-full min-w-0 flex-col gap-2 pt-1">
              <div className="flex w-full min-w-0 flex-col gap-1">
                <span className="text-[10px] font-medium text-muted-foreground">
                  Comparison
                </span>
                <Select
                  value={condition.operator}
                  onValueChange={(val) =>
                    handleConditionChange("operator", val)
                  }
                >
                  <SelectTrigger className="h-8 w-full min-w-0 text-xs font-normal [&>span]:truncate">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-60 max-w-(--radix-select-trigger-width)">
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

              {!isUnary && (
                <div className="flex w-full min-w-0 flex-col gap-1">
                  <span className="text-[10px] font-medium text-muted-foreground">
                    Target value
                  </span>
                  <Input
                    value={condition.right || ""}
                    placeholder="e.g. completed"
                    onChange={(e) =>
                      handleConditionChange("right", e.target.value)
                    }
                    className="h-8 w-full min-w-0 text-xs"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. Helper Card: How to use variables in steps */}
      <div className="flex w-full min-w-0 flex-col gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3 dark:border-emerald-500/15 dark:bg-emerald-500/10">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
          <Sparkles className="size-3.5 shrink-0" />
          <span>Use loop items in your steps</span>
        </div>
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          Click any chip below to copy its token, then paste it into any step
          inside your loop:
        </p>

        <div className="flex w-full min-w-0 flex-wrap gap-1.5 pt-1">
          <button
            type="button"
            onClick={() =>
              copyToken(`{{ ${node.data.title || "Loop"} · item }}`)
            }
            className="group flex max-w-full min-w-0 items-center gap-1 rounded-md border border-emerald-500/30 bg-background px-2 py-1 font-mono text-[11px] text-foreground transition-colors hover:border-emerald-500 hover:bg-emerald-500/10"
            title="Click to copy current item data"
          >
            <span className="font-bold text-emerald-600 dark:text-emerald-400">
              •
            </span>
            <span className="truncate">item</span>
            <span className="shrink-0 font-sans text-[10px] text-muted-foreground">
              (current item)
            </span>
            {copiedToken === `{{ ${node.data.title || "Loop"} · item }}` ? (
              <Check className="size-3 shrink-0 text-emerald-600" />
            ) : (
              <Copy className="size-3 shrink-0 opacity-40 group-hover:opacity-100" />
            )}
          </button>

          <button
            type="button"
            onClick={() =>
              copyToken(`{{ ${node.data.title || "Loop"} · index }}`)
            }
            className="group flex max-w-full min-w-0 items-center gap-1 rounded-md border border-emerald-500/30 bg-background px-2 py-1 font-mono text-[11px] text-foreground transition-colors hover:border-emerald-500 hover:bg-emerald-500/10"
            title="Click to copy item index (0, 1, 2...)"
          >
            <span className="font-bold text-emerald-600 dark:text-emerald-400">
              •
            </span>
            <span className="truncate">index</span>
            <span className="shrink-0 font-sans text-[10px] text-muted-foreground">
              (0, 1, 2...)
            </span>
            {copiedToken === `{{ ${node.data.title || "Loop"} · index }}` ? (
              <Check className="size-3 shrink-0 text-emerald-600" />
            ) : (
              <Copy className="size-3 shrink-0 opacity-40 group-hover:opacity-100" />
            )}
          </button>

          <button
            type="button"
            onClick={() =>
              copyToken(`{{ ${node.data.title || "Loop"} · total }}`)
            }
            className="group flex max-w-full min-w-0 items-center gap-1 rounded-md border border-emerald-500/30 bg-background px-2 py-1 font-mono text-[11px] text-foreground transition-colors hover:border-emerald-500 hover:bg-emerald-500/10"
            title="Click to copy total items count"
          >
            <span className="font-bold text-emerald-600 dark:text-emerald-400">
              •
            </span>
            <span className="truncate">total</span>
            <span className="shrink-0 font-sans text-[10px] text-muted-foreground">
              (count)
            </span>
            {copiedToken === `{{ ${node.data.title || "Loop"} · total }}` ? (
              <Check className="size-3 shrink-0 text-emerald-600" />
            ) : (
              <Copy className="size-3 shrink-0 opacity-40 group-hover:opacity-100" />
            )}
          </button>
        </div>
      </div>

      {/* 4. Advanced Safety Settings Accordion */}
      <div className="w-full min-w-0 rounded-lg border border-border bg-card">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex w-full min-w-0 items-center justify-between p-3 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
        >
          <div className="flex items-center gap-1.5">
            <ShieldAlert className="size-3.5 shrink-0" />
            <span>Advanced Safety & Speed</span>
          </div>
          <ChevronDown
            className={cn(
              "size-3.5 shrink-0 transition-transform duration-200",
              showAdvanced && "rotate-180"
            )}
          />
        </button>

        {showAdvanced && (
          <div className="flex w-full min-w-0 flex-col gap-3 border-t border-border p-3 pt-3">
            {mode === "while" && (
              <div className="flex w-full min-w-0 flex-col gap-1">
                <div className="flex items-center justify-between gap-1">
                  <Label className="text-xs font-medium text-foreground">
                    Max attempts limit
                  </Label>
                  <span className="shrink-0 text-[10px] text-muted-foreground">
                    Max 500
                  </span>
                </div>
                <Input
                  type="number"
                  min="1"
                  max="500"
                  value={maxIterations}
                  onChange={(e) => setField("maxIterations", e.target.value)}
                  className="h-8 w-full min-w-0 text-xs"
                  placeholder="50"
                />
                <span className="text-[10px] leading-tight text-muted-foreground">
                  Prevents infinite runs if the condition is never met.
                </span>
              </div>
            )}

            <div className="flex w-full min-w-0 flex-col gap-1">
              <Label className="text-xs font-medium text-foreground">
                Pause between items (ms)
              </Label>
              <Input
                type="number"
                min="0"
                step="100"
                value={batchDelayMs}
                onChange={(e) => setField("batchDelayMs", e.target.value)}
                className="h-8 w-full min-w-0 text-xs"
                placeholder="e.g. 500 for 0.5s pause"
              />
              <span className="text-[10px] leading-tight text-muted-foreground">
                Optional delay (in ms) to avoid API rate limits.
              </span>
            </div>

            <div className="flex w-full min-w-0 flex-col gap-1">
              <Label className="text-xs font-medium text-foreground">
                If an item fails
              </Label>
              <Select
                value={onItemFailure}
                onValueChange={(val: LoopFailurePolicy) =>
                  setField("onItemFailure", val)
                }
              >
                <SelectTrigger className="h-8 w-full min-w-0 text-xs font-normal [&>span]:truncate">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-60 max-w-(--radix-select-trigger-width)">
                  <SelectItem value="continue" className="text-xs">
                    Skip failed item and continue
                  </SelectItem>
                  <SelectItem value="halt" className="text-xs">
                    Stop workflow immediately
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
