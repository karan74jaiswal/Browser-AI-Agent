"use client"

import * as React from "react"
import Link from "next/link"
import { PlusIcon, WorkflowIcon } from "lucide-react"

import type { Workflow } from "@/lib/db"
import { cn } from "@/lib/utils"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar"

interface WorkflowsPopoverProps {
  workflows: Workflow[]
  activeWorkflowId?: string
  onSelectWorkflow?: (id: string) => void
  onNewWorkflow?: () => void
  className?: string
}

export function WorkflowsPopover({
  workflows,
  activeWorkflowId,
  onSelectWorkflow,
  onNewWorkflow,
  className,
}: WorkflowsPopoverProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <SidebarMenuButton
          tooltip="Workflows"
          className={cn(
            "size-8 justify-center rounded-lg p-0 data-[state=open]:bg-accent data-[state=open]:text-accent-foreground",
            className
          )}
        >
          <WorkflowIcon className="size-4" />
          <span className="sr-only">Workflows</span>
        </SidebarMenuButton>
      </PopoverTrigger>
      <PopoverContent
        side="right"
        align="start"
        sideOffset={8}
        onCloseAutoFocus={(e) => e.preventDefault()}
        className="w-64 rounded-xl border bg-popover p-2 text-popover-foreground shadow-xl"
      >
        <SidebarMenu className="gap-y-0.5">
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={onNewWorkflow}
              className="h-9 px-3 text-sm font-medium"
            >
              <PlusIcon className="size-4" />
              <span>New workflow</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        <SidebarSeparator className="mx-0 my-1.5" />

        <div className="flex max-h-[calc(100vh-14rem)] flex-col overflow-y-auto">
          <SidebarMenu className="gap-y-0.5">
            {workflows.map((workflow) => (
              <SidebarMenuItem key={workflow.id}>
                <SidebarMenuButton
                  asChild
                  isActive={activeWorkflowId === workflow.id}
                  onClick={() => onSelectWorkflow?.(workflow.id)}
                  className="h-9 px-3 text-sm font-normal data-[active=true]:bg-accent data-[active=true]:font-medium data-[active=true]:text-accent-foreground"
                >
                  <Link href={`/workflows/${workflow.id}`}>
                    <span className="truncate">{workflow.name}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </div>
      </PopoverContent>
    </Popover>
  )
}
