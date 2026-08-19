"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { PlusIcon } from "lucide-react"

import type { Workflow } from "@/db"
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
import { createWorkflowAction as defaultCreateWorkflowAction } from "@/features/workflows/actions"
import { generateSlug } from "@/features/workflows/lib/generate-slug"

interface SidebarWorkflowsProps {
  workflows: Workflow[]
  createWorkflowAction?: (name: string) => Promise<void>
}

export function SidebarWorkflows({
  workflows,
  createWorkflowAction = defaultCreateWorkflowAction,
}: SidebarWorkflowsProps) {
  const pathname = usePathname()
  const { state, isMobile } = useSidebar()
  const isCollapsed = state === "collapsed" && !isMobile
  const [isPending, startTransition] = React.useTransition()

  const activeWorkflowId = pathname?.startsWith("/workflows/")
    ? pathname.split("/")[2]
    : undefined

  const handleCreateWorkflow = () => {
    const name = generateSlug()
    startTransition(async () => {
      await createWorkflowAction(name)
    })
  }

  if (isCollapsed) {
    return (
      <div className="flex flex-col items-center p-2">
        <WorkflowsPopover
          workflows={workflows}
          activeWorkflowId={activeWorkflowId}
          onNewWorkflow={handleCreateWorkflow}
        />
      </div>
    )
  }

  return (
    <SidebarGroup className="p-2">
      <SidebarGroupLabel className="text-sm font-medium text-foreground">
        Workflows
      </SidebarGroupLabel>
      <SidebarGroupAction
        title="Create workflow"
        onClick={handleCreateWorkflow}
        disabled={isPending}
      >
        <PlusIcon className="size-4" />
        <span className="sr-only">Create workflow</span>
      </SidebarGroupAction>
      <SidebarGroupContent className="mt-1">
        <SidebarMenu className="gap-y-0.5">
          {workflows.map((workflow) => {
            const isActive = activeWorkflowId === workflow.id
            return (
              <SidebarMenuItem key={workflow.id}>
                <SidebarMenuButton
                  asChild
                  isActive={isActive}
                  className="h-9 px-3 text-sm font-normal data-[active=true]:bg-accent data-[active=true]:font-medium data-[active=true]:text-accent-foreground"
                >
                  <Link href={`/workflows/${workflow.id}`}>
                    <span className="truncate">{workflow.name}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}

