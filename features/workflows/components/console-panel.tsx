"use client"

import React, { useState } from "react"

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import { LogsPanel } from "./logs-panel"
import { InspectorPanel, type InspectorSelection } from "./inspector-panel"
import {
  useWorkflowRuns,
  getRunSessionId,
  type WorkflowRun,
} from "./workflow-runs-provider"
import type { RunStep } from "@/features/workflows/tasks/run-workflow"
import { cn } from "@/lib/utils"

export interface ConsolePanelProps {
  className?: string
}

export function ConsolePanel({ className }: ConsolePanelProps) {
  const { runs, getRunSteps } = useWorkflowRuns()
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const [selection, setSelection] = useState<InspectorSelection | null>(null)

  let liveSelection: InspectorSelection | null = null

  if (selectedKey && selection) {
    if (selection.type === "step") {
      let liveStep: RunStep | null = null
      let targetRun: WorkflowRun | null = null

      for (const run of runs) {
        const steps = getRunSteps(run) ?? []
        for (const s of steps) {
          if (`${run.id}-${s.id}` === selectedKey || s.id === selectedKey) {
            liveStep = s
            targetRun = run
            break
          }
        }
        if (liveStep) break
      }

      liveSelection = liveStep
        ? { type: "step", step: liveStep, run: targetRun ?? selection.run }
        : selection
    } else if (selection.type === "replay") {
      const currentRun =
        runs.find(
          (r) => `${r.id}-replay` === selectedKey || r.id === selection.run.id
        ) ?? selection.run

      liveSelection = {
        type: "replay",
        run: currentRun,
        sessionId: getRunSessionId(currentRun) || currentRun.sessionId,
      }
    }
  }

  const handleStepClick = (step: RunStep, run: WorkflowRun) => {
    const key = `${run.id}-${step.id}`
    if (selectedKey === key) {
      setSelectedKey(null)
      setSelection(null)
    } else {
      setSelectedKey(key)
      setSelection({ type: "step", step, run })
    }
  }

  const handleReplayClick = (run: WorkflowRun) => {
    const key = `${run.id}-replay`
    if (selectedKey === key) {
      setSelectedKey(null)
      setSelection(null)
    } else {
      setSelectedKey(key)
      setSelection({
        type: "replay",
        run,
        sessionId: getRunSessionId(run) || run.sessionId,
      })
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
              selectedId={selectedKey}
              onStepClick={handleStepClick}
              onReplayClick={handleReplayClick}
            />
          </div>
        </ResizablePanel>

        {liveSelection && (
          <>
            <ResizableHandle />
            <ResizablePanel defaultSize="20rem" minSize="14rem" maxSize="36rem">
              <InspectorPanel
                selection={liveSelection}
                className="size-full w-full max-w-none min-w-0"
              />
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>
    </div>
  )
}
