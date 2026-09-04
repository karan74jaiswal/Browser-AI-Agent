import { Handle, Position } from "@xyflow/react"
import { cn } from "@/lib/utils"
import type { NodeHandlesProps, NodeHandleComponent } from "../../../types/handles"
import { getSourceHandleClassName } from "../../../handles/helpers"

export const LoopNodeHandles: NodeHandleComponent = function LoopNodeHandles({
  data,
  outgoingConnections,
  isLive,
  isFailed,
  isStepCanceling,
  isRunning,
  isDone,
  winningBranch,
}: NodeHandlesProps) {
  const { values } = data
  const hasDoneEdge = outgoingConnections.some(
    (c) => c.sourceHandle === "done"
  )
  const hasLoopEdge = outgoingConnections.some(
    (c) => c.sourceHandle === "loop"
  )
  const hideDoneHandle = isLive && !hasDoneEdge
  const hideLoopHandle = isLive && !hasLoopEdge

  const mode = values.mode || "for_each"
  const modeSummary =
    mode === "count"
      ? `Repeat ${values.count || "5"}x`
      : mode === "while"
        ? values.whileRuleMode === "while"
          ? "While true"
          : "Until met"
        : "List of items"

  return (
    <>
      <div className="border-t border-border" />
      <div className="flex items-center justify-between px-3 py-1.5 text-xs text-muted-foreground">
        <span>Mode</span>
        <span className="font-medium text-foreground">{modeSummary}</span>
      </div>

      {/* Loop Done Handle (Top Handle: 28%) */}
      <Handle
        type="source"
        position={Position.Right}
        id="done"
        style={{ top: "28%", transform: "translate(100%, -50%)" }}
        className={getSourceHandleClassName({
          isLive,
          hasEdge: hasDoneEdge,
          isFailed,
          isStepCanceling,
          isRunning,
          isWinning: isDone && winningBranch === "done",
        })}
      />
      <div
        style={{ top: "28%", transform: "translate(100%, -105%)" }}
        className={cn(
          "pointer-events-none absolute right-0 z-20 flex items-center pl-2 transition-opacity duration-300",
          hideDoneHandle && "opacity-0"
        )}
      >
        <span className="text-[10px] font-semibold text-muted-foreground select-none">
          done
        </span>
      </div>

      {/* Loop Iteration Handle (Bottom Handle: 72%) */}
      <Handle
        type="source"
        position={Position.Right}
        id="loop"
        style={{ top: "72%", transform: "translate(100%, -50%)" }}
        className={getSourceHandleClassName({
          isLive,
          hasEdge: hasLoopEdge,
          isFailed,
          isStepCanceling,
          isRunning,
          isWinning: isDone,
        })}
      />
      <div
        style={{ top: "72%", transform: "translate(100%, -105%)" }}
        className={cn(
          "pointer-events-none absolute right-0 z-20 flex items-center pl-2 transition-opacity duration-300",
          hideLoopHandle && "opacity-0"
        )}
      >
        <span className="text-[10px] font-semibold text-muted-foreground select-none">
          loop
        </span>
      </div>
    </>
  )
}

LoopNodeHandles.containerClassName = "min-h-19 justify-center"
