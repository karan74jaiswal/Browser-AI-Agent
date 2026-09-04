import { useMemo } from "react"
import { Handle, Position } from "@xyflow/react"
import { cn } from "@/lib/utils"
import type { NodeHandlesProps, NodeHandleComponent } from "../../../types/handles"
import { getSourceHandleClassName } from "../../../handles/helpers"

export function getSwitchOutputs(values: Record<string, string>) {
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
}

export const SwitchNodeHandles: NodeHandleComponent = function SwitchNodeHandles({
  data,
  outgoingConnections,
  isLive,
  isFailed,
  isStepCanceling,
  isRunning,
  isDone,
  winningBranch,
}: NodeHandlesProps) {
  const switchOutputs = useMemo(() => getSwitchOutputs(data.values), [data.values])

  return (
    <>
      {switchOutputs.map((out, idx) => {
        const topPct = `${((idx + 0.5) / switchOutputs.length) * 100}%`
        const isWinning = isDone && winningBranch === out.id
        const hasOutEdge = outgoingConnections.some(
          (c) => (c.sourceHandle || "0") === out.id
        )
        const hideSwitchHandle = isLive && !hasOutEdge

        return (
          <div key={out.id}>
            <Handle
              type="source"
              position={Position.Right}
              id={out.id}
              style={{ top: topPct, transform: "translate(100%, -50%)" }}
              className={getSourceHandleClassName({
                isLive,
                hasEdge: hasOutEdge,
                isFailed,
                isStepCanceling,
                isRunning,
                isWinning,
              })}
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
  )
}

SwitchNodeHandles.containerClassName = "min-h-20 justify-center py-2"
SwitchNodeHandles.getContainerStyle = (values: Record<string, string>) => ({
  minHeight: `${Math.max(76, getSwitchOutputs(values).length * 36)}px`,
})
