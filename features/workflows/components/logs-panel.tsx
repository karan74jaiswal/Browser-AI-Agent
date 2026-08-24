"use client"

import React from "react"
import prettyMs from "pretty-ms"
import { CheckCircle2, XCircle, Clock } from "lucide-react"
import { Spinner } from "@/components/ui/spinner"
import { Badge } from "@/components/ui/badge"
import { useNodes } from "@xyflow/react"
import { NodeIcon } from "./node-icon"
import {
  isRunLive,
  useWorkflowRuns,
  type WorkflowRun,
} from "./workflow-runs-provider"
import {
  nodeRegistry,
  type StepNodeType,
} from "@/features/workflows/nodes/node-registry"
import type { RunStep } from "@/features/workflows/tasks/run-workflow"
import { cn } from "@/lib/utils"

export interface LogsPanelProps {
  selectedStepId?: string | null
  onStepClick?: (step: RunStep, run: WorkflowRun) => void
  className?: string
}

function getRunStatusBadge(status?: string) {
  const upper = status?.toUpperCase()
  switch (upper) {
    case "COMPLETED":
      return (
        <Badge
          variant="outline"
          className="h-4.5 gap-1 border-emerald-500/30 bg-emerald-500/10 px-1.5 text-[10px] text-emerald-600 dark:text-emerald-400"
        >
          <CheckCircle2 className="size-3" />
          <span>Completed</span>
        </Badge>
      )
    case "EXECUTING":
    case "RUNNING":
      return (
        <Badge
          variant="outline"
          className="h-4.5 gap-1 border-blue-500/30 bg-blue-500/10 px-1.5 text-[10px] text-blue-600 dark:text-blue-400"
        >
          <Spinner className="size-3 text-blue-500" />
          <span>Running</span>
        </Badge>
      )
    case "FAILED":
    case "CRASHED":
      return (
        <Badge variant="destructive" className="h-4.5 gap-1 px-1.5 text-[10px]">
          <XCircle className="size-3" />
          <span>Failed</span>
        </Badge>
      )
    case "QUEUED":
    case "DEQUEUED":
    case "WAITING_FOR_DEPLOY":
      return (
        <Badge variant="secondary" className="h-4.5 gap-1 px-1.5 text-[10px]">
          <Clock className="size-3" />
          <span>{upper === "DEQUEUED" ? "Starting" : "Queued"}</span>
        </Badge>
      )
    case "REATTEMPTING":
    case "WAITING_TO_RESUME":
    case "FROZEN":
    case "PAUSED":
      return (
        <Badge variant="secondary" className="h-4.5 gap-1 px-1.5 text-[10px]">
          <Clock className="size-3" />
          <span>Waiting</span>
        </Badge>
      )
    default:
      return status ? (
        <Badge variant="outline" className="h-4.5 px-1.5 text-[10px]">
          {status}
        </Badge>
      ) : null
  }
}

export function LogsPanel({
  selectedStepId,
  onStepClick,
  className,
}: LogsPanelProps) {
  const { runs, getRunSteps } = useWorkflowRuns()
  const nodes = useNodes<StepNodeType>()

  if (!runs || runs.length === 0) {
    return (
      <div
        className={cn(
          "flex h-full min-h-32 flex-col items-center justify-center gap-1.5 p-4 text-center text-muted-foreground",
          className
        )}
      >
        <p className="text-xs font-medium">No workflow runs yet</p>
        <p className="text-[11px] text-muted-foreground/80">
          Click &quot;Run&quot; in the toolbar to execute this workflow.
        </p>
      </div>
    )
  }

  return (
    <div className={cn("flex flex-col gap-4 font-sans", className)}>
      {runs.map((run, index) => {
        const recordedSteps = getRunSteps(run) ?? []
        const isRunActive = isRunLive(run.status)
        const steps: RunStep[] =
          recordedSteps.length > 0
            ? recordedSteps
            : isRunActive
              ? nodes.map((node): RunStep => {
                  const def = nodeRegistry[node.data.type]
                  return {
                    id: node.id,
                    nodeId: node.id,
                    type: node.data.type,
                    title: node.data.title || def?.label || "Node",
                    kind: def?.kind || "action",
                    status: "pending" as const,
                  }
                })
              : []

        const formattedTime = new Date(run.createdAt).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
        const runDuration =
          run.durationMs !== undefined && run.durationMs > 0
            ? prettyMs(run.durationMs)
            : null

        return (
          <div key={run.id} className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2 border-b border-border/50 pb-1.5 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-foreground">
                  Run #{runs.length - index}
                </span>
                <span className="font-mono text-[11px] text-muted-foreground">
                  {formattedTime}
                </span>
                {getRunStatusBadge(run.status)}
              </div>
              {runDuration && (
                <span className="font-mono text-[11px] text-muted-foreground">
                  {runDuration}
                </span>
              )}
            </div>

            {steps.length === 0 ? (
              <div className="px-2 py-1 text-xs italic text-muted-foreground">
                No steps recorded.
              </div>
            ) : (
              <div className="flex flex-col gap-1 border-l border-border/50 pl-2">
                {steps.map((step) => {
                  const stepKey = `${run.id}-${step.id}`
                  const isSelected =
                    selectedStepId === stepKey || selectedStepId === step.id
                  const isRunActive = isRunLive(run.status)
                  const isFailed = step.status === "failed"
                  const isRunning =
                    isRunActive &&
                    (step.status === "running" ||
                      (step.kind === "trigger" &&
                        step.status !== "done" &&
                        !isFailed))
                  const isPending = step.status === "pending" && !isRunning
                  const stepDuration =
                    step.duration !== undefined
                      ? prettyMs(step.duration)
                      : step.durationMs !== undefined
                        ? prettyMs(step.durationMs)
                        : null

                  return (
                    <button
                      key={stepKey}
                      type="button"
                      onClick={() => onStepClick?.(step, run)}
                      className={cn(
                        "group flex w-full cursor-pointer items-center justify-between gap-3 rounded-md border px-2.5 py-1.5 text-left text-xs transition-colors",
                        isSelected
                          ? "border-border bg-accent text-accent-foreground shadow-xs ring-1 ring-ring/40"
                          : isFailed
                            ? "border-destructive/30 bg-destructive/5 text-destructive hover:bg-destructive/10"
                            : isRunning
                              ? "border-blue-500/30 bg-blue-500/5 text-foreground hover:bg-blue-500/10"
                              : isPending
                                ? "border-transparent text-muted-foreground opacity-50 hover:bg-muted/30 hover:opacity-80"
                                : "border-transparent text-foreground hover:bg-muted/50"
                      )}
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        <NodeIcon
                          type={step.type}
                          running={isRunning}
                          className="size-5 rounded-xs [&_svg]:size-3"
                        />
                        <span
                          className={cn(
                            "truncate font-medium",
                            isFailed && "font-semibold text-destructive",
                            isPending && "font-normal"
                          )}
                        >
                          {step.title}
                        </span>
                      </div>

                      <div className="flex shrink-0 items-center gap-2 font-mono text-[11px]">
                        {isRunning && (
                          <span className="font-sans text-blue-600 dark:text-blue-400">
                            Running...
                          </span>
                        )}
                        {stepDuration && (
                          <span
                            className={cn(
                              "text-muted-foreground",
                              isFailed && "text-destructive/80",
                              isSelected && "text-accent-foreground"
                            )}
                          >
                            {stepDuration}
                          </span>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
