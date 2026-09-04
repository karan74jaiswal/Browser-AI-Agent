"use client"

import { useCallback, useState } from "react"

import { useOnSelectionChange, useStore, useReactFlow } from "@xyflow/react"
import { Download, Lock, Pencil, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { EditWorkflowDialog } from "../edit-workflow-dialog"
import { DeleteWorkflowDialog } from "../delete-workflow-dialog"
import { useCredentials } from "@/features/credentials/components/credentials-provider"

import { Button } from "@/components/ui/button"

import { ResizablePanel } from "@/components/ui/resizable"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { type StepNodeType } from "@/features/workflows/system"
import { downloadWorkflowJson } from "@/features/workflows/lib/workflow-export-import"
import type { WorkflowGraph } from "@/lib/db"
import { useStatus } from "@liveblocks/react"

import Inspector from "./inspector"
import Palette from "./palette"
import RunButton from "./run-button"

// ---------------------------------------------------------------------------
// Header — workflow-level actions shown above the tabs.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// The sidebar itself — header on top, then the Toolbar / Editor tabs.
// ---------------------------------------------------------------------------

interface RightSidebarProps {
  workflowId: string
  workflowName?: string
  tab?: string
  onTabChange?: (tab: string) => void
}

export function RightSidebar({
  workflowId,
  workflowName = "",
  tab: controlledTab,
  onTabChange,
}: RightSidebarProps) {
  const [uncontrolledTab, setUncontrolledTab] = useState("toolbar")
  const isControlled = controlledTab !== undefined
  const tab = isControlled ? controlledTab : uncontrolledTab

  const handleTabChange = useCallback(
    (nextTab: string) => {
      if (!isControlled) {
        setUncontrolledTab(nextTab)
      }
      onTabChange?.(nextTab)
    },
    [isControlled, onTabChange]
  )

  const [isRenameOpen, setIsRenameOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const { openVault } = useCredentials()
  const status = useStatus()
  const isConnected = status === "connected"

  const { getNodes, getEdges } = useReactFlow<StepNodeType>()

  const handleExport = useCallback(() => {
    const currentGraph: WorkflowGraph = {
      nodes: getNodes(),
      edges: getEdges(),
    }
    downloadWorkflowJson(workflowName || "workflow", currentGraph)
    toast.success(`Workflow "${workflowName || "Workflow"}" exported`)
  }, [getNodes, getEdges, workflowName])

  // Read the currently selected node from React Flow without triggering re-renders on position/coordinate dragging.
  const selected = useStore(
    useCallback((s) => {
      const found = s.nodes.find((node) => node.selected)
      if (!found) return undefined
      return {
        id: found.id,
        type: found.type,
        data: found.data,
      } as StepNodeType
    }, []),
    (a, b) => {
      if (a === b) return true
      if (!a || !b) return false
      return a.id === b.id && a.data === b.data
    }
  )

  // Auto-switch to the Editor tab when the selection changes.
  const handleSelectionChange = useCallback(
    ({ nodes }: { nodes: StepNodeType[] }) => {
      if (nodes.length > 0) {
        handleTabChange("editor")
      }
    },
    [handleTabChange]
  )

  useOnSelectionChange({
    onChange: handleSelectionChange,
  })

  return (
    <ResizablePanel
      defaultSize="16rem"
      minSize="14rem"
      maxSize="36rem"
      className="bg-background"
    >
      <Tabs value={tab} onValueChange={handleTabChange} className="size-full gap-0">
        <div className="flex items-center justify-between border-b border-border p-2">
          <div className="flex items-center gap-1">
            <Button
              size="icon"
              variant="ghost"
              title="Credential Vault"
              onClick={() => openVault()}
            >
              <Lock className="size-4 text-amber-500/80" />
              <span className="sr-only">Credential Vault</span>
            </Button>
            <Button
              size="icon"
              variant="ghost"
              title="Rename workflow"
              onClick={() => setIsRenameOpen(true)}
            >
              <Pencil className="size-4" />
              <span className="sr-only">Rename workflow</span>
            </Button>
            <Button
              size="icon"
              variant="ghost"
              title={isConnected ? "Export workflow (JSON)" : "Connecting to canvas..."}
              disabled={!isConnected}
              onClick={handleExport}
            >
              <Download className="size-4" />
              <span className="sr-only">Export workflow</span>
            </Button>
            <Button
              size="icon"
              variant="ghost"
              title="Delete workflow"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={() => setIsDeleteOpen(true)}
            >
              <Trash2 className="size-4" />
              <span className="sr-only">Delete workflow</span>
            </Button>
          </div>
          <RunButton workflowId={workflowId} />
        </div>
        <TabsList className="m-2 w-fit bg-background">
          <TabsTrigger
            value="toolbar"
            className="flex-none rounded-sm data-active:bg-accent! data-active:text-accent-foreground! data-active:shadow-none! dark:data-active:border-transparent!"
          >
            Toolbar
          </TabsTrigger>
          <TabsTrigger
            value="editor"
            className="flex-none rounded-sm data-active:bg-accent! data-active:text-accent-foreground! data-active:shadow-none! dark:data-active:border-transparent!"
          >
            Editor
          </TabsTrigger>
        </TabsList>
        <TabsContent value="toolbar" className="flex min-h-0 flex-col">
          <Palette />
        </TabsContent>
        <TabsContent value="editor" className="flex min-h-0 flex-col">
          <Inspector
            key={selected?.id}
            node={selected}
            workflowId={workflowId}
          />
        </TabsContent>
      </Tabs>
      <EditWorkflowDialog
        workflowId={workflowId}
        initialName={workflowName}
        open={isRenameOpen}
        onOpenChange={setIsRenameOpen}
      />
      <DeleteWorkflowDialog
        workflowId={workflowId}
        workflowName={workflowName}
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        redirectOnDelete={true}
      />
    </ResizablePanel>
  )
}
