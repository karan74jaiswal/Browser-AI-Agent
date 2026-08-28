import { memo } from "react"
import { Handle, Position, type NodeProps } from "@xyflow/react"
import { Spinner } from "@/components/ui/spinner"

import {
  nodeRegistry,
  type NodeField,
  type StepNodeType,
} from "@/features/workflows/nodes/node-registry"
import { useLatestRunSteps } from "@/features/workflows/hooks"
import { cn } from "@/lib/utils"

function StepNodeComponent({ id, data, selected }: NodeProps<StepNodeType>) {
  const { type, kind, title, values } = data
  const def = nodeRegistry[type]
  const isIfNode = type === "if"
  const Icon = def.icon
  const fields = (def.fields as NodeField[])
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

  const { steps, isLive, cancelingRunId, latestRun } = useLatestRunSteps()
  const isRunCanceling = Boolean(
    cancelingRunId && latestRun?.id === cancelingRunId && isLive
  )
  const step = steps?.find((s) => s.id === id)
  const isFailed = step?.status === "failed"
  const isStepCanceling =
    isRunCanceling &&
    (step?.status === "running" ||
      (kind === "trigger" && step?.status !== "done" && !isFailed))
  const isRunning =
    isLive &&
    !isRunCanceling &&
    (step?.status === "running" ||
      (kind === "trigger" && step?.status !== "done" && !isFailed))
  const isDone = Boolean(
    step?.status === "done" && !isRunning && !isStepCanceling && !isFailed
  )
  const winningBranch = (step?.output as { branch?: string } | undefined)?.branch

  // A trigger starts the flow and takes no input, so it has no target handle.
  const hasTarget = kind !== "trigger"

  return (
    <div
      className={cn(
        "relative max-w-80 min-w-50 rounded-(--radius) border-2 border-border bg-card text-card-foreground transition-all duration-300 ease-in-out",
        isRunning && "border-blue-500/40 shadow-[0_0_16px_rgba(59,130,246,0.15)]",
        isStepCanceling &&
          "border-amber-500/50 shadow-[0_0_16px_rgba(245,158,11,0.2)]",
        isFailed && "border-destructive shadow-[0_0_16px_rgba(239,68,68,0.15)]",
        isDone &&
          "border-emerald-500/50 dark:border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.1)]",
        selected && "ring-2 ring-ring ring-offset-2 ring-offset-background",
        isIfNode && "min-h-[72px] flex flex-col justify-center"
      )}
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
            isStepCanceling
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
        <>
          <Handle
            type="source"
            position={Position.Right}
            id="true"
            style={{ top: "28%", transform: "translate(100%, -50%)" }}
            className={cn(
              "h-3.5! w-1.5! min-w-0! rounded-l-none! rounded-r-xs! border-0! transition-colors duration-300",
              isStepCanceling
                ? "bg-amber-500!"
                : isRunning
                  ? "bg-blue-500!"
                  : isDone && winningBranch === "true"
                    ? "bg-emerald-500!"
                    : "bg-border!"
            )}
          />
          <div
            style={{ top: "28%", transform: "translate(100%, -50%)" }}
            className="pointer-events-none absolute right-0 flex items-center pl-2.5"
          >
            <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 select-none">
              true
            </span>
          </div>

          <Handle
            type="source"
            position={Position.Right}
            id="false"
            style={{ top: "72%", transform: "translate(100%, -50%)" }}
            className={cn(
              "h-3.5! w-1.5! min-w-0! rounded-l-none! rounded-r-xs! border-0! transition-colors duration-300",
              isStepCanceling
                ? "bg-amber-500!"
                : isRunning
                  ? "bg-blue-500!"
                  : isDone && winningBranch === "false"
                    ? "bg-emerald-500!"
                    : "bg-border!"
            )}
          />
          <div
            style={{ top: "72%", transform: "translate(100%, -50%)" }}
            className="pointer-events-none absolute right-0 flex items-center pl-2.5"
          >
            <span className="text-[10px] font-semibold text-rose-600 dark:text-rose-400 select-none">
              false
            </span>
          </div>
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
              "h-3.5! w-1.5! min-w-0! rounded-l-none! rounded-r-xs! border-0! transition-colors duration-300",
              isStepCanceling
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
