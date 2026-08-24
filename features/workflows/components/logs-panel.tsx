"use client"

import React from "react"
import prettyMs from "pretty-ms"
import { CheckCircle2, XCircle, Clock } from "lucide-react"
import { Spinner } from "@/components/ui/spinner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
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
    <Accordion
      type="multiple"
      defaultValue={runs.map((r) => r.id)}
      className={cn("px-3 py-2", className)}
    >
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
          <AccordionItem
            key={run.id}
            value={run.id}
            className="not-last:border-b-0"
          >
            <AccordionTrigger className="py-2 text-xs font-medium text-muted-foreground hover:no-underline">
              <div className="flex w-full min-w-0 items-center justify-between gap-2 pr-2">
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
            </AccordionTrigger>

            <AccordionContent className="flex flex-col gap-0.5 pt-1">
              {steps.length === 0 ? (
                <p className="px-1.5 py-1 text-xs text-muted-foreground italic">
                  No steps recorded.
                </p>
              ) : (
                steps.map((step) => {
                  const stepKey = `${run.id}-${step.id}`
                  const isSelected =
                    selectedStepId === stepKey || selectedStepId === step.id
                  const isFailed = step.status === "failed"
                  const isSkipped = step.status === "skipped"
                  const isRunning =
                    isRunActive &&
                    (step.status === "running" ||
                      (step.kind === "trigger" &&
                        step.status !== "done" &&
                        !isFailed &&
                        !isSkipped))
                  const isPending = step.status === "pending" && !isRunning
                  const stepDuration =
                    step.duration !== undefined
                      ? prettyMs(step.duration)
                      : step.durationMs !== undefined
                        ? prettyMs(step.durationMs)
                        : null

                  return (
                    <Button
                      key={stepKey}
                      variant="ghost"
                      onClick={() => onStepClick?.(step, run)}
                      className={cn(
                        "w-full justify-between gap-2.5 px-1.5 h-8 text-xs font-normal",
                        isSelected && "bg-accent text-accent-foreground font-medium",
                        isFailed && "text-destructive hover:text-destructive hover:bg-destructive/10",
                        isRunning && "text-foreground font-medium",
                        isPending && "text-muted-foreground opacity-60",
                        isSkipped && "text-muted-foreground/60"
                      )}
                    >
                      <div className="flex min-w-0 items-center gap-2.5">
                        <NodeIcon
                          type={step.type}
                          running={isRunning}
                        />
                        <span
                          className={cn(
                            "truncate",
                            isFailed && "font-medium text-destructive",
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
                              isSelected && "text-accent-foreground"
                            )}
                          >
                            {stepDuration}
                          </span>
                        )}
                      </div>
                    </Button>
                  )
                })
              )}
            </AccordionContent>
          </AccordionItem>
        )
      })}
    </Accordion>
  )
}
