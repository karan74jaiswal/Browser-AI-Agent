"use client"

import { useMemo } from "react"
import { useMutation } from "@liveblocks/react"
import { useReactFlow, useUpdateNodeInternals } from "@xyflow/react"
import { Plus, Trash2, GitFork, CornerDownRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"

import { ConditionCriterion, ConditionOperator } from "@/features/workflows/lib"
import {
  StepNodeType,
  type SwitchRouteRule,
  type SwitchValueCase,
  type NodeInspectorProps,
} from "@/features/workflows/system"
import {
  TokenInput,
  TokenInputHandle,
} from "@/features/workflows/components/token-input"

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

export function SwitchInspector({
  node,
  onFocusField,
  registerInputRef,
}: NodeInspectorProps) {
  const { updateNodeData } = useReactFlow<StepNodeType>()
  const updateNodeInternals = useUpdateNodeInternals()

  const syncSwitchEdgesInLiveblocks = useMutation(
    (
      { storage },
      action: {
        type:
          "remove-route" | "remove-case" | "disable-fallback" | "switch-mode"
        deletedIndex?: number
        newMaxCount?: number
      }
    ) => {
      type LiveObjectEdge = {
        get: (k: string) => unknown
        set: (k: string, v: unknown) => void
      }
      type LiveMapEdges = {
        entries: () => IterableIterator<[string, LiveObjectEdge]>
        delete: (k: string) => boolean
      }
      const root = storage as unknown as {
        get: (k: string) =>
          | {
              get: (k: string) => LiveMapEdges | undefined
            }
          | undefined
      }
      const flow = root.get("flow")
      if (!flow) return
      const edgesMap = flow.get("edges")
      if (!edgesMap) return

      const entries = Array.from(edgesMap.entries())
      for (const [edgeId, edgeLiveObj] of entries) {
        const source = edgeLiveObj.get("source")
        if (source !== node.id) continue

        const handle =
          (edgeLiveObj.get("sourceHandle") as string | undefined) ?? "0"

        if (action.type === "disable-fallback") {
          if (handle === "fallback") {
            edgesMap.delete(edgeId)
          }
        } else if (
          action.type === "remove-route" ||
          action.type === "remove-case"
        ) {
          if (handle === "fallback") continue
          const handleIdx = parseInt(handle, 10)
          if (isNaN(handleIdx)) continue

          if (handleIdx === action.deletedIndex) {
            edgesMap.delete(edgeId)
          } else if (
            action.deletedIndex !== undefined &&
            handleIdx > action.deletedIndex
          ) {
            edgeLiveObj.set("sourceHandle", String(handleIdx - 1))
          }
        } else if (action.type === "switch-mode") {
          if (handle === "fallback") continue
          const handleIdx = parseInt(handle, 10)
          if (
            !isNaN(handleIdx) &&
            action.newMaxCount !== undefined &&
            handleIdx >= action.newMaxCount
          ) {
            edgesMap.delete(edgeId)
          }
        }
      }
    },
    [node.id]
  )

  const mode = node.data.values?.mode || "rules"
  const fallbackEnabled = node.data.values?.fallbackEnabled !== "false"
  const fallbackName = node.data.values?.fallbackName || "Fallback"
  const rawRules = node.data.values?.rules
  const rawCases = node.data.values?.cases
  const valueExpression = node.data.values?.valueExpression || ""

  const routes = useMemo<SwitchRouteRule[]>(() => {
    try {
      if (rawRules) {
        const parsed = JSON.parse(rawRules)
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed
        }
      }
    } catch {}
    return [
      {
        id: crypto.randomUUID(),
        name: "Route 1",
        combinator: "and",
        conditions: [
          {
            id: crypto.randomUUID(),
            left: "",
            operator: "equals",
            right: "",
          },
        ],
      },
    ]
  }, [rawRules])

  const cases = useMemo<SwitchValueCase[]>(() => {
    try {
      if (rawCases) {
        const parsed = JSON.parse(rawCases)
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed
        }
      }
    } catch {}
    return [
      {
        id: crypto.randomUUID(),
        name: "Case 1",
        operator: "equals",
        value: "",
      },
    ]
  }, [rawCases])

  const updateValues = (updates: Record<string, string>) => {
    updateNodeData(node.id, {
      values: {
        ...node.data.values,
        ...updates,
      },
    })
  }

  const getLatestRoutes = (): SwitchRouteRule[] => {
    try {
      if (node.data.values?.rules) {
        const parsed = JSON.parse(node.data.values.rules)
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed
        }
      }
    } catch {}
    return routes
  }

  const getLatestCases = (): SwitchValueCase[] => {
    try {
      if (node.data.values?.cases) {
        const parsed = JSON.parse(node.data.values.cases)
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed
        }
      }
    } catch {}
    return cases
  }

  // --- Rules Mode Handlers ---
  const handleUpdateRoute = (
    routeId: string,
    updates: Partial<SwitchRouteRule>
  ) => {
    const currentRoutes = getLatestRoutes()
    const next = currentRoutes.map((r) =>
      r.id === routeId ? { ...r, ...updates } : r
    )
    updateValues({ rules: JSON.stringify(next) })
  }

  const handleAddRoute = () => {
    const currentRoutes = getLatestRoutes()
    const next: SwitchRouteRule[] = [
      ...currentRoutes,
      {
        id: crypto.randomUUID(),
        name: `Route ${currentRoutes.length + 1}`,
        combinator: "and",
        conditions: [
          {
            id: crypto.randomUUID(),
            left: "",
            operator: "equals",
            right: "",
          },
        ],
      },
    ]
    updateValues({ rules: JSON.stringify(next) })
    requestAnimationFrame(() => updateNodeInternals(node.id))
  }

  const handleRemoveRoute = (routeId: string) => {
    const currentRoutes = getLatestRoutes()
    if (currentRoutes.length <= 1) return
    const deletedIndex = currentRoutes.findIndex((r) => r.id === routeId)
    if (deletedIndex === -1) return

    const next = currentRoutes.filter((r) => r.id !== routeId)
    updateValues({ rules: JSON.stringify(next) })

    // Atomically mutate Liveblocks CRDT storage & prune edges
    syncSwitchEdgesInLiveblocks({ type: "remove-route", deletedIndex })
    requestAnimationFrame(() => updateNodeInternals(node.id))
  }

  const handleAddConditionToRoute = (routeId: string) => {
    const currentRoutes = getLatestRoutes()
    const route = currentRoutes.find((r) => r.id === routeId)
    if (!route) return
    const nextConditions: ConditionCriterion[] = [
      ...route.conditions,
      {
        id: crypto.randomUUID(),
        left: "",
        operator: "equals",
        right: "",
      },
    ]
    const next = currentRoutes.map((r) =>
      r.id === routeId ? { ...r, conditions: nextConditions } : r
    )
    updateValues({ rules: JSON.stringify(next) })
  }

  const handleUpdateConditionInRoute = (
    routeId: string,
    conditionId: string,
    updates: Partial<ConditionCriterion>
  ) => {
    const currentRoutes = getLatestRoutes()
    const route = currentRoutes.find((r) => r.id === routeId)
    if (!route) return
    const nextConditions = route.conditions.map((c) =>
      c.id === conditionId ? { ...c, ...updates } : c
    )
    const next = currentRoutes.map((r) =>
      r.id === routeId ? { ...r, conditions: nextConditions } : r
    )
    updateValues({ rules: JSON.stringify(next) })
  }

  const handleRemoveConditionFromRoute = (
    routeId: string,
    conditionId: string
  ) => {
    const currentRoutes = getLatestRoutes()
    const route = currentRoutes.find((r) => r.id === routeId)
    if (!route || route.conditions.length <= 1) return
    const nextConditions = route.conditions.filter((c) => c.id !== conditionId)
    const next = currentRoutes.map((r) =>
      r.id === routeId ? { ...r, conditions: nextConditions } : r
    )
    updateValues({ rules: JSON.stringify(next) })
  }

  // --- Value Match Mode Handlers ---
  const handleAddCase = () => {
    const currentCases = getLatestCases()
    const next: SwitchValueCase[] = [
      ...currentCases,
      {
        id: crypto.randomUUID(),
        name: `Case ${currentCases.length + 1}`,
        operator: "equals",
        value: "",
      },
    ]
    updateValues({ cases: JSON.stringify(next) })
    requestAnimationFrame(() => updateNodeInternals(node.id))
  }

  const handleUpdateCase = (
    caseId: string,
    updates: Partial<SwitchValueCase>
  ) => {
    const currentCases = getLatestCases()
    const next = currentCases.map((c) =>
      c.id === caseId ? { ...c, ...updates } : c
    )
    updateValues({ cases: JSON.stringify(next) })
  }

  const handleRemoveCase = (caseId: string) => {
    const currentCases = getLatestCases()
    if (currentCases.length <= 1) return
    const deletedIndex = currentCases.findIndex((c) => c.id === caseId)
    if (deletedIndex === -1) return

    const next = currentCases.filter((c) => c.id !== caseId)
    updateValues({ cases: JSON.stringify(next) })

    // Atomically mutate Liveblocks CRDT storage & prune edges
    syncSwitchEdgesInLiveblocks({ type: "remove-case", deletedIndex })
    requestAnimationFrame(() => updateNodeInternals(node.id))
  }

  const handleSwitchMode = (newMode: "rules" | "value") => {
    updateValues({ mode: newMode })

    let newCount = 1
    if (newMode === "value") {
      const currentCases = getLatestCases()
      newCount = Math.max(1, currentCases.length)
    } else {
      const currentRoutes = getLatestRoutes()
      newCount = Math.max(1, currentRoutes.length)
    }

    // Atomically mutate Liveblocks CRDT storage & prune edges
    syncSwitchEdgesInLiveblocks({ type: "switch-mode", newMaxCount: newCount })
    requestAnimationFrame(() => updateNodeInternals(node.id))
  }

  return (
    <div className="flex min-w-0 flex-col gap-3.5 border-t border-border pt-3">
      {/* Mode Selector Segmented Tabs */}
      <div className="flex min-w-0 flex-col gap-1.5">
        <div className="flex items-center justify-between gap-1">
          <Label className="text-xs font-semibold">Routing Method</Label>
        </div>
        <div className="flex items-center rounded-lg border border-border bg-muted/40 p-1 shadow-2xs">
          <button
            type="button"
            onClick={() => handleSwitchMode("rules")}
            className={cn(
              "flex-1 cursor-pointer rounded-md py-1 text-center text-xs font-medium transition-colors",
              mode === "rules"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Custom Rules
          </button>
          <button
            type="button"
            onClick={() => handleSwitchMode("value")}
            className={cn(
              "flex-1 cursor-pointer rounded-md py-1 text-center text-xs font-medium transition-colors",
              mode === "value"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Match Value
          </button>
        </div>
      </div>

      {mode === "value" ? (
        /* ================= VALUE MATCH MODE ================= */
        <div className="flex min-w-0 flex-col gap-3.5">
          {/* Main Variable to Inspect */}
          <div className="flex min-w-0 flex-col gap-1.5 rounded-lg border border-border/80 bg-muted/20 p-2.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
              <GitFork className="size-3.5 shrink-0 text-orange-500" />
              <span>Variable to match</span>
            </div>
            <p className="text-[11px] leading-tight text-muted-foreground">
              Select the variable tested against your branches
            </p>
            <div className="min-w-0 pt-1">
              <TokenInput
                ref={(handle) => registerInputRef?.("valueExpression", handle)}
                value={valueExpression}
                onFocus={() => onFocusField?.("valueExpression")}
                onChange={(val) => updateValues({ valueExpression: val })}
                currentNodeId={node.id}
                placeholder="e.g. {{ Stripe · Event Type }}"
              />
            </div>
          </div>

          {/* Cases List */}
          <div className="flex min-w-0 flex-col gap-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold">Match Cases</Label>
              <span className="text-[11px] text-muted-foreground">
                {cases.length} {cases.length === 1 ? "route" : "routes"}
              </span>
            </div>

            <div className="flex min-w-0 flex-col gap-2">
              {cases.map((c, idx) => (
                <div
                  key={c.id}
                  className="flex min-w-0 flex-col gap-2 rounded-lg border border-border bg-card/60 p-2.5 shadow-2xs"
                >
                  {/* Case Header with Handle Badge */}
                  <div className="flex min-w-0 items-center justify-between gap-1.5">
                    <div className="flex min-w-0 flex-1 items-center gap-1.5">
                      <Input
                        value={c.name}
                        onChange={(e) =>
                          handleUpdateCase(c.id, { name: e.target.value })
                        }
                        className="h-6.5 min-w-0 px-2 text-xs font-medium"
                        placeholder={`Case ${idx + 1}`}
                      />
                    </div>
                    {cases.length > 1 && (
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => handleRemoveCase(c.id)}
                        className="size-6 shrink-0 cursor-pointer text-muted-foreground hover:text-destructive"
                        title="Remove case"
                      >
                        <Trash2 className="size-3" />
                      </Button>
                    )}
                  </div>

                  {/* Comparison Operator */}
                  <div className="flex min-w-0 flex-col gap-1">
                    <span className="text-[10px] font-medium text-muted-foreground">
                      When variable
                    </span>
                    <Select
                      value={c.operator}
                      onValueChange={(val) =>
                        handleUpdateCase(c.id, {
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

                  {/* Expected Value */}
                  <div className="flex min-w-0 flex-col gap-1">
                    <span className="text-[10px] font-medium text-muted-foreground">
                      Target value
                    </span>
                    <TokenInput
                      ref={(handle) =>
                        registerInputRef?.(`case-${c.id}-value`, handle)
                      }
                      value={c.value}
                      onFocus={() => onFocusField?.(`case-${c.id}-value`)}
                      onChange={(val) => handleUpdateCase(c.id, { value: val })}
                      currentNodeId={node.id}
                      placeholder="e.g. payment_intent.succeeded"
                    />
                  </div>
                </div>
              ))}

              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleAddCase}
                className="h-7.5 w-full cursor-pointer gap-1.5 border-dashed text-xs text-muted-foreground hover:text-foreground"
              >
                <Plus className="size-3.5" />
                <span>Add Match Case</span>
              </Button>
            </div>
          </div>
        </div>
      ) : (
        /* ================= RULES MODE ================= */
        <div className="flex min-w-0 flex-col gap-3">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-semibold">Routing Routes</Label>
            <span className="text-[11px] text-muted-foreground">
              {routes.length} {routes.length === 1 ? "route" : "routes"}
            </span>
          </div>

          <div className="flex min-w-0 flex-col gap-2.5">
            {routes.map((route, routeIdx) => (
              <div
                key={route.id}
                className="flex min-w-0 flex-col gap-2 rounded-lg border border-border bg-card/60 p-2.5 shadow-2xs"
              >
                {/* Route Header */}
                <div className="flex min-w-0 items-center justify-between gap-1.5">
                  <div className="flex min-w-0 flex-1 items-center gap-1.5">
                    <Input
                      value={route.name}
                      onChange={(e) =>
                        handleUpdateRoute(route.id, { name: e.target.value })
                      }
                      className="h-6.5 min-w-0 px-2 text-xs font-medium"
                      placeholder={`Route ${routeIdx + 1}`}
                    />
                  </div>

                  <div className="flex shrink-0 items-center gap-1">
                    <div className="flex items-center rounded border border-border bg-background p-0.5">
                      <button
                        type="button"
                        onClick={() =>
                          handleUpdateRoute(route.id, { combinator: "and" })
                        }
                        className={cn(
                          "cursor-pointer rounded px-1.5 py-0.5 text-[9px] font-bold uppercase transition-colors",
                          route.combinator === "and"
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        ALL
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          handleUpdateRoute(route.id, { combinator: "or" })
                        }
                        className={cn(
                          "cursor-pointer rounded px-1.5 py-0.5 text-[9px] font-bold uppercase transition-colors",
                          route.combinator === "or"
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        ANY
                      </button>
                    </div>

                    {routes.length > 1 && (
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => handleRemoveRoute(route.id)}
                        className="size-6 shrink-0 cursor-pointer text-muted-foreground hover:text-destructive"
                        title="Remove route"
                      >
                        <Trash2 className="size-3" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Conditions List */}
                <div className="flex min-w-0 flex-col gap-1.5">
                  {route.conditions.map((criterion, condIdx) => {
                    const isUnary =
                      criterion.operator === "is_empty" ||
                      criterion.operator === "is_not_empty"

                    return (
                      <div
                        key={criterion.id}
                        className="flex min-w-0 flex-col gap-1.5 rounded-md border border-border/50 bg-muted/30 p-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-medium text-muted-foreground">
                            Rule {condIdx + 1}
                          </span>
                          {route.conditions.length > 1 && (
                            <button
                              type="button"
                              onClick={() =>
                                handleRemoveConditionFromRoute(
                                  route.id,
                                  criterion.id
                                )
                              }
                              className="cursor-pointer text-muted-foreground hover:text-destructive"
                              title="Remove rule"
                            >
                              <Trash2 className="size-3" />
                            </button>
                          )}
                        </div>

                        {/* Left */}
                        <div className="flex min-w-0 flex-col gap-0.5">
                          <TokenInput
                            ref={(handle) =>
                              registerInputRef?.(
                                `route-${route.id}-c-${criterion.id}-left`,
                                handle
                              )
                            }
                            value={criterion.left}
                            onFocus={() =>
                              onFocusField?.(
                                `route-${route.id}-c-${criterion.id}-left`
                              )
                            }
                            onChange={(val) =>
                              handleUpdateConditionInRoute(
                                route.id,
                                criterion.id,
                                { left: val }
                              )
                            }
                            currentNodeId={node.id}
                            placeholder="Variable to check"
                          />
                        </div>

                        {/* Operator */}
                        <div className="flex min-w-0 flex-col gap-0.5">
                          <Select
                            value={criterion.operator}
                            onValueChange={(val) =>
                              handleUpdateConditionInRoute(
                                route.id,
                                criterion.id,
                                { operator: val as ConditionOperator }
                              )
                            }
                          >
                            <SelectTrigger className="h-6.5 w-full min-w-0 text-xs font-normal">
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

                        {/* Right */}
                        {!isUnary && (
                          <div className="flex min-w-0 flex-col gap-0.5">
                            <TokenInput
                              ref={(handle) =>
                                registerInputRef?.(
                                  `route-${route.id}-c-${criterion.id}-right`,
                                  handle
                                )
                              }
                              value={criterion.right}
                              onFocus={() =>
                                onFocusField?.(
                                  `route-${route.id}-c-${criterion.id}-right`
                                )
                              }
                              onChange={(val) =>
                                handleUpdateConditionInRoute(
                                  route.id,
                                  criterion.id,
                                  { right: val }
                                )
                              }
                              currentNodeId={node.id}
                              placeholder="Expected value"
                            />
                          </div>
                        )}
                      </div>
                    )
                  })}

                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => handleAddConditionToRoute(route.id)}
                    className="h-6.5 w-full cursor-pointer gap-1 text-[11px] text-muted-foreground hover:text-foreground"
                  >
                    <Plus className="size-3" />
                    <span>Add Condition</span>
                  </Button>
                </div>
              </div>
            ))}

            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleAddRoute}
              className="h-7.5 w-full cursor-pointer gap-1.5 border-dashed text-xs text-muted-foreground hover:text-foreground"
            >
              <Plus className="size-3.5" />
              <span>Add Output Route</span>
            </Button>
          </div>
        </div>
      )}

      {/* Fallback Configuration */}
      <div className="flex min-w-0 flex-col gap-2 rounded-lg border border-border/80 bg-muted/20 p-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-1.5">
            <CornerDownRight className="size-3.5 shrink-0 text-muted-foreground" />
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-xs font-semibold text-foreground">
                Fallback Output
              </span>
              <span className="text-[10px] leading-none text-muted-foreground">
                Routes here if no rules match
              </span>
            </div>
          </div>
          <Switch
            checked={fallbackEnabled}
            onCheckedChange={(checked) => {
              updateValues({ fallbackEnabled: checked ? "true" : "false" })
              if (!checked) {
                syncSwitchEdgesInLiveblocks({ type: "disable-fallback" })
              }
              requestAnimationFrame(() => updateNodeInternals(node.id))
            }}
          />
        </div>

        {fallbackEnabled && (
          <div className="flex min-w-0 items-center gap-2 border-t border-border/50 pt-1">
            <span className="shrink-0 text-[11px] text-muted-foreground">
              Output Name:
            </span>
            <Input
              value={fallbackName}
              onChange={(e) => updateValues({ fallbackName: e.target.value })}
              className="h-6.5 min-w-0 px-2 text-xs font-medium"
              placeholder="Fallback"
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default SwitchInspector

