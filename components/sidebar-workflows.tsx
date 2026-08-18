"use client"

import * as React from "react"
import { PlusIcon } from "lucide-react"

import { WORKFLOWS } from "@/lib/workflows"
import { WorkflowsPopover } from "@/components/workflows-popover"
import {
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

export function SidebarWorkflows() {
  const [activeWorkflowId, setActiveWorkflowId] = React.useState(
    WORKFLOWS[0]?.id ?? "1"
  )
  const { state, isMobile } = useSidebar()
  const isCollapsed = state === "collapsed" && !isMobile

  if (isCollapsed) {
    return (
      <div className="flex flex-col items-center p-2">
        <WorkflowsPopover
          workflows={WORKFLOWS}
          activeWorkflowId={activeWorkflowId}
          onSelectWorkflow={setActiveWorkflowId}
        />
      </div>
    )
  }

  return (
    <SidebarGroup className="p-2">
      <SidebarGroupLabel className="text-sm font-medium text-foreground">
        Workflows
      </SidebarGroupLabel>
      <SidebarGroupAction title="Create workflow">
        <PlusIcon className="size-4" />
        <span className="sr-only">Create workflow</span>
      </SidebarGroupAction>
      <SidebarGroupContent className="mt-1">
        <SidebarMenu className="gap-y-0.5">
          {WORKFLOWS.map((workflow) => (
            <SidebarMenuItem key={workflow.id}>
              <SidebarMenuButton
                isActive={activeWorkflowId === workflow.id}
                onClick={() => setActiveWorkflowId(workflow.id)}
                className="h-9 px-3 text-sm font-normal data-[active=true]:bg-accent data-[active=true]:font-medium data-[active=true]:text-accent-foreground"
              >
                <span>{workflow.name}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
