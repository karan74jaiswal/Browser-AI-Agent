"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Pencil, PlusIcon, Trash2 } from "lucide-react"

import type { Workflow } from "@/lib/db"
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
import { CreateWorkflowDialog } from "./create-workflow-dialog"
import { EditWorkflowDialog } from "./edit-workflow-dialog"
import { DeleteWorkflowDialog } from "./delete-workflow-dialog"

interface SidebarWorkflowsProps {
  workflows: Workflow[]
  createWorkflowAction?: (
    name: string
  ) => Promise<{ id: string } | null | void | unknown>
}

export function SidebarWorkflows({
  workflows,
  createWorkflowAction = defaultCreateWorkflowAction,
}: SidebarWorkflowsProps) {
  const pathname = usePathname()
  const { state, isMobile } = useSidebar()
  const isCollapsed = state === "collapsed" && !isMobile
  const [isCreateOpen, setIsCreateOpen] = React.useState(false)
  const [editingWorkflow, setEditingWorkflow] = React.useState<Workflow | null>(
    null
  )
  const [deletingWorkflow, setDeletingWorkflow] =
    React.useState<Workflow | null>(null)

  const activeWorkflowId = pathname?.startsWith("/workflows/")
    ? pathname.split("/")[2]
    : undefined

  return (
    <>
      <CreateWorkflowDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        createWorkflowAction={createWorkflowAction}
      />
      {editingWorkflow && (
        <EditWorkflowDialog
          workflowId={editingWorkflow.id}
          initialName={editingWorkflow.name}
          open={Boolean(editingWorkflow)}
          onOpenChange={(open) => !open && setEditingWorkflow(null)}
        />
      )}
      {deletingWorkflow && (
        <DeleteWorkflowDialog
          workflowId={deletingWorkflow.id}
          workflowName={deletingWorkflow.name}
          open={Boolean(deletingWorkflow)}
          onOpenChange={(open) => !open && setDeletingWorkflow(null)}
          redirectOnDelete={activeWorkflowId === deletingWorkflow.id}
        />
      )}
      {isCollapsed ? (
        <div className="flex flex-col items-center p-2">
          <WorkflowsPopover
            workflows={workflows}
            activeWorkflowId={activeWorkflowId}
            onNewWorkflow={() => setIsCreateOpen(true)}
          />
        </div>
      ) : (
        <SidebarGroup className="p-2">
          <SidebarGroupLabel className="text-sm font-medium text-foreground">
            Workflows
          </SidebarGroupLabel>
          <SidebarGroupAction
            title="Create workflow"
            onClick={() => setIsCreateOpen(true)}
          >
            <PlusIcon className="size-4" />
            <span className="sr-only">Create workflow</span>
          </SidebarGroupAction>
          <SidebarGroupContent className="mt-1">
            <SidebarMenu className="gap-y-0.5">
              {workflows.map((workflow) => {
                const isActive = activeWorkflowId === workflow.id
                return (
                  <SidebarMenuItem
                    key={workflow.id}
                    className="group/item relative"
                  >
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      className="h-9 px-3 pr-14 text-sm font-normal data-[active=true]:bg-accent data-[active=true]:font-medium data-[active=true]:text-accent-foreground"
                    >
                      <Link href={`/workflows/${workflow.id}`}>
                        <span className="truncate">{workflow.name}</span>
                      </Link>
                    </SidebarMenuButton>
                    <div className="absolute top-1/2 right-1.5 flex -translate-y-1/2 items-center gap-0.5 opacity-0 transition-opacity group-hover/item:opacity-100 group-focus-within/item:opacity-100">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          setEditingWorkflow(workflow)
                        }}
                        title="Rename workflow"
                        className="flex size-6 items-center justify-center rounded-md text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      >
                        <Pencil className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          setDeletingWorkflow(workflow)
                        }}
                        title="Delete workflow"
                        className="flex size-6 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      )}
    </>
  )
}

