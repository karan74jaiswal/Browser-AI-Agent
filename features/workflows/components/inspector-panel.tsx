"use client"

import React, { useState } from "react"
import prettyMs from "pretty-ms"
import {
  X,
  AlertCircle,
  CheckCircle2,
  Copy,
  Check,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import { NodeIcon } from "./node-icon"
import type { RunStep } from "@/features/workflows/tasks/run-workflow"
import { cn } from "@/lib/utils"

export interface InspectorPanelProps {
  step: RunStep
  onClose?: () => void
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
      {copied ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
      <span className="sr-only">Copy JSON</span>
    </Button>
  )
}

export function InspectorPanel({
  step,
  onClose,
  className,
}: InspectorPanelProps) {
  const stepDuration =
    step.duration !== undefined
      ? prettyMs(step.duration)
      : step.durationMs !== undefined
        ? prettyMs(step.durationMs)
        : null

  const formattedOutput =
    step.output !== undefined && step.output !== null
      ? typeof step.output === "object"
        ? JSON.stringify(step.output, null, 2)
        : String(step.output)
      : null

  return (
    <div
      className={cn(
        "flex w-80 min-w-64 max-w-md flex-col bg-card/40 text-xs",
        className
      )}
    >
      <div className="flex items-center justify-between border-b border-border bg-card p-2.5">
        <div className="flex min-w-0 items-center gap-2">
          <NodeIcon
            type={step.type}
            className="size-5 rounded-xs [&_svg]:size-3"
          />
          <span className="truncate font-semibold">{step.title}</span>
        </div>
        {onClose && (
          <Button
            variant="ghost"
            size="icon"
            className="size-5 text-muted-foreground hover:text-foreground"
            onClick={onClose}
          >
            <X className="size-3.5" />
            <span className="sr-only">Close step details</span>
          </Button>
        )}
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-3">
        <div className="flex items-center justify-between gap-2 border-b border-border/50 pb-2">
          <span className="text-muted-foreground">Status</span>
          <div className="flex items-center gap-1.5">
            {step.status === "running" && (
              <Badge
                variant="outline"
                className="h-4.5 gap-1 border-blue-500/30 bg-blue-500/10 px-1.5 text-[10px] text-blue-600 dark:text-blue-400"
              >
                <Spinner className="size-3 text-blue-500" />
                <span>Running</span>
              </Badge>
            )}
            {step.status === "done" && (
              <Badge
                variant="outline"
                className="h-4.5 gap-1 border-emerald-500/30 bg-emerald-500/10 px-1.5 text-[10px] text-emerald-600 dark:text-emerald-400"
              >
                <CheckCircle2 className="size-3" />
                <span>Done</span>
              </Badge>
            )}
            {step.status === "failed" && (
              <Badge
                variant="destructive"
                className="h-4.5 gap-1 px-1.5 text-[10px]"
              >
                <AlertCircle className="size-3" />
                <span>Failed</span>
              </Badge>
            )}
            {step.status === "pending" && (
              <Badge
                variant="secondary"
                className="h-4.5 px-1.5 text-[10px]"
              >
                Pending
              </Badge>
            )}
          </div>
        </div>

        {stepDuration && (
          <div className="flex items-center justify-between gap-2 border-b border-border/50 pb-2">
            <span className="text-muted-foreground">Duration</span>
            <span className="font-mono text-foreground">{stepDuration}</span>
          </div>
        )}

        {step.error && (
          <div className="flex flex-col gap-1.5 rounded-md border border-destructive/30 bg-destructive/10 p-2.5 text-destructive">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold">
              <AlertCircle className="size-3.5" />
              <span>Error</span>
            </div>
            <pre className="overflow-x-auto font-mono text-[11px] leading-relaxed whitespace-pre-wrap">
              {step.error}
            </pre>
          </div>
        )}

        {formattedOutput !== null ? (
          <div className="flex min-h-0 flex-1 flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-muted-foreground">Output</span>
              <CopyButton text={formattedOutput} />
            </div>
            <pre className="min-h-0 flex-1 overflow-auto rounded-md border border-border bg-muted/40 p-2.5 font-mono text-[11px] leading-relaxed text-foreground">
              {formattedOutput}
            </pre>
          </div>
        ) : !step.error ? (
          <div className="flex flex-col items-center justify-center py-6 text-center text-muted-foreground">
            {step.status === "pending" && (
              <p className="italic">This step has not run yet.</p>
            )}
            {step.status === "running" && (
              <div className="flex items-center gap-2 italic">
                <Spinner className="size-3.5 text-blue-500" />
                <span>Step is currently executing...</span>
              </div>
            )}
            {step.status === "done" && (
              <p className="italic">No output produced by this step.</p>
            )}
          </div>
        ) : null}
      </div>
    </div>
  )
}
