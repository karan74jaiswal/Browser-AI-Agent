"use client"

import React, { memo } from "react"
import { BaseEdge, getSmoothStepPath, type EdgeProps } from "@xyflow/react"
import { useLatestRunSteps } from "./workflow-runs-provider"

const baseEdgeStyle: React.CSSProperties = {
  stroke: "var(--border)",
  strokeWidth: 2,
}

function WorkflowEdgeComponent(props: EdgeProps) {
  const {
    id,
    source,
    target,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style,
    markerEnd,
  } = props

  const [edgePath] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  })

  const { steps, isLive, cancelingRunId, latestRun } = useLatestRunSteps()
  const isRunCanceling = Boolean(
    cancelingRunId && latestRun?.id === cancelingRunId && isLive
  )
  const sourceStep = steps?.find((s) => s.id === source)
  const targetStep = steps?.find((s) => s.id === target)

  const handleId =
    (props as { sourceHandleId?: string | null; sourceHandle?: string | null })
      .sourceHandleId ||
    (props as { sourceHandleId?: string | null; sourceHandle?: string | null })
      .sourceHandle ||
    "true"

  const outputObj = sourceStep?.output as
    | { branch?: string; result?: boolean }
    | undefined
  const activeBranch = outputObj?.branch

  // If the source node is an "if" node, verify that this edge matches the winning branch
  const isBranchActive =
    sourceStep?.type !== "if" ||
    !activeBranch ||
    handleId === activeBranch

  // Edge is active strictly during the handoff phase: source is finished ("done")
  // and target is waiting to begin execution ("pending")
  const isTransferring =
    isLive &&
    !isRunCanceling &&
    sourceStep?.status === "done" &&
    isBranchActive &&
    targetStep?.status === "pending"

  const combinedStyle = React.useMemo(() => {
    return style ? { ...baseEdgeStyle, ...style } : baseEdgeStyle
  }, [style])

  return (
    <>
      {/* Base normal gray edge */}
      <BaseEdge
        id={id}
        path={edgePath}
        style={combinedStyle}
        markerEnd={markerEnd}
      />

      {/* Progressive solid blue line and traveling particle */}
      {isTransferring && (
        <>
          <path
            d={edgePath}
            fill="none"
            stroke="rgb(59 130 246)"
            strokeWidth={2}
            pathLength={1}
            strokeDasharray={1}
            strokeDashoffset={1}
            className="animate-draw-edge"
          />
          <circle r="3.5" fill="rgb(59 130 246)">
            <animateMotion
              dur="0.6s"
              repeatCount="indefinite"
              path={edgePath}
            />
          </circle>
        </>
      )}
    </>
  )
}

export const WorkflowEdge = memo(WorkflowEdgeComponent)
