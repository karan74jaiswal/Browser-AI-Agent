// "use client"

// import * as React from "react"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"

interface WorkflowShellProps {
  workflowId: string
}

export function WorkflowShell({ workflowId: _workflowId }: WorkflowShellProps) {
  return (
    <ResizablePanelGroup orientation="horizontal" className="size-full">
      <ResizablePanel minSize="30rem">
        <ResizablePanelGroup orientation="vertical" className="size-full">
          <ResizablePanel minSize="18rem">
            <div className="flex h-full items-center justify-center p-4">
              <span className="text-sm font-medium text-muted-foreground">
                Canvas
              </span>
            </div>
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel defaultSize="8rem" minSize="6rem">
            <div className="flex h-full items-center justify-center p-4">
              <span className="text-sm font-medium text-muted-foreground">
                Logs
              </span>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel defaultSize="16rem" minSize="14rem" maxSize="36rem">
        <div className="flex h-full items-center justify-center p-4">
          <span className="text-sm font-medium text-muted-foreground">
            Inspector
          </span>
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}
