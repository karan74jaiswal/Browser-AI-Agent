"use client"

import React, { createContext, useContext, useMemo } from "react"
import { useRealtimeRunsWithTag } from "@trigger.dev/react-hooks"
import type { runWorkflowTask, RunStep } from "@/features/workflows/tasks/run-workflow"

type WorkflowRun = ReturnType<
  typeof useRealtimeRunsWithTag<typeof runWorkflowTask>
>["runs"][number]

export interface WorkflowRunsContextValue {
  runs: WorkflowRun[]
  latestRun: WorkflowRun | undefined
  steps: RunStep[] | undefined
  isLive: boolean
  error: Error | undefined
  stop: () => void
}

const WorkflowRunsContext = createContext<WorkflowRunsContextValue | null>(null)

export interface WorkflowRunsProviderProps {
  workflowId: string
  publicAccessToken?: string
  accessToken?: string
  children: React.ReactNode
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

  const latestRun = useMemo(() => {
    if (!runs || runs.length === 0) return undefined
    return [...runs].sort((a, b) => {
      const aTime = new Date(a.createdAt).getTime()
      const bTime = new Date(b.createdAt).getTime()
      return bTime - aTime
    })[0]
  }, [runs])

  const isLive = useMemo(() => {
    if (!latestRun?.status) return false
    const status = latestRun.status.toUpperCase()
    return status === "QUEUED" || status === "EXECUTING"
  }, [latestRun])

  const steps = useMemo(() => {
    if (!latestRun) return undefined

    // Prefer final output steps
    const output = latestRun.output as
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

    // Fall back to live metadata steps
    const metadata = latestRun.metadata as { steps?: RunStep[] } | undefined
    if (metadata && Array.isArray(metadata.steps)) {
      return metadata.steps
    }

    return undefined
  }, [latestRun])

  const value = useMemo<WorkflowRunsContextValue>(
    () => ({
      runs,
      latestRun,
      steps,
      isLive,
      error,
      stop,
    }),
    [runs, latestRun, steps, isLive, error, stop]
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
  }
}
