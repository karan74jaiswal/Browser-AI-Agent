import { Handle, Position } from "@xyflow/react"
import { cn } from "@/lib/utils"
import type { NodeHandlesProps, NodeHandleComponent } from "../../../types/handles"
import { getSourceHandleClassName } from "../../../handles/helpers"

export const IfNodeHandles: NodeHandleComponent = function IfNodeHandles({
  outgoingConnections,
  isLive,
  isFailed,
  isStepCanceling,
  isRunning,
  isDone,
  winningBranch,
}: NodeHandlesProps) {
  const hasTrueEdge = outgoingConnections.some(
    (c) => c.sourceHandle === "true"
  )
  const hasFalseEdge = outgoingConnections.some(
    (c) => c.sourceHandle === "false"
  )
  const hideTrueHandle = isLive && !hasTrueEdge
  const hideFalseHandle = isLive && !hasFalseEdge

  return (
    <>
      {/* True Handle (Top Handle: 28%) */}
      <Handle
        type="source"
        position={Position.Right}
        id="true"
        style={{ top: "28%", transform: "translate(100%, -50%)" }}
        className={getSourceHandleClassName({
          isLive,
          hasEdge: hasTrueEdge,
          isFailed,
          isStepCanceling,
          isRunning,
          isWinning: isDone && winningBranch === "true",
        })}
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

      {/* False Handle (Bottom Handle: 72%) */}
      <Handle
        type="source"
        position={Position.Right}
        id="false"
        style={{ top: "72%", transform: "translate(100%, -50%)" }}
        className={getSourceHandleClassName({
          isLive,
          hasEdge: hasFalseEdge,
          isFailed,
          isStepCanceling,
          isRunning,
          isWinning: isDone && winningBranch === "false",
        })}
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
}

IfNodeHandles.containerClassName = "min-h-18 justify-center"
