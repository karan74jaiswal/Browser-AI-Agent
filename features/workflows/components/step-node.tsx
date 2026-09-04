import { memo } from "react"
import {
  Handle,
  Position,
  useNodeConnections,
  type NodeProps,
} from "@xyflow/react"
import { Spinner } from "@/components/ui/spinner"

import {
  systemNodeRegistry,
  getSystemNodeHandle,
  DefaultNodeHandles,
  type StepNodeType,
  type NodeHandlesProps,
} from "@/features/workflows/system"
import { useNodeRunStatus } from "./workflow-runs-provider"
import { EditableNodeTitle } from "./editable-node-title"
import { cn } from "@/lib/utils"

function StepNodeComponent(props: NodeProps<StepNodeType>) {
  const { id, data, selected } = props
  const { type, kind, title, values } = data
  const def = systemNodeRegistry[type]
  const HandleComponent = getSystemNodeHandle(type) ?? DefaultNodeHandles

  const outgoingConnections = useNodeConnections({ handleType: "source" })
  const isLeafNode = outgoingConnections.length === 0

  const {
    isRunning,
    isDone,
    isFailed,
    isStepCanceling,
    winningBranch,
    isLive,
  } = useNodeRunStatus(id, kind)

  if (!def) return null
  const Icon = def.icon

  // A trigger starts the flow and takes no input, so it has no target handle.
  const hasTarget = kind !== "trigger"

  const handleProps: NodeHandlesProps = {
    ...props,
    outgoingConnections,
    isLeafNode,
    isRunning,
    isDone,
    isFailed,
    isStepCanceling,
    winningBranch,
    isLive,
  }

  return (
    <div
      className={cn(
        "relative max-w-80 min-w-50 rounded-lg border-2 border-border bg-card text-card-foreground transition-all duration-300 ease-out will-change-transform flex flex-col",
        isRunning &&
          "z-20 scale-[1.035] border-blue-500/40 shadow-[0_8px_24px_rgba(59,130,246,0.18)]",
        isStepCanceling &&
          "scale-[1.02] border-amber-500/50 shadow-[0_0_16px_rgba(245,158,11,0.2)]",
        isFailed && "border-destructive shadow-[0_0_16px_rgba(239,68,68,0.15)]",
        isDone &&
          "border-emerald-500/50 shadow-[0_0_12px_rgba(16,185,129,0.1)] dark:border-emerald-500/40",
        selected && "ring-2 ring-ring ring-offset-2 ring-offset-background",
        HandleComponent.containerClassName
      )}
      style={HandleComponent.getContainerStyle?.(values)}
    >
      {/* Circular border beam orbiting active node */}
      {isRunning && (
        <svg className="pointer-events-none absolute -inset-0.5 z-10 size-[calc(100%+4px)] overflow-visible">
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
        <svg className="pointer-events-none absolute -inset-0.5 z-10 size-[calc(100%+4px)] overflow-visible">
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
        <EditableNodeTitle
          nodeId={id}
          title={title}
          type={type}
          inputClassName="text-sm"
          textClassName="text-sm hover:cursor-grab"
        />
      </div>

      <HandleComponent {...handleProps} />
    </div>
  )
}

export const StepNode = memo(StepNodeComponent)
