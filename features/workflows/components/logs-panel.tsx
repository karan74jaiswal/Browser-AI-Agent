"use client"

import React from "react"
import prettyMs from "pretty-ms"
import { CheckCircle2, XCircle, Clock, Ban, Film, Lock } from "lucide-react"
import { Spinner } from "@/components/ui/spinner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useProPlan } from "@/features/workflows/hooks"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { NodeIcon } from "./node-icon"
import {
  isRunLive,
  getRunSessionId,
  useWorkflowRuns,
  type WorkflowRun,
} from "./workflow-runs-provider"
import type { RunStep } from "@/features/workflows/tasks/run-workflow"
import { cn } from "@/lib/utils"

export interface LogsPanelProps {
  selectedId?: string | null
  selectedStepId?: string | null
  onStepClick?: (step: RunStep, run: WorkflowRun) => void
  onReplayClick?: (run: WorkflowRun) => void
  className?: string
}

function getRunStatusBadge(
  status?: string,
  isCanceling?: boolean
) {
  if (isCanceling) {
    return (
      <Badge
        variant="outline"
        className="h-4.5 gap-1 border-amber-500/30 bg-amber-500/10 px-1.5 text-[10px] text-amber-600 dark:text-amber-400"
      >
        <Spinner className="size-3 text-amber-500" />
        <span>Canceling</span>
      </Badge>
    )
  }

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
    case "CANCELED":
    case "CANCELLED":
      return (
        <Badge
          variant="outline"
          className="h-4.5 gap-1 border-muted-foreground/30 bg-muted/40 px-1.5 text-[10px] text-muted-foreground"
        >
          <Ban className="size-3" />
          <span>Canceled</span>
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
  selectedId,
  selectedStepId,
  onStepClick,
  onReplayClick,
  className,
}: LogsPanelProps) {
  const activeSelectedId = selectedId ?? selectedStepId
  const { runs, getRunSteps, cancelingRunId } = useWorkflowRuns()
  const { isPro, redirectToPricing } = useProPlan()
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
    <Accordion
      type="multiple"
      defaultValue={runs.map((r) => r.id)}
      className={cn("px-3 py-2", className)}
    >
      {runs.map((run) => {
        const recordedSteps = getRunSteps(run) ?? []
        const isRunActive = isRunLive(run.status)
        const isRunCanceling = cancelingRunId === run.id && isRunActive
        const isRunCanceled =
          run.status?.toUpperCase() === "CANCELED" ||
          run.status?.toUpperCase() === "CANCELLED"
        const sessionId = getRunSessionId(run)
        const isFinished = !isRunActive
        const hasRecording = Boolean(sessionId && isFinished)

        const steps: RunStep[] = recordedSteps

        const formattedTime = new Date(run.createdAt).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
        const runDuration =
          run.durationMs !== undefined && run.durationMs > 0
            ? prettyMs(run.durationMs)
            : null

        const visibleSteps = steps
          .filter((step) => step.status !== "pending")
          .sort((a, b) => (a.startedAt ?? 0) - (b.startedAt ?? 0))

        return (
          <AccordionItem
            key={run.id}
            value={run.id}
            className="not-last:border-b-0"
          >
            <AccordionTrigger className="py-2 text-xs font-medium text-muted-foreground hover:no-underline">
              <div className="flex w-full min-w-0 items-center justify-between gap-2 pr-2">
                <div className="flex items-center gap-2">
                  <div className="size-2 rounded-full bg-blue-500" />
                  <span className="font-semibold text-foreground">
                    {run.tags?.find((t) => t.startsWith("trigger:"))?.replace("trigger:", "") || "Workflow Run"}
                  </span>
                  {getRunStatusBadge(run.status, isRunCanceling)}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-muted-foreground">
                    {formattedTime}
                  </span>
                  {runDuration && (
                    <span className="font-mono text-[11px] text-muted-foreground">
                      {runDuration}
                    </span>
                  )}
                </div>
              </div>
            </AccordionTrigger>

            <AccordionContent className="flex h-auto! flex-col gap-0.5 pt-1">
              {visibleSteps.length === 0 && !hasRecording ? (
                isRunActive ? (
                  <div className="flex items-center gap-2 px-2 py-1.5 text-xs text-muted-foreground">
                    <Spinner className="size-3 text-primary" />
                    <span>Starting workflow...</span>
                  </div>
                ) : (
                  <p className="px-1.5 py-1 text-xs text-muted-foreground italic">
                    No steps recorded.
                  </p>
                )
              ) : (
                <>
                  {visibleSteps.map((step) => {
                    const stepKey = `${run.id}-${step.id}`
                    const isSelected =
                      activeSelectedId === stepKey ||
                      activeSelectedId === step.id
                    const isFailed = step.status === "failed"
                    const isCanceled =
                      step.status === "canceled" ||
                      (isRunCanceled && step.status === "running")
                    const isStepCanceling =
                      isRunCanceling &&
                      (step.status === "running" ||
                        (step.kind === "trigger" && step.status !== "done"))
                    const isSkipped =
                      step.status === "skipped" ||
                      (isRunCanceled && step.status === "pending") ||
                      (isRunCanceling &&
                        step.status === "pending" &&
                        !isStepCanceling)
                    const isRunning =
                      isRunActive &&
                      !isRunCanceling &&
                      (step.status === "running" ||
                        (step.kind === "trigger" &&
                          step.status !== "done" &&
                          !isFailed &&
                          !isSkipped &&
                          !isCanceled))
                    const isPending =
                      step.status === "pending" && !isRunning && !isSkipped
                    const stepDuration =
                      step.duration !== undefined
                        ? prettyMs(step.duration)
                        : step.durationMs !== undefined
                          ? prettyMs(step.durationMs)
                          : null
                    const effectiveStep: RunStep = {
                      ...step,
                      status: isFailed
                        ? "failed"
                        : isCanceled || isStepCanceling
                          ? "canceled"
                          : isSkipped
                            ? "skipped"
                            : step.status,
                    }

                    return (
                      <Button
                        key={stepKey}
                        variant="ghost"
                        onClick={() => onStepClick?.(effectiveStep, run)}
                        className={cn(
                          "h-8 w-full justify-between gap-2.5 px-1.5 text-xs font-normal",
                          isSelected &&
                            "bg-accent font-medium text-accent-foreground",
                          isFailed &&
                            "text-destructive hover:bg-destructive/10 hover:text-destructive",
                          (isCanceled || isStepCanceling) &&
                            "text-amber-600 hover:bg-amber-500/10 dark:text-amber-400",
                          isRunning && "font-medium text-foreground",
                          isPending && "text-muted-foreground opacity-60",
                          isSkipped && "text-muted-foreground/60"
                        )}
                      >
                        <div className="flex min-w-0 items-center gap-2.5">
                          <NodeIcon
                            type={step.type}
                            running={isRunning || isStepCanceling}
                          />
                          <span
                            className={cn(
                              "truncate",
                              isFailed && "font-medium text-destructive",
                              (isCanceled || isStepCanceling) &&
                                "font-medium text-amber-600 dark:text-amber-400",
                              isRunning && "font-medium",
                              isSkipped && "text-muted-foreground/80"
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
                          {isStepCanceling && (
                            <span className="font-sans text-[10px] text-amber-600 dark:text-amber-400">
                              Canceling...
                            </span>
                          )}
                          {isCanceled && !isStepCanceling && (
                            <span className="font-sans text-[10px] text-amber-600 dark:text-amber-400">
                              Canceled
                            </span>
                          )}
                          {isSkipped && (
                            <span className="font-sans text-[10px] text-muted-foreground/70">
                              Skipped
                            </span>
                          )}
                          {stepDuration && (
                            <span
                              className={cn(
                                "text-muted-foreground",
                                isFailed && "text-destructive",
                                (isCanceled || isStepCanceling) &&
                                  "text-amber-600 dark:text-amber-400",
                                isSelected && "text-accent-foreground"
                              )}
                            >
                              {stepDuration}
                            </span>
                          )}
                        </div>
                      </Button>
                    )
                  })}

                  {hasRecording && (
                    <Button
                      key={`${run.id}-replay`}
                      variant="ghost"
                      onClick={() => {
                        if (!isPro) {
                          redirectToPricing()
                          return
                        }
                        onReplayClick?.(run)
                      }}
                      className={cn(
                        "h-8 w-full justify-between gap-2.5 px-1.5 text-xs font-normal",
                        activeSelectedId === `${run.id}-replay` &&
                          "bg-accent font-medium text-accent-foreground",
                        "text-foreground hover:bg-accent/50"
                      )}
                    >
                      <div className="flex min-w-0 items-center gap-2.5">
                        <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-rose-500 text-white">
                          <Film className="size-3.5" />
                        </span>
                        <span className="truncate font-medium text-foreground">
                          Session Replay
                        </span>
                      </div>

                      {!isPro && (
                        <div className="flex items-center gap-1 font-sans text-[11px] text-muted-foreground">
                          <span className="rounded bg-accent px-1 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                            Pro
                          </span>
                          <Lock className="size-3 text-muted-foreground" />
                        </div>
                      )}
                    </Button>
                  )}
                </>
              )}
            </AccordionContent>
          </AccordionItem>
        )
      })}
    </Accordion>
  )
}
