"use client"

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react"
import { useRealtimeRunsWithTag } from "@trigger.dev/react-hooks"
import { cancelWorkflowAction } from "@/features/workflows/actions"
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

const WorkflowRunsContext = createContext<WorkflowRunsContextValue | null>(null)

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
    if (!isRunLive(latestRun?.status)) return false
    if (steps && steps.length > 0 && steps.every((s) => s.status === "done")) {
      return false
    }
    return true
  }, [latestRun, steps])

  // Canceling is active strictly while the run is live
  const cancelingRunId = isLive ? rawCancelingRunId : null

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
    <WorkflowRunsContext.Provider value={value}>
      {children}
    </WorkflowRunsContext.Provider>
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
