"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Download,
  LayoutDashboard,
  LayoutTemplate,
  Loader2,
  Pencil,
  PlusIcon,
  Trash2,
  Upload,
} from "lucide-react"
import { toast } from "sonner"

import type { WorkflowSummary } from "@/lib/db"
import { WorkflowsPopover } from "@/components/workflows-popover"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  createWorkflowAction as defaultCreateWorkflowAction,
  getWorkflowAction,
} from "@/features/workflows/actions"
import { downloadWorkflowJson } from "@/features/workflows/lib/workflow-export-import"
import { CreateWorkflowDialog } from "./create-workflow-dialog"
import { ImportWorkflowDialog } from "./import-workflow-dialog"
import { EditWorkflowDialog } from "./edit-workflow-dialog"
import { DeleteWorkflowDialog } from "./delete-workflow-dialog"

interface SidebarWorkflowsProps {
  workflows: WorkflowSummary[]
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
  const [isImportOpen, setIsImportOpen] = React.useState(false)
  const [editingWorkflow, setEditingWorkflow] =
    React.useState<WorkflowSummary | null>(null)
  const [deletingWorkflow, setDeletingWorkflow] =
    React.useState<WorkflowSummary | null>(null)
  const [exportingWorkflowId, setExportingWorkflowId] = React.useState<
    string | null
  >(null)

  const isWorkflowsRoute = Boolean(pathname?.startsWith("/workflows"))
  const activeWorkflowId =
    isWorkflowsRoute && pathname?.startsWith("/workflows/")
      ? pathname.split("/")[2]
      : undefined

  const handleExport = async (e: React.MouseEvent, workflow: WorkflowSummary) => {
    e.preventDefault()
    e.stopPropagation()
    if (exportingWorkflowId) return

    setExportingWorkflowId(workflow.id)
    try {
      const fullWorkflow = await getWorkflowAction(workflow.id)
      const graph = fullWorkflow?.graph || { nodes: [], edges: [] }
      downloadWorkflowJson(workflow.name, graph)
      toast.success(`Workflow "${workflow.name}" exported`)
    } catch (err) {
      console.error("Failed to export workflow:", err)
      toast.error("Failed to export workflow")
    } finally {
      setExportingWorkflowId(null)
    }
  }

  return (
    <>
      <CreateWorkflowDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        createWorkflowAction={createWorkflowAction}
      />
      <ImportWorkflowDialog
        open={isImportOpen}
        onOpenChange={setIsImportOpen}
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
        <SidebarGroup className="p-2 pt-0.5">
          <SidebarMenu className="gap-y-0.5">
            {!isWorkflowsRoute && (
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  tooltip="Dashboard"
                  className="size-8 justify-center p-0"
                >
                  <Link href="/workflows">
                    <LayoutDashboard className="size-4 text-primary" />
                    <span className="sr-only">Dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                tooltip="Templates"
                isActive={pathname === "/templates"}
                className="size-8 justify-center p-0"
              >
                <Link href="/templates">
                  <LayoutTemplate className="size-4 text-primary" />
                  <span className="sr-only">Templates</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <WorkflowsPopover
                workflows={workflows}
                activeWorkflowId={activeWorkflowId}
                showWorkflowsList={isWorkflowsRoute}
                onNewWorkflow={() => setIsCreateOpen(true)}
                onImportWorkflow={() => setIsImportOpen(true)}
              />
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      ) : (
        <>
          <SidebarGroup className="p-2 pb-0">
            <SidebarMenu className="gap-y-0.5">
              {!isWorkflowsRoute && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    tooltip="Dashboard"
                    isActive={pathname === "/workflows"}
                    className="h-9 px-3 text-sm font-medium hover:bg-accent hover:text-accent-foreground data-[active=true]:bg-accent data-[active=true]:font-medium data-[active=true]:text-accent-foreground"
                  >
                    <Link href="/workflows">
                      <LayoutDashboard className="size-4 text-primary" />
                      <span>Dashboard</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  tooltip="Templates"
                  isActive={pathname === "/templates"}
                  className="h-9 px-3 text-sm font-medium hover:bg-accent hover:text-accent-foreground data-[active=true]:bg-accent data-[active=true]:font-medium data-[active=true]:text-accent-foreground"
                >
                  <Link href="/templates">
                    <LayoutTemplate className="size-4 text-primary" />
                    <span>Templates</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>

          {isWorkflowsRoute && (
            <SidebarGroup className="p-2">
              <SidebarGroupLabel className="text-sm font-medium text-foreground">
                Workflows
              </SidebarGroupLabel>
          <div className="absolute top-3.5 right-3 flex items-center gap-1">
            <button
              type="button"
              title="Import workflow (JSON)"
              onClick={() => setIsImportOpen(true)}
              className="flex size-5 items-center justify-center rounded text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              <Upload className="size-3.5" />
              <span className="sr-only">Import workflow</span>
            </button>
            <button
              type="button"
              title="Create workflow"
              onClick={() => setIsCreateOpen(true)}
              className="flex size-5 items-center justify-center rounded text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              <PlusIcon className="size-3.5" />
              <span className="sr-only">Create workflow</span>
            </button>
          </div>
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
                      className="h-9 px-3 pr-20 text-sm font-normal data-[active=true]:bg-accent data-[active=true]:font-medium data-[active=true]:text-accent-foreground"
                    >
                      <Link href={`/workflows/${workflow.id}`}>
                        <span className="truncate">{workflow.name}</span>
                      </Link>
                    </SidebarMenuButton>
                    <div className="absolute top-1/2 right-1.5 flex -translate-y-1/2 items-center gap-0.5 opacity-0 transition-opacity group-focus-within/item:opacity-100 group-hover/item:opacity-100">
                      <button
                        type="button"
                        onClick={(e) => handleExport(e, workflow)}
                        disabled={exportingWorkflowId === workflow.id}
                        title="Export workflow (JSON)"
                        className="flex size-6 items-center justify-center rounded-md text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground disabled:opacity-50"
                      >
                        {exportingWorkflowId === workflow.id ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          <Download className="size-3.5" />
                        )}
                      </button>
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
      )}
    </>
  )
}
