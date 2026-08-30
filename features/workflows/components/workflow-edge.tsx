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
  // Find the exact step instance initiated by this specific edge (prioritize active running/pending pass)
  const edgeSteps = steps?.filter((s) => s.edgeId === id) ?? []
  const edgeRunning = edgeSteps.find((s) => s.status === "running")
  const edgePending = edgeSteps.find((s) => s.status === "pending")
  const edgeDone = [...edgeSteps].reverse().find((s) => s.status === "done")
  const edgeStep = edgeRunning ?? edgePending ?? edgeDone ?? edgeSteps[edgeSteps.length - 1]

  const sourceSteps = steps?.filter((s) => s.nodeId === source || s.id === source) ?? []
  const targetSteps = steps?.filter((s) => s.nodeId === target || s.id === target) ?? []

  const hasSourceDone = sourceSteps.some((s) => s.status === "done")
  const hasTargetDone = targetSteps.some((s) => s.status === "done")

  const sourceRunning = sourceSteps.find((s) => s.status === "running")
  const sourceDone = sourceSteps.find((s) => s.status === "done")
  const sourceStep = sourceRunning ?? sourceDone ?? sourceSteps[sourceSteps.length - 1]

  const targetRunning = targetSteps.find((s) => s.status === "running")
  const targetPending = targetSteps.find((s) => s.status === "pending")

  const handleId =
    (props as { sourceHandleId?: string | null; sourceHandle?: string | null })
      .sourceHandleId ||
    (props as { sourceHandleId?: string | null; sourceHandle?: string | null })
      .sourceHandle ||
    "true"

  const outputObj = sourceStep?.output as
    { branch?: string; result?: boolean } | undefined
  const activeBranch = outputObj?.branch

  // If the source node is an "if" or "switch" node, verify that this edge matches the winning branch
  const isBranchingNode =
    sourceStep?.type === "if" || sourceStep?.type === "switch"
  const isBranchActive =
    !isBranchingNode || !activeBranch || handleId === activeBranch

  // Edge is transferring/animating while live, source has completed, branch is active, and target is pending (token traveling to target)
  const isTransferring = Boolean(
    isLive &&
    !isRunCanceling &&
    hasSourceDone &&
    isBranchActive &&
    (edgeStep ? edgeStep.status === "pending" : (targetPending?.status === "pending" && !targetRunning))
  )

  // Edge was traversed successfully once the token reaches the target (target is running or done)
  const isTraversed = Boolean(
    !isTransferring &&
    hasSourceDone &&
    isBranchActive &&
    (edgeStep ? (edgeStep.status === "running" || edgeStep.status === "done") : (hasTargetDone || Boolean(targetRunning)))
  )

  // Edge failed if the specific step initiated by this edge failed
  const isFailed = Boolean(
    edgeStep?.status === "failed" &&
    isBranchActive
  )

  const combinedStyle = React.useMemo(() => {
    const base = { ...baseEdgeStyle, ...style }
    if (isTraversed) {
      return {
        ...base,
        stroke: "rgb(16 185 129)", // Emerald 500
        strokeWidth: 2,
      }
    }
    if (isFailed) {
      return {
        ...base,
        stroke: "var(--destructive)",
        strokeWidth: 2,
      }
    }
    return base
  }, [isTraversed, isFailed, style])

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
