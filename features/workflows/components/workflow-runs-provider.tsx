"use client"

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react"
import { useRealtimeRunsWithTag } from "@trigger.dev/react-hooks"
import { cancelWorkflowAction } from "@/features/workflows/actions"
import {
  playStepStartSound,
  playStepSuccessSound,
  playStepErrorSound,
  playWorkflowSuccessSound,
} from "@/features/workflows/lib/workflow-sound"
import type {
  runWorkflowTask,
  RunStep,
} from "@/features/workflows/tasks/run-workflow"

export type { RunStep }

export type WorkflowRun = ReturnType<
  typeof useRealtimeRunsWithTag<typeof runWorkflowTask>
>["runs"][number] & {
  sessionId?: string
}

export function getRunSessionId(
  run:
    | WorkflowRun
    | { output?: unknown; metadata?: unknown; status?: string; sessionId?: string }
    | undefined
    | null
): string | undefined {
  if (!run) return undefined

  // Read session id from the run's final output (not live metadata)
  const output = run.output as
    | { sessionId?: string }
    | undefined

  if (output && typeof output.sessionId === "string" && output.sessionId) {
    return output.sessionId
  }

  if ("sessionId" in run && typeof run.sessionId === "string" && run.sessionId) {
    return run.sessionId
  }

  return undefined
}

export function getRunSteps(
  run:
    | WorkflowRun
    | { output?: unknown; metadata?: unknown; status?: string }
    | undefined
    | null
): RunStep[] | undefined {
  if (!run) return undefined

  let rawSteps: RunStep[] | undefined = undefined

  // Prefer final output steps
  const output = run.output as
    | { steps?: RunStep[] }
    | RunStep[]
    | undefined

  if (output) {
    if (Array.isArray(output)) {
      rawSteps = output
    } else if (Array.isArray(output.steps)) {
      rawSteps = output.steps
    }
  }

  // Fall back to live / persisted metadata steps
  if (!rawSteps) {
    const metadata = run.metadata as { steps?: RunStep[] } | undefined
    if (metadata && Array.isArray(metadata.steps)) {
      rawSteps = metadata.steps
    }
  }

  if (!rawSteps) return undefined

  const statusUpper =
    "status" in run && typeof run.status === "string"
      ? run.status.toUpperCase()
      : undefined
  const isCanceled = statusUpper === "CANCELED" || statusUpper === "CANCELLED"
  const isFailed = statusUpper === "FAILED" || statusUpper === "CRASHED"

  if (isCanceled) {
    const allDone =
      rawSteps.length > 0 && rawSteps.every((s) => s.status === "done")
    if (!allDone) {
      return rawSteps.map((s) => {
        if (s.status === "running") {
          return { ...s, status: "canceled" as const }
        }
        if (s.status === "pending") {
          return { ...s, status: "skipped" as const }
        }
        return s
      })
    }
  }

  if (isFailed) {
    return rawSteps.map((s) => {
      if (s.status === "pending") {
        return { ...s, status: "skipped" as const }
      }
      return s
    })
  }

  return rawSteps
}

export interface WorkflowRunsContextValue {
  runs: WorkflowRun[]
  latestRun: WorkflowRun | undefined
  steps: RunStep[] | undefined
  sessionId: string | undefined
  isLive: boolean
  error: Error | undefined
  stop: () => void
  getRunSteps: (
    run:
      | WorkflowRun
      | { output?: unknown; metadata?: unknown; status?: string }
      | undefined
      | null
  ) => RunStep[] | undefined
  getRunSessionId: (
    run:
      | WorkflowRun
      | { output?: unknown; metadata?: unknown; status?: string; sessionId?: string }
      | undefined
      | null
  ) => string | undefined
  selectedRunId: string | null
  setSelectedRunId: (id: string | null) => void
  selectedRun: WorkflowRun | undefined
  selectedRunSteps: RunStep[] | undefined
  selectedRunSessionId: string | undefined
  cancelingRunId: string | null
  cancelRun: (runId: string) => Promise<void>
}

export interface NodeRunStatus {
  isRunning: boolean
  isDone: boolean
  isFailed: boolean
  isStepCanceling: boolean
  winningBranch?: string
  isLive: boolean
}

export interface EdgeRunStatus {
  isTransferring: boolean
  isTraversed: boolean
  isLive: boolean
  isRunCanceling: boolean
}

export const DEFAULT_NODE_RUN_STATUS: NodeRunStatus = {
  isRunning: false,
  isDone: false,
  isFailed: false,
  isStepCanceling: false,
  isLive: false,
}

export const DEFAULT_EDGE_RUN_STATUS: EdgeRunStatus = {
  isTransferring: false,
  isTraversed: false,
  isLive: false,
  isRunCanceling: false,
}

export function computeNodeRunStatus(
  nodeId: string,
  kind: string | undefined,
  steps: RunStep[] | undefined,
  isLive: boolean,
  cancelingRunId: string | null,
  latestRunId?: string
): NodeRunStatus {
  const isRunCanceling = Boolean(
    cancelingRunId && latestRunId === cancelingRunId && isLive
  )
  const nodeSteps = steps?.filter((s) => s.nodeId === nodeId || s.id === nodeId) ?? []
  const hasRunning = nodeSteps.some((s) => s.status === "running")
  const hasDone = nodeSteps.some((s) => s.status === "done")
  const hasFailed = nodeSteps.some((s) => s.status === "failed")

  const runningStep = nodeSteps.find((s) => s.status === "running")
  const doneStep = [...nodeSteps].reverse().find((s) => s.status === "done")
  const latestStep = nodeSteps[nodeSteps.length - 1]
  const step = runningStep ?? doneStep ?? latestStep

  const isFailed = hasFailed && !hasRunning
  const isStepCanceling =
    isRunCanceling &&
    (hasRunning || (kind === "trigger" && !hasDone && !isFailed))
  const isRunning =
    isLive &&
    !isRunCanceling &&
    (hasRunning || (kind === "trigger" && !hasDone && !isFailed))
  const isDone = Boolean(hasDone && !isRunning && !isStepCanceling && !isFailed)
  const winningBranch = (step?.output as { branch?: string } | undefined)?.branch

  return {
    isRunning,
    isDone,
    isFailed,
    isStepCanceling,
    winningBranch,
    isLive,
  }
}

export function computeEdgeRunStatus({
  edgeId,
  source,
  target,
  handleId = "true",
  steps,
  isLive,
  cancelingRunId,
  latestRunId,
}: {
  edgeId: string
  source: string
  target: string
  handleId?: string
  steps: RunStep[] | undefined
  isLive: boolean
  cancelingRunId: string | null
  latestRunId?: string
}): EdgeRunStatus {
  const isRunCanceling = Boolean(
    cancelingRunId && latestRunId === cancelingRunId && isLive
  )
  const edgeSteps = steps?.filter((s) => s.edgeId === edgeId) ?? []
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

  const outputObj = sourceStep?.output as
    { branch?: string; result?: boolean } | undefined
  const activeBranch = outputObj?.branch

  const isBranchingNode =
    sourceStep?.type === "if" || sourceStep?.type === "switch"
  const isBranchActive =
    !isBranchingNode || !activeBranch || handleId === activeBranch

  const isEdgeSkipped = edgeStep?.status === "skipped"

  const hasTargetStartedOrFinished = Boolean(
    targetRunning ||
    hasTargetDone ||
    targetSteps.some((s) => s.status === "failed")
  )

  const isTransferring = Boolean(
    isLive &&
    !isRunCanceling &&
    !isEdgeSkipped &&
    hasSourceDone &&
    isBranchActive &&
    !hasTargetStartedOrFinished
  )

  const isTraversed = Boolean(
    !isTransferring &&
    !isEdgeSkipped &&
    hasSourceDone &&
    isBranchActive &&
    hasTargetStartedOrFinished
  )

  return {
    isTransferring,
    isTraversed,
    isLive,
    isRunCanceling,
  }
}

export interface ExecutionStore {
  subscribe: (listener: () => void) => () => void
  getNodeStatus: (nodeId: string, kind?: string) => NodeRunStatus
  getEdgeStatus: (params: {
    edgeId: string
    source: string
    target: string
    handleId?: string
  }) => EdgeRunStatus
}

const WorkflowRunsContext = createContext<WorkflowRunsContextValue | null>(null)
const ExecutionStoreContext = createContext<ExecutionStore | null>(null)

export interface WorkflowRunsProviderProps {
  workflowId: string
  publicAccessToken?: string
  accessToken?: string
  children: React.ReactNode
}

const TERMINAL_STATUSES = new Set([
  "COMPLETED",
  "FAILED",
  "CANCELED",
  "CANCELLED",
  "CRASHED",
  "INTERRUPTED",
  "SYSTEM_FAILURE",
  "TIMED_OUT",
  "EXPIRED",
])

export function isRunLive(status?: string): boolean {
  if (!status) return false
  return !TERMINAL_STATUSES.has(status.toUpperCase())
}

export function WorkflowRunsProvider({
  workflowId,
  publicAccessToken,
  accessToken,
  children,
}: WorkflowRunsProviderProps) {
  const token = publicAccessToken ?? accessToken
  const tag = workflowId.startsWith("workflow:")
    ? workflowId
    : `workflow:${workflowId}`

  const { runs, error, stop } = useRealtimeRunsWithTag<typeof runWorkflowTask>(
    tag,
    {
      accessToken: token,
      enabled: Boolean(token && workflowId),
    }
  )

  const [selectedRunId, setSelectedRunId] = useState<string | null>(null)
  const [rawCancelingRunId, setRawCancelingRunId] = useState<string | null>(null)

  const sortedRuns = useMemo(() => {
    if (!runs || runs.length === 0) return []
    return [...runs]
      .sort((a, b) => {
        const aTime = new Date(a.createdAt).getTime()
        const bTime = new Date(b.createdAt).getTime()
        return bTime - aTime
      })
      .map((run) => ({
        ...run,
        sessionId: getRunSessionId(run),
      }))
  }, [runs])

  const latestRun = useMemo(() => {
    return sortedRuns[0]
  }, [sortedRuns])

  const steps = useMemo(() => {
    return getRunSteps(latestRun)
  }, [latestRun])

  const sessionId = useMemo(() => {
    return getRunSessionId(latestRun)
  }, [latestRun])

  const isLive = useMemo(() => {
    return isRunLive(latestRun?.status)
  }, [latestRun?.status])

  // Canceling is active strictly while the run is live
  const cancelingRunId = isLive ? rawCancelingRunId : null

  // Sound effects on step and run lifecycle transitions
  const prevStepStatusesRef = React.useRef<Map<string, string>>(new Map())
  const prevRunStatusRef = React.useRef<string | undefined>(undefined)

  React.useEffect(() => {
    if (!latestRun) {
      prevStepStatusesRef.current.clear()
      prevRunStatusRef.current = undefined
      return
    }

    const currentStatus = latestRun.status?.toUpperCase()
    const prevRunStatus = prevRunStatusRef.current

    // Detect overall run completion
    if (
      prevRunStatus &&
      isRunLive(prevRunStatus) &&
      currentStatus === "COMPLETED"
    ) {
      playWorkflowSuccessSound()
    }
    prevRunStatusRef.current = currentStatus

    if (!steps || steps.length === 0) return

    const prevMap = prevStepStatusesRef.current
    for (const step of steps) {
      const prevStatus = prevMap.get(step.id)
      if (prevStatus !== step.status) {
        if (step.status === "running" && prevStatus !== "running") {
          playStepStartSound()
        } else if (
          step.status === "done" &&
          (prevStatus === "running" || prevStatus === "pending")
        ) {
          playStepSuccessSound()
        } else if (
          step.status === "failed" &&
          prevStatus !== "failed"
        ) {
          playStepErrorSound()
        }
        prevMap.set(step.id, step.status)
      }
    }
  }, [steps, latestRun])

  // Granular Node & Edge Execution Store with referential snapshot caching
  const listenersRef = React.useRef<Set<() => void>>(new Set())
  const nodeCacheRef = React.useRef<Map<string, NodeRunStatus>>(new Map())
  const edgeCacheRef = React.useRef<Map<string, EdgeRunStatus>>(new Map())

  React.useEffect(() => {
    // Recompute cached entries
    for (const [key, prev] of nodeCacheRef.current.entries()) {
      const [nodeId, kind] = key.split(":")
      const next = computeNodeRunStatus(
        nodeId,
        kind,
        steps,
        isLive,
        cancelingRunId,
        latestRun?.id
      )
      if (
        prev.isRunning !== next.isRunning ||
        prev.isDone !== next.isDone ||
        prev.isFailed !== next.isFailed ||
        prev.isStepCanceling !== next.isStepCanceling ||
        prev.winningBranch !== next.winningBranch ||
        prev.isLive !== next.isLive
      ) {
        nodeCacheRef.current.set(key, next)
      }
    }

    for (const [key, prev] of edgeCacheRef.current.entries()) {
      const [edgeId, source, target, handleId] = key.split(":")
      const next = computeEdgeRunStatus({
        edgeId,
        source,
        target,
        handleId,
        steps,
        isLive,
        cancelingRunId,
        latestRunId: latestRun?.id,
      })
      if (
        prev.isTransferring !== next.isTransferring ||
        prev.isTraversed !== next.isTraversed ||
        prev.isLive !== next.isLive ||
        prev.isRunCanceling !== next.isRunCanceling
      ) {
        edgeCacheRef.current.set(key, next)
      }
    }

    // Broadcast to active node and edge listeners
    listenersRef.current.forEach((listener) => listener())
  }, [steps, isLive, cancelingRunId, latestRun?.id])

  const executionStore = useMemo<ExecutionStore>(() => {
    return {
      subscribe: (listener: () => void) => {
        listenersRef.current.add(listener)
        return () => {
          listenersRef.current.delete(listener)
        }
      },
      getNodeStatus: (nodeId: string, kind?: string) => {
        const key = `${nodeId}:${kind ?? ""}`
        let cached = nodeCacheRef.current.get(key)
        if (!cached) {
          cached = computeNodeRunStatus(
            nodeId,
            kind,
            steps,
            isLive,
            cancelingRunId,
            latestRun?.id
          )
          nodeCacheRef.current.set(key, cached)
        }
        return cached
      },
      getEdgeStatus: (params: {
        edgeId: string
        source: string
        target: string
        handleId?: string
      }) => {
        const key = `${params.edgeId}:${params.source}:${params.target}:${params.handleId ?? "true"}`
        let cached = edgeCacheRef.current.get(key)
        if (!cached) {
          cached = computeEdgeRunStatus({
            ...params,
            steps,
            isLive,
            cancelingRunId,
            latestRunId: latestRun?.id,
          })
          edgeCacheRef.current.set(key, cached)
        }
        return cached
      },
    }
  }, [steps, isLive, cancelingRunId, latestRun?.id])

  const cancelRun = useCallback(async (runId: string) => {
    setRawCancelingRunId(runId)
    try {
      await cancelWorkflowAction(runId)
    } catch (err) {
      setRawCancelingRunId(null)
      throw err
    }
  }, [])

  const selectedRun = useMemo(() => {
    if (!selectedRunId) return latestRun
    return sortedRuns.find((run) => run.id === selectedRunId) ?? latestRun
  }, [selectedRunId, sortedRuns, latestRun])

  const selectedRunSteps = useMemo(() => {
    return getRunSteps(selectedRun)
  }, [selectedRun])

  const selectedRunSessionId = useMemo(() => {
    return getRunSessionId(selectedRun)
  }, [selectedRun])

  const value = useMemo<WorkflowRunsContextValue>(
    () => ({
      runs: sortedRuns,
      latestRun,
      steps,
      sessionId,
      isLive,
      error,
      stop,
      getRunSteps,
      getRunSessionId,
      selectedRunId,
      setSelectedRunId,
      selectedRun,
      selectedRunSteps,
      selectedRunSessionId,
      cancelingRunId,
      cancelRun,
    }),
    [
      sortedRuns,
      latestRun,
      steps,
      sessionId,
      isLive,
      error,
      stop,
      selectedRunId,
      selectedRun,
      selectedRunSteps,
      selectedRunSessionId,
      cancelingRunId,
      cancelRun,
    ]
  )

  return (
    <ExecutionStoreContext.Provider value={executionStore}>
      <WorkflowRunsContext.Provider value={value}>
        {children}
      </WorkflowRunsContext.Provider>
    </ExecutionStoreContext.Provider>
  )
}

export function useWorkflowRuns() {
  const context = useContext(WorkflowRunsContext)
  if (!context) {
    throw new Error(
      "useWorkflowRuns must be used within a <WorkflowRunsProvider />"
    )
  }
  return context
}

export function useLatestRunSteps() {
  const context = useContext(WorkflowRunsContext)
  if (!context) {
    throw new Error(
      "useLatestRunSteps must be used within a <WorkflowRunsProvider />"
    )
  }
  return {
    steps: context.steps,
    sessionId: context.sessionId,
    isLive: context.isLive,
    latestRun: context.latestRun,
    cancelingRunId: context.cancelingRunId,
    cancelRun: context.cancelRun,
    runs: context.runs,
    error: context.error,
    getRunSteps: context.getRunSteps,
    getRunSessionId: context.getRunSessionId,
    selectedRunId: context.selectedRunId,
    setSelectedRunId: context.setSelectedRunId,
    selectedRun: context.selectedRun,
    selectedRunSteps: context.selectedRunSteps,
    selectedRunSessionId: context.selectedRunSessionId,
  }
}

export function useNodeRunStatus(nodeId: string, kind?: string): NodeRunStatus {
  const store = useContext(ExecutionStoreContext)
  return useSyncExternalStore(
    store ? store.subscribe : () => () => {},
    () => (store ? store.getNodeStatus(nodeId, kind) : DEFAULT_NODE_RUN_STATUS),
    () => DEFAULT_NODE_RUN_STATUS
  )
}

export function useEdgeRunStatus(params: {
  edgeId: string
  source: string
  target: string
  handleId?: string
}): EdgeRunStatus {
  const store = useContext(ExecutionStoreContext)
  return useSyncExternalStore(
    store ? store.subscribe : () => () => {},
    () => (store ? store.getEdgeStatus(params) : DEFAULT_EDGE_RUN_STATUS),
    () => DEFAULT_EDGE_RUN_STATUS
  )
}
