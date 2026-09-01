"use client"

import React, { memo } from "react"
import { BaseEdge, getSmoothStepPath, type EdgeProps } from "@xyflow/react"
import { useEdgeRunStatus } from "./workflow-runs-provider"

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

  const handleId =
    (props as { sourceHandleId?: string | null; sourceHandle?: string | null })
      .sourceHandleId ||
    (props as { sourceHandleId?: string | null; sourceHandle?: string | null })
      .sourceHandle ||
    "true"

  const { isTransferring, isTraversed } = useEdgeRunStatus({
    edgeId: id,
    source,
    target,
    handleId,
  })

  const combinedStyle = React.useMemo(() => {
    const base = { ...baseEdgeStyle, ...style }
    if (isTraversed) {
      return {
        ...base,
        stroke: "rgb(16 185 129)", // Emerald 500
        strokeWidth: 2,
      }
    }
    return base
  }, [isTraversed, style])

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
