"use client"

import React, { useState } from "react"
import { XCircle, CheckCircle2, Clock, Copy, Check, Ban } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import { NodeIcon } from "./node-icon"
import type { RunStep } from "@/features/workflows/tasks/run-workflow"
import { cn } from "@/lib/utils"

export interface InspectorPanelProps {
  step: RunStep
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

export function InspectorPanel({ step, className }: InspectorPanelProps) {
  const formattedOutput =
    step.output !== undefined && step.output !== null
      ? typeof step.output === "object"
        ? JSON.stringify(step.output, null, 2)
        : String(step.output)
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
          <NodeIcon type={step.type} />
          <span className="truncate font-semibold text-foreground">
            {step.title}
          </span>
        </div>
        <div className="flex shrink-0 items-center">
          {getStepStatusBadge(step.status)}
        </div>
      </div>

      {/* Body */}
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-3">
        {/* Error */}
        {step.error && (
          <div className="flex flex-col gap-1.5 rounded-md border border-destructive/30 bg-destructive/10 p-2.5 text-destructive">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold">
              <XCircle className="size-3.5" />
              <span>Error</span>
            </div>
            <pre className="overflow-x-auto font-mono text-[11px] leading-relaxed whitespace-pre-wrap">
              {step.error}
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
        ) : !step.error ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 py-8 text-center text-muted-foreground">
            {step.status === "pending" && (
              <>
                <Clock className="size-4 text-muted-foreground/60" />
                <p className="text-xs">This step has not run yet.</p>
              </>
            )}
            {step.status === "canceled" && (
              <>
                <Ban className="size-4 text-muted-foreground/60" />
                <p className="text-xs">
                  This step was canceled before completion.
                </p>
              </>
            )}
            {step.status === "skipped" && (
              <p className="text-xs">
                This step was skipped because the workflow was stopped or an
                earlier step failed.
              </p>
            )}
            {step.status === "running" && (
              <>
                <Spinner className="size-4 text-blue-500" />
                <p className="text-xs text-blue-600 dark:text-blue-400">
                  Step is currently executing...
                </p>
              </>
            )}
            {step.status === "done" && (
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
