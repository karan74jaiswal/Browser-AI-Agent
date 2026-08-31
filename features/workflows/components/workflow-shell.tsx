import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import type { WorkflowGraph } from "@/lib/db"
import { Canvas } from "./canvas"
import { ConsolePanel } from "./console-panel"
import { RightSidebar } from "./rightSidebar/right-sidebar"

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
            <Canvas workflowId={workflowId} initialGraph={initialGraph} />
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
