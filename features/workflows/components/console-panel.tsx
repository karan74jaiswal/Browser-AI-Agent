"use client"

import React, { useState } from "react"

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
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

  let liveSelectedStep: RunStep | null = null
  if (selectedStepKey) {
    for (const run of runs) {
      const steps = getRunSteps(run) ?? []
      for (const s of steps) {
        if (
          `${run.id}-${s.id}` === selectedStepKey ||
          s.id === selectedStepKey
        ) {
          liveSelectedStep = s
          break
        }
      }
      if (liveSelectedStep) break
    }
    if (!liveSelectedStep) {
      liveSelectedStep = selectedStep
    }
  }

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
      <ResizablePanelGroup orientation="horizontal" className="min-h-0 flex-1">
        <ResizablePanel minSize="12rem">
          <div className="size-full overflow-y-auto">
            <LogsPanel
              selectedStepId={selectedStepKey}
              onStepClick={handleStepClick}
            />
          </div>
        </ResizablePanel>

        {liveSelectedStep && (
          <>
            <ResizableHandle />
            <ResizablePanel defaultSize="20rem" minSize="14rem" maxSize="36rem">
              <InspectorPanel
                step={liveSelectedStep}
                className="size-full w-full max-w-none min-w-0"
              />
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>
    </div>
  )
}
