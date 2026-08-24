"use client"

import React, { useState } from "react"
import { Terminal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LogsPanel } from "./logs-panel"
import { InspectorPanel } from "./inspector-panel"
import { useWorkflowRuns, type WorkflowRun } from "./workflow-runs-provider"
import type { RunStep } from "@/features/workflows/tasks/run-workflow"
import { cn } from "@/lib/utils"

export interface ConsolePanelProps {
  className?: string
}

export function ConsolePanel({ className }: ConsolePanelProps) {
  const { runs, getRunSteps } = useWorkflowRuns()
  const [selectedStepKey, setSelectedStepKey] = useState<string | null>(null)
  const [selectedStep, setSelectedStep] = useState<RunStep | null>(null)

  const liveSelectedStep = React.useMemo(() => {
    if (!selectedStepKey) return null
    for (const run of runs) {
      const steps = getRunSteps(run) ?? []
      for (const s of steps) {
        if (`${run.id}-${s.id}` === selectedStepKey || s.id === selectedStepKey) {
          return s
        }
      }
    }
    return selectedStep
  }, [selectedStepKey, runs, getRunSteps, selectedStep])

  const handleStepClick = (step: RunStep, run: WorkflowRun) => {
    const key = `${run.id}-${step.id}`
    if (selectedStepKey === key) {
      setSelectedStepKey(null)
      setSelectedStep(null)
    } else {
      setSelectedStepKey(key)
      setSelectedStep(step)
    }
  }

  return (
    <div
      className={cn(
        "flex h-full flex-col bg-background text-foreground",
        className
      )}
    >
      <div className="flex h-9 shrink-0 items-center justify-between border-b border-border bg-card px-3 py-1.5 text-xs font-semibold">
        <div className="flex items-center gap-2">
          <Terminal className="size-3.5 text-muted-foreground" />
          <span>Console</span>
          {runs.length > 0 && (
            <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">
              {runs.length} {runs.length === 1 ? "run" : "runs"}
            </Badge>
          )}
        </div>
        {liveSelectedStep && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
            onClick={() => {
              setSelectedStepKey(null)
              setSelectedStep(null)
            }}
          >
            Clear selection
          </Button>
        )}
      </div>

      <div className="flex min-h-0 flex-1 divide-x divide-border">
        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          <LogsPanel
            selectedStepId={selectedStepKey}
            onStepClick={handleStepClick}
          />
        </div>

        {liveSelectedStep && (
          <InspectorPanel
            step={liveSelectedStep}
            onClose={() => {
              setSelectedStepKey(null)
              setSelectedStep(null)
            }}
          />
        )}
      </div>
    </div>
  )
}
