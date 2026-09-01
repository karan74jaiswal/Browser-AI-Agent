import { memo, useMemo } from "react"
import { Handle, Position, useNodeConnections, type NodeProps } from "@xyflow/react"
import { Spinner } from "@/components/ui/spinner"

import {
  nodeRegistry,
  type NodeField,
  type StepNodeType,
} from "@/features/workflows/nodes/node-registry"
import { useNodeRunStatus } from "./workflow-runs-provider"
import { cn } from "@/lib/utils"

function StepNodeComponent({ id, data, selected }: NodeProps<StepNodeType>) {
  const { type, kind, title, values } = data
  const def = nodeRegistry[type]
  const isIfNode = type === "if"
  const isSwitchNode = type === "switch"
  const Icon = def.icon

  const outgoingConnections = useNodeConnections({ handleType: "source" })
  const isLeafNode = outgoingConnections.length === 0

  const switchOutputs = useMemo(() => {
    if (!isSwitchNode) return []
    const mode = values.mode || "rules"
    const fallbackEnabled = values.fallbackEnabled !== "false"
    const fallbackName = values.fallbackName || "fallback"

    const items: { id: string; label: string }[] = []
    if (mode === "value") {
      try {
        const cases = JSON.parse(values.cases || "[]")
        if (Array.isArray(cases)) {
          cases.forEach((c: { name?: string }, idx: number) => {
            items.push({ id: String(idx), label: c.name || `Case ${idx + 1}` })
          })
        }
      } catch {}
    } else {
      try {
        const routes = JSON.parse(values.rules || "[]")
        if (Array.isArray(routes)) {
          routes.forEach((r: { name?: string }, idx: number) => {
            items.push({ id: String(idx), label: r.name || `Route ${idx + 1}` })
          })
        }
      } catch {}
    }

    if (items.length === 0) {
      items.push({ id: "0", label: "0" })
    }

    if (fallbackEnabled) {
      items.push({ id: "fallback", label: fallbackName.toLowerCase() })
    }

    return items
  }, [isSwitchNode, values])

  const fields = (def.fields as NodeField[])
    .filter((field: NodeField) => !field.language && field.key !== "code")
    .map((field: NodeField) => {
      const rawValue = values[field.key] || field.defaultValue || ""
      if (!rawValue) return null
      let displayValue = rawValue
      if (field.options && field.options.length > 0) {
        const option = field.options.find((opt) => opt.value === rawValue)
        if (option) {
          displayValue = option.label
        }
      }
      return {
        field,
        displayValue,
      }
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)

  const {
    isRunning,
    isDone,
    isFailed,
    isStepCanceling,
    winningBranch,
    isLive,
  } = useNodeRunStatus(id, kind)

  // A trigger starts the flow and takes no input, so it has no target handle.
  const hasTarget = kind !== "trigger"

  return (
    <div
      className={cn(
        "relative max-w-80 min-w-50 rounded-(--radius) border-2 border-border bg-card text-card-foreground transition-all duration-300 ease-out will-change-transform",
        isRunning &&
          "scale-[1.035] z-20 border-blue-500/40 shadow-[0_8px_24px_rgba(59,130,246,0.18)]",
        isStepCanceling &&
          "scale-[1.02] border-amber-500/50 shadow-[0_0_16px_rgba(245,158,11,0.2)]",
        isFailed && "border-destructive shadow-[0_0_16px_rgba(239,68,68,0.15)]",
        isDone &&
          "border-emerald-500/50 dark:border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.1)]",
        selected && "ring-2 ring-ring ring-offset-2 ring-offset-background",
        isIfNode && "min-h-[72px] flex flex-col justify-center",
        isSwitchNode && "min-h-[80px] flex flex-col justify-center py-2"
      )}
      style={{
        minHeight: isSwitchNode
          ? `${Math.max(76, switchOutputs.length * 36)}px`
          : undefined,
      }}
    >
      {/* Circular border beam orbiting active node */}
      {isRunning && (
        <svg className="pointer-events-none absolute -inset-[2px] size-[calc(100%+4px)] overflow-visible z-10">
          <rect
            x="1"
            y="1"
            width="calc(100% - 2px)"
            height="calc(100% - 2px)"
            rx="calc(var(--radius) + 1px)"
            fill="none"
            stroke="rgb(59 130 246)"
            strokeWidth="2"
            pathLength="100"
            strokeDasharray="25 75"
            className="animate-border-beam"
          />
        </svg>
      )}

      {isStepCanceling && (
        <svg className="pointer-events-none absolute -inset-[2px] size-[calc(100%+4px)] overflow-visible z-10">
          <rect
            x="1"
            y="1"
            width="calc(100% - 2px)"
            height="calc(100% - 2px)"
            rx="calc(var(--radius) + 1px)"
            fill="none"
            stroke="rgb(245 158 11)"
            strokeWidth="2"
            pathLength="100"
            strokeDasharray="25 75"
            className="animate-border-beam"
          />
        </svg>
      )}

      {hasTarget && (
        <Handle
          type="target"
          position={Position.Left}
          style={{ transform: "translate(-100%, -50%)" }}
          className={cn(
            "h-3.5! w-1.5! min-w-0! rounded-l-xs! rounded-r-none! border-0! transition-colors duration-300",
            isFailed
              ? "bg-destructive!"
              : isStepCanceling
                ? "bg-amber-500!"
                : isRunning
                  ? "bg-blue-500!"
                  : isDone
                    ? "bg-emerald-500!"
                    : "bg-border!"
          )}
        />
      )}

      <div className="flex items-center gap-2.5 px-3 py-2.5">
        <div
          className={cn(
            "flex size-7 shrink-0 items-center justify-center rounded-md",
            def.accent
          )}
        >
          {isStepCanceling ? (
            <Spinner className="size-4 text-amber-500" />
          ) : isRunning ? (
            <Spinner className="size-4" />
          ) : (
            <Icon className="size-4" />
          )}
        </div>
        <span className="text-sm font-semibold">{title}</span>
      </div>
      {isIfNode ? (
        (() => {
          const hasTrueEdge = outgoingConnections.some(
            (c) =>
              ((c as { sourceHandleId?: string | null }).sourceHandleId ||
                c.sourceHandle) === "true"
          )
          const hasFalseEdge = outgoingConnections.some(
            (c) =>
              ((c as { sourceHandleId?: string | null }).sourceHandleId ||
                c.sourceHandle) === "false"
          )
          const hideTrueHandle = isLive && !hasTrueEdge
          const hideFalseHandle = isLive && !hasFalseEdge

          return (
            <>
              <Handle
                type="source"
                position={Position.Right}
                id="true"
                style={{ top: "28%", transform: "translate(100%, -50%)" }}
                className={cn(
                  "h-3.5! w-1.5! min-w-0! rounded-l-none! rounded-r-xs! border-0! transition-all duration-300",
                  hideTrueHandle
                    ? "opacity-0 pointer-events-none"
                    : isFailed
                      ? "bg-destructive!"
                      : isStepCanceling
                        ? "bg-amber-500!"
                        : isRunning
                          ? "bg-blue-500!"
                          : isDone && winningBranch === "true"
                            ? "bg-emerald-500!"
                            : "bg-border!"
                )}
              />
              <div
                style={{ top: "28%", transform: "translate(100%, -105%)" }}
                className={cn(
                  "pointer-events-none absolute right-0 z-20 flex items-center pl-2 transition-opacity duration-300",
                  hideTrueHandle && "opacity-0"
                )}
              >
                <span className="text-[10px] font-semibold text-muted-foreground select-none">
                  true
                </span>
              </div>

              <Handle
                type="source"
                position={Position.Right}
                id="false"
                style={{ top: "72%", transform: "translate(100%, -50%)" }}
                className={cn(
                  "h-3.5! w-1.5! min-w-0! rounded-l-none! rounded-r-xs! border-0! transition-all duration-300",
                  hideFalseHandle
                    ? "opacity-0 pointer-events-none"
                    : isFailed
                      ? "bg-destructive!"
                      : isStepCanceling
                        ? "bg-amber-500!"
                        : isRunning
                          ? "bg-blue-500!"
                          : isDone && winningBranch === "false"
                            ? "bg-emerald-500!"
                            : "bg-border!"
                )}
              />
              <div
                style={{ top: "72%", transform: "translate(100%, -105%)" }}
                className={cn(
                  "pointer-events-none absolute right-0 z-20 flex items-center pl-2 transition-opacity duration-300",
                  hideFalseHandle && "opacity-0"
                )}
              >
                <span className="text-[10px] font-semibold text-muted-foreground select-none">
                  false
                </span>
              </div>
            </>
          )
        })()
      ) : isSwitchNode ? (
        <>
          {switchOutputs.map((out, idx) => {
            const topPct = `${((idx + 0.5) / switchOutputs.length) * 100}%`
            const isWinning = isDone && winningBranch === out.id
            const hasOutEdge = outgoingConnections.some(
              (c) =>
                (((c as { sourceHandleId?: string | null }).sourceHandleId ||
                  c.sourceHandle ||
                  "0") === out.id)
            )
            const hideSwitchHandle = isLive && !hasOutEdge

            return (
              <div key={out.id}>
                <Handle
                  type="source"
                  position={Position.Right}
                  id={out.id}
                  style={{ top: topPct, transform: "translate(100%, -50%)" }}
                  className={cn(
                    "h-3.5! w-1.5! min-w-0! rounded-l-none! rounded-r-xs! border-0! transition-all duration-300",
                    hideSwitchHandle
                      ? "opacity-0 pointer-events-none"
                      : isFailed
                        ? "bg-destructive!"
                        : isStepCanceling
                          ? "bg-amber-500!"
                          : isRunning
                            ? "bg-blue-500!"
                            : isWinning
                              ? "bg-emerald-500!"
                              : "bg-border!"
                  )}
                />
                <div
                  style={{ top: topPct, transform: "translate(100%, -105%)" }}
                  className={cn(
                    "pointer-events-none absolute right-0 z-20 flex items-center pl-2 transition-opacity duration-300",
                    hideSwitchHandle && "opacity-0"
                  )}
                >
                  <span className="text-[10px] font-semibold text-muted-foreground select-none">
                    {out.label}
                  </span>
                </div>
              </div>
            )
          })}
        </>
      ) : (
        <>
          {fields.length > 0 && (
            <>
              <div className="border-t border-border" />
              <div className="flex flex-col gap-1.5 px-3 py-2.5">
                {fields.map(({ field, displayValue }) => (
                  <div
                    key={field.key}
                    className="flex items-center justify-between gap-4 text-xs"
                  >
                    <span className="shrink-0 text-muted-foreground">
                      {field.label}
                    </span>
                    <span className="truncate font-medium">
                      {displayValue}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
          <Handle
            type="source"
            position={Position.Right}
            style={{ transform: "translate(100%, -50%)" }}
            className={cn(
              "h-3.5! w-1.5! min-w-0! rounded-l-none! rounded-r-xs! border-0! transition-all duration-300",
              isLive && isLeafNode
                ? "opacity-0 pointer-events-none"
                : isFailed
                  ? "bg-destructive!"
                  : isStepCanceling
                    ? "bg-amber-500!"
                    : isRunning
                      ? "bg-blue-500!"
                      : isDone
                        ? "bg-emerald-500!"
                        : "bg-border!"
            )}
          />
        </>
      )}
    </div>
  )
}

export const StepNode = memo(StepNodeComponent)
