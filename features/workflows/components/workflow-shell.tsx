"use client"

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import { ClientSideSuspense } from "@liveblocks/react/suspense"
import { Spinner } from "@/components/ui/spinner"
import type { WorkflowGraph } from "@/lib/db"
import { Canvas } from "./canvas"
import { ConsolePanel } from "./console-panel"
import { RightSidebar } from "./rightSidebar/right-sidebar"

function CanvasSkeleton() {
  return (
    <div className="relative flex size-full items-center justify-center bg-background">
      <div className="pointer-events-none absolute inset-0 opacity-40 [background-image:radial-gradient(circle,currentColor_1px,transparent_1px)] [background-size:16px_16px] text-muted-foreground/30" />
      <div className="relative flex items-center gap-2.5 rounded-full border border-border/70 bg-card/90 px-4 py-2 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur-sm">
        <Spinner className="size-3.5 text-muted-foreground" />
        <span>Connecting to canvas...</span>
      </div>
    </div>
  )
}

interface WorkflowShellProps {
  workflowId: string
  workflowName?: string
  initialGraph?: WorkflowGraph | null
}

export function WorkflowShell({
  workflowId,
  workflowName,
  initialGraph,
}: WorkflowShellProps) {
  return (
    <ResizablePanelGroup orientation="horizontal" className="size-full">
      <ResizablePanel minSize="30rem">
        <ResizablePanelGroup orientation="vertical" className="size-full">
          <ResizablePanel minSize="18rem">
            <ClientSideSuspense fallback={<CanvasSkeleton />}>
              <Canvas workflowId={workflowId} initialGraph={initialGraph} />
            </ClientSideSuspense>
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel defaultSize="12rem" minSize="6rem">
            <ConsolePanel />
          </ResizablePanel>
        </ResizablePanelGroup>
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel defaultSize="16rem" minSize="14rem" maxSize="36rem">
        <RightSidebar workflowId={workflowId} workflowName={workflowName} />
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}
