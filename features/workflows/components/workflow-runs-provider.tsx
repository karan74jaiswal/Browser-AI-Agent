"use client"

import React, { createContext, useContext, useMemo, useState } from "react"
import { useRealtimeRunsWithTag } from "@trigger.dev/react-hooks"
import type {
  runWorkflowTask,
  RunStep,
} from "@/features/workflows/tasks/run-workflow"

export type { RunStep }

export type WorkflowRun = ReturnType<
  typeof useRealtimeRunsWithTag<typeof runWorkflowTask>
>["runs"][number]

export function getRunSteps(
  run: WorkflowRun | { output?: unknown; metadata?: unknown } | undefined | null
): RunStep[] | undefined {
  if (!run) return undefined

  // Prefer final output steps
  const output = run.output as
    | { steps?: RunStep[] }
    | RunStep[]
    | undefined

  if (output) {
    if (Array.isArray(output)) {
      return output
    }
    if (Array.isArray(output.steps)) {
      return output.steps
    }
  }

  // Fall back to live / persisted metadata steps
  const metadata = run.metadata as { steps?: RunStep[] } | undefined
  if (metadata && Array.isArray(metadata.steps)) {
    return metadata.steps
  }

  return undefined
}

export interface WorkflowRunsContextValue {
  runs: WorkflowRun[]
  latestRun: WorkflowRun | undefined
  steps: RunStep[] | undefined
  isLive: boolean
  error: Error | undefined
  stop: () => void
  getRunSteps: (
    run: WorkflowRun | { output?: unknown; metadata?: unknown } | undefined | null
  ) => RunStep[] | undefined
  selectedRunId: string | null
  setSelectedRunId: (id: string | null) => void
  selectedRun: WorkflowRun | undefined
  selectedRunSteps: RunStep[] | undefined
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

  const sortedRuns = useMemo(() => {
    if (!runs || runs.length === 0) return []
    return [...runs].sort((a, b) => {
      const aTime = new Date(a.createdAt).getTime()
      const bTime = new Date(b.createdAt).getTime()
      return bTime - aTime
    })
  }, [runs])

  const latestRun = useMemo(() => {
    return sortedRuns[0]
  }, [sortedRuns])

  const isLive = useMemo(() => {
    return isRunLive(latestRun?.status)
  }, [latestRun])

  const steps = useMemo(() => {
    return getRunSteps(latestRun)
  }, [latestRun])

  const selectedRun = useMemo(() => {
    if (!selectedRunId) return latestRun
    return sortedRuns.find((run) => run.id === selectedRunId) ?? latestRun
  }, [selectedRunId, sortedRuns, latestRun])

  const selectedRunSteps = useMemo(() => {
    return getRunSteps(selectedRun)
  }, [selectedRun])

  const value = useMemo<WorkflowRunsContextValue>(
    () => ({
      runs: sortedRuns,
      latestRun,
      steps,
      isLive,
      error,
      stop,
      getRunSteps,
      selectedRunId,
      setSelectedRunId,
      selectedRun,
      selectedRunSteps,
    }),
    [
      sortedRuns,
      latestRun,
      steps,
      isLive,
      error,
      stop,
      selectedRunId,
      selectedRun,
      selectedRunSteps,
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
    isLive: context.isLive,
    latestRun: context.latestRun,
    runs: context.runs,
    error: context.error,
    getRunSteps: context.getRunSteps,
    selectedRunId: context.selectedRunId,
    setSelectedRunId: context.setSelectedRunId,
    selectedRun: context.selectedRun,
    selectedRunSteps: context.selectedRunSteps,
  }
}
