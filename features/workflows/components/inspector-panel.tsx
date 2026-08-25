"use client"

import React, { useState } from "react"
import {
  XCircle,
  CheckCircle2,
  Clock,
  Copy,
  Check,
  Ban,
  Film,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import { NodeIcon } from "./node-icon"
import { SessionReplay } from "./session-replay"
import type { WorkflowRun } from "./workflow-runs-provider"
import type { RunStep } from "@/features/workflows/tasks/run-workflow"
import { cn } from "@/lib/utils"

export type InspectorSelection =
  | { type: "step"; step: RunStep; run?: WorkflowRun }
  | { type: "replay"; run: WorkflowRun; sessionId?: string }

export interface InspectorPanelProps {
  selection?: InspectorSelection | null
  step?: RunStep
  className?: string
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Ignore clipboard write failures
    }
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="size-6 text-muted-foreground hover:text-foreground"
      onClick={handleCopy}
      title="Copy to clipboard"
    >
      {copied ? (
        <Check className="size-3 text-emerald-500" />
      ) : (
        <Copy className="size-3" />
      )}
      <span className="sr-only">Copy JSON</span>
    </Button>
  )
}

function getStepStatusBadge(status?: RunStep["status"]) {
  switch (status) {
    case "running":
      return (
        <Badge
          variant="outline"
          className="h-4.5 gap-1 border-blue-500/30 bg-blue-500/10 px-1.5 text-[10px] text-blue-600 dark:text-blue-400"
        >
          <Spinner className="size-3 text-blue-500" />
          <span>Running</span>
        </Badge>
      )
    case "done":
      return (
        <Badge
          variant="outline"
          className="h-4.5 gap-1 border-emerald-500/30 bg-emerald-500/10 px-1.5 text-[10px] text-emerald-600 dark:text-emerald-400"
        >
          <CheckCircle2 className="size-3" />
          <span>Done</span>
        </Badge>
      )
    case "failed":
      return (
        <Badge variant="destructive" className="h-4.5 gap-1 px-1.5 text-[10px]">
          <XCircle className="size-3" />
          <span>Failed</span>
        </Badge>
      )
    case "canceled":
      return (
        <Badge
          variant="outline"
          className="h-4.5 gap-1 border-muted-foreground/30 bg-muted/40 px-1.5 text-[10px] text-muted-foreground"
        >
          <Ban className="size-3" />
          <span>Canceled</span>
        </Badge>
      )
    case "skipped":
      return (
        <Badge
          variant="outline"
          className="h-4.5 gap-1 border-muted-foreground/30 bg-muted/40 px-1.5 text-[10px] text-muted-foreground"
        >
          <span>Skipped</span>
        </Badge>
      )
    case "pending":
    default:
      return (
        <Badge variant="secondary" className="h-4.5 gap-1 px-1.5 text-[10px]">
          <Clock className="size-3" />
          <span>Pending</span>
        </Badge>
      )
  }
}

export function InspectorPanel({
  selection,
  step,
  className,
}: InspectorPanelProps) {
  const activeSelection =
    selection ?? (step ? ({ type: "step", step } as const) : null)

  if (!activeSelection) {
    return null
  }

  if (activeSelection.type === "replay") {
    const run = activeSelection.run
    const sessionId = activeSelection.sessionId || run.sessionId

    return (
      <div
        className={cn(
          "flex h-full w-full flex-col bg-background text-xs text-foreground",
          className
        )}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-border px-3 py-2.5">
          <div className="flex min-w-0 items-center gap-2">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-rose-500 text-white">
              <Film className="size-3.5" />
            </span>
            <span className="truncate font-semibold text-foreground">
              Session Replay
            </span>
          </div>
        </div>

        {/* Body */}
        <div className="flex min-h-0 w-full flex-1 flex-col overflow-hidden bg-black">
          {sessionId ? (
            <SessionReplay
              sessionId={sessionId}
              className="aspect-auto size-full flex-1 rounded-none border-0"
            />
          ) : (
            <div className="flex size-full flex-1 flex-col items-center justify-center gap-2 bg-background p-8 text-center text-muted-foreground">
              <Film className="size-8 stroke-[1.5] text-muted-foreground/60" />
              <p className="text-xs font-medium text-foreground">
                No Recording Available
              </p>
            </div>
          )}
        </div>
      </div>
    )
  }

  const currentStep = activeSelection.step
  const formattedOutput =
    currentStep.output !== undefined && currentStep.output !== null
      ? typeof currentStep.output === "object"
        ? JSON.stringify(currentStep.output, null, 2)
        : String(currentStep.output)
      : null

  return (
    <div
      className={cn(
        "flex h-full w-full flex-col bg-background text-xs text-foreground",
        className
      )}
    >
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-border px-3 py-2.5">
        <div className="flex min-w-0 items-center gap-2">
          <NodeIcon type={currentStep.type} />
          <span className="truncate font-semibold text-foreground">
            {currentStep.title}
          </span>
        </div>
        <div className="flex shrink-0 items-center">
          {getStepStatusBadge(currentStep.status)}
        </div>
      </div>

      {/* Body */}
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-3">
        {/* Error */}
        {currentStep.error && (
          <div className="flex flex-col gap-1.5 rounded-md border border-destructive/30 bg-destructive/10 p-2.5 text-destructive">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold">
              <XCircle className="size-3.5" />
              <span>Error</span>
            </div>
            <pre className="overflow-x-auto font-mono text-[11px] leading-relaxed whitespace-pre-wrap">
              {currentStep.error}
            </pre>
          </div>
        )}

        {/* Output */}
        {formattedOutput !== null ? (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-foreground">Output</span>
              <CopyButton text={formattedOutput} />
            </div>
            <pre className="max-h-96 overflow-auto rounded-md border border-border bg-muted/30 p-2.5 font-mono text-[11px] leading-relaxed text-foreground">
              {formattedOutput}
            </pre>
          </div>
        ) : !currentStep.error ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 py-8 text-center text-muted-foreground">
            {currentStep.status === "pending" && (
              <>
                <Clock className="size-4 text-muted-foreground/60" />
                <p className="text-xs">This step has not run yet.</p>
              </>
            )}
            {currentStep.status === "canceled" && (
              <>
                <Ban className="size-4 text-muted-foreground/60" />
                <p className="text-xs">
                  This step was canceled before completion.
                </p>
              </>
            )}
            {currentStep.status === "skipped" && (
              <p className="text-xs">
                This step was skipped because the workflow was stopped or an
                earlier step failed.
              </p>
            )}
            {currentStep.status === "running" && (
              <>
                <Spinner className="size-4 text-blue-500" />
                <p className="text-xs text-blue-600 dark:text-blue-400">
                  Step is currently executing...
                </p>
              </>
            )}
            {currentStep.status === "done" && (
              <>
                <CheckCircle2 className="size-4 text-emerald-500/80" />
                <p className="text-xs">No output produced by this step.</p>
              </>
            )}
          </div>
        ) : null}
      </div>
    </div>
  )
}
