"use client"

import { useCallback, useRef, useState, useTransition } from "react"
import {
  useOnSelectionChange,
  useReactFlow,
  useStore,
} from "@xyflow/react"
import { Lock, Pencil, Play, Trash2 } from "lucide-react"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "sonner"
import { runWorkflowAction } from "@/features/workflows/actions"
import { useProPlan, useUpstreamConnections } from "@/features/workflows/hooks"
import { useWorkflowRuns } from "./workflow-runs-provider"
import { EditWorkflowDialog } from "./edit-workflow-dialog"
import { DeleteWorkflowDialog } from "./delete-workflow-dialog"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { TokenInput, type TokenInputHandle } from "./token-input"
import { Label } from "@/components/ui/label"
import { ResizablePanel } from "@/components/ui/resizable"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { validateGraph } from "../lib"

import { NodeIcon } from "./node-icon"
import {
  nodeRegistry,
  type NodeDefinition,
  type NodeField,
  type NodeType,
  type StepNodeKind,
  type StepNodeType,
} from "@/features/workflows/nodes/node-registry"

// This file builds up to the RightSidebar component exported at the bottom: a
// header with workflow actions (delete, run), then two tabs — a Toolbar for
// adding nodes and an Editor for tweaking the selected node. Each helper below is
// defined just above the block that uses it.

// ---------------------------------------------------------------------------
// Shared pieces — used by both the Toolbar and the Editor.
// ---------------------------------------------------------------------------

// A titled, scrollable panel. Each tab renders its content inside one.
function Section({
  title,
  icon,
  children,
}: {
  title: string
  icon?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center gap-2 border-y border-border bg-card px-3 py-1.5 text-sm font-semibold">
        {icon}
        {title}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
    </div>
  )
}


// ---------------------------------------------------------------------------
// Editor tab — edits the fields of the selected node.
// ---------------------------------------------------------------------------

// A single editor field for a node property.
function FieldInput({
  field,
  value,
  onChange,
  onFocus,
  inputRef,
}: {
  field: NodeField
  value: string
  onChange: (value: string) => void
  onFocus?: () => void
  inputRef?: (handle: TokenInputHandle | null) => void
}) {
  if (field.options && field.options.length > 0) {
    const currentValue =
      value || field.defaultValue || field.options[0]?.value || ""
    return (
      <NativeSelect
        id={field.key}
        value={currentValue}
        onChange={(e) => onChange(e.target.value)}
        className="w-full text-xs"
      >
        {field.options.map((opt) => (
          <NativeSelectOption key={opt.value} value={opt.value}>
            {opt.label}
          </NativeSelectOption>
        ))}
      </NativeSelect>
    )
  }

  return (
    <TokenInput
      id={field.key}
      ref={inputRef}
      value={value}
      placeholder={field.placeholder}
      multiline={field.multiline}
      onChange={onChange}
      onFocus={onFocus}
    />
  )
}


// The Editor tab: one input per field on the selected node, or an empty state.
function Inspector({ node }: { node: StepNodeType | undefined }) {
  const { updateNodeData } = useReactFlow<StepNodeType>()
  const connections = useUpstreamConnections(node)
  const [activeFieldKey, setActiveFieldKey] = useState<string | null>(null)
  const inputRefs = useRef<Map<string, TokenInputHandle>>(new Map())

  if (!node) {
    return (
      <Section title="Editor">
        <p className="p-3 text-sm text-muted-foreground">No node selected</p>
      </Section>
    )
  }

  const { type, title, values } = node.data
  const def: NodeDefinition = nodeRegistry[type]
  const insertableFields = def.fields.filter(
    (f) => !f.options || f.options.length === 0
  )

  const handleInsertToken = (token: string) => {
    const targetField =
      insertableFields.find((f) => f.key === activeFieldKey) ??
      insertableFields[0]

    if (!targetField) return

    setActiveFieldKey(targetField.key)
    const handle = inputRefs.current.get(targetField.key)
    if (handle) {
      handle.insertToken(token)
    } else {
      const currentVal = values[targetField.key] ?? ""
      const newVal = currentVal ? `${currentVal} ${token}` : token
      updateNodeData(node.id, {
        values: { ...values, [targetField.key]: newVal },
      })
    }
  }

  return (
    <Section title={title} icon={<NodeIcon type={type} />}>
      <div className="flex flex-col gap-3 p-3">
        {def.fields.length === 0 ? (
          <p className="text-xs text-muted-foreground">No properties</p>
        ) : (
          def.fields.map((field) => {
            const isInsertable = !field.options || field.options.length === 0
            return (
              <div key={field.key} className="flex flex-col gap-1.5">
                <Label htmlFor={field.key} className="text-xs">
                  {field.label}
                  {field.required && <span className="text-destructive">*</span>}
                </Label>
                <FieldInput
                  field={field}
                  value={values[field.key] ?? ""}
                  inputRef={
                    isInsertable
                      ? (handle) => {
                          if (handle) {
                            inputRefs.current.set(field.key, handle)
                          } else {
                            inputRefs.current.delete(field.key)
                          }
                        }
                      : undefined
                  }
                  onFocus={
                    isInsertable
                      ? () => setActiveFieldKey(field.key)
                      : undefined
                  }
                  onChange={(value) => {
                    if (isInsertable) {
                      setActiveFieldKey(field.key)
                    }
                    updateNodeData(node.id, {
                      values: { ...values, [field.key]: value },
                    })
                  }}
                />
              </div>
            )
          })
        )}

        {connections.length > 0 && insertableFields.length > 0 && (
          <div className="flex flex-col gap-1.5 border-t border-border pt-3">
            <Label className="text-xs text-muted-foreground">Connections</Label>
            <div className="flex flex-wrap gap-1.5">
              {connections.map((conn) => (
                <button
                  key={`${conn.nodeId}-${conn.path}`}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleInsertToken(conn.token)}
                  className="flex cursor-pointer items-center gap-1.5 rounded-md border border-border bg-card px-2 py-1 text-xs text-card-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  <NodeIcon
                    type={conn.type}
                    className="size-4 rounded-xs [&_svg]:size-2.5"
                  />
                  <span>{conn.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </Section>
  )
}

// ---------------------------------------------------------------------------
// Toolbar tab — adds nodes to the canvas, grouped by kind.
// ---------------------------------------------------------------------------

// The Toolbar's groups, one accordion section per node kind.
const sections: { kind: StepNodeKind; label: string }[] = [
  { kind: "trigger", label: "Triggers" },
  { kind: "action", label: "Actions" },
]

// Every node type from the registry, filtered into the groups below.
const definitions = Object.values(nodeRegistry)

// The Toolbar tab: a button per node type that adds it to the canvas.
function Palette() {
  const { getNodes, getViewport, addNodes } = useReactFlow<StepNodeType>()
  const { isNodeLocked, redirectToPricing } = useProPlan()

  const width = useStore((s) => s.width)
  const height = useStore((s) => s.height)
  const add = (type: NodeType) => {
    const def = nodeRegistry[type]
    if (!def) return

    if (isNodeLocked(def)) {
      redirectToPricing()
      return
    }

    const nodes = getNodes()

    if (
      def.kind === "trigger" &&
      nodes.some((node) => node.data?.kind === "trigger")
    ) {
      toast.error("A workflow can only have one trigger")
      return
    }

    const count = nodes.filter((n) => n.data.type === type).length
    const title = `${def.label} ${count + 1}`

    const { x, y, zoom } = getViewport()

    const position = {
      x: (width / 2 - x) / zoom,
      y: (height / 2 - y) / zoom,
    }

    const newNode: StepNodeType = {
      id: crypto.randomUUID(),
      type: "step",
      position,
      origin: [0.5, 0.5],
      data: {
        kind: def.kind,
        title,
        type,
        values: {},
      },
    }

    addNodes(newNode)
  }

  return (
    <Section title="Toolbar">
      <Accordion
        type="multiple"
        defaultValue={sections.map((s) => s.kind)}
        className="px-3 py-2"
      >
        {sections.map((section) => (
          <AccordionItem
            key={section.kind}
            value={section.kind}
            className="not-last:border-b-0"
          >
            <AccordionTrigger className="py-2 text-xs font-medium text-muted-foreground hover:no-underline">
              {section.label}
            </AccordionTrigger>
            <AccordionContent className="flex flex-col gap-0.5">
              {definitions
                .filter((def) => def.kind === section.kind)
                .map((def) => {
                  const isLocked = isNodeLocked(def)
                  return (
                    <Button
                      key={def.type}
                      variant="ghost"
                      onClick={() => {
                        if (isLocked) {
                          redirectToPricing()
                          return
                        }
                        add(def.type as NodeType)
                      }}
                      className="w-full justify-start gap-2.5 px-1.5 text-xs"
                    >
                      <NodeIcon type={def.type as NodeType} />
                      <span>{def.label}</span>
                      {isLocked && (
                        <Lock className="ml-auto size-3.5 text-muted-foreground" />
                      )}
                    </Button>
                  )
                })}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </Section>
  )
}

// ---------------------------------------------------------------------------
// Header — workflow-level actions shown above the tabs.
// ---------------------------------------------------------------------------

// Kicks off a run of the current workflow or cancels an active one.
function RunButton({ workflowId }: { workflowId: string }) {
  const { getNodes, getEdges } = useReactFlow<StepNodeType>()
  const { latestRun, isLive, cancelingRunId, cancelRun } = useWorkflowRuns()
  const [isTriggering, startTriggerTransition] = useTransition()

  const isCanceling = Boolean(
    cancelingRunId && latestRun?.id === cancelingRunId && isLive
  )

  const handleRun = () => {
    const graph = { nodes: getNodes(), edges: getEdges() }
    const problems = validateGraph(graph)
    if (problems.length > 0) {
      toast.error(problems[0])
      return
    }
    startTriggerTransition(async () => {
      try {
        await runWorkflowAction(workflowId, graph)
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Failed to start workflow"
        )
      }
    })
  }

  const handleCancel = async () => {
    if (!latestRun?.id || isCanceling) return
    try {
      await cancelRun(latestRun.id)
      toast.success("Workflow cancellation requested")
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to cancel workflow"
      )
    }
  }

  if (isLive || isTriggering) {
    return (
      <Button
        size="sm"
        variant="destructive"
        disabled={isCanceling}
        onClick={handleCancel}
        className="gap-1.5"
      >
        {isCanceling ? (
          <>
            <Spinner className="size-3.5" />
            <span>Canceling...</span>
          </>
        ) : (
          <>
            <div className="relative flex size-3.5 shrink-0 items-center justify-center">
              <Spinner className="size-3.5 text-current" />
              <div className="absolute size-1 rounded-[0.5px] bg-current" />
            </div>
            <span>Stop</span>
          </>
        )}
      </Button>
    )
  }

  return (
    <Button
      size="sm"
      variant="secondary"
      onClick={handleRun}
      className="gap-1.5"
    >
      <Play className="size-3.5 fill-primary" />
      <span>Run</span>
    </Button>
  )
}

// ---------------------------------------------------------------------------
// The sidebar itself — header on top, then the Toolbar / Editor tabs.
// ---------------------------------------------------------------------------

interface RightSidebarProps {
  workflowId: string
  workflowName?: string
}

export function RightSidebar({
  workflowId,
  workflowName = "",
}: RightSidebarProps) {
  const [tab, setTab] = useState("toolbar")
  const [isRenameOpen, setIsRenameOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)

  // Read the currently selected node from React Flow.
  const selected = useStore((s) => s.nodes.find((node) => node.selected)) as
    StepNodeType | undefined

  // Auto-switch to the Editor tab when the selection changes.
  useOnSelectionChange({
    onChange: useCallback(({ nodes }) => {
      if (nodes.length == 1) {
        setTab("editor")
      }
    }, []),
  })

  return (
    <ResizablePanel
      className="bg-background"
      defaultSize="16rem"
      minSize="14rem"
      maxSize="36rem"
      groupResizeBehavior="preserve-pixel-size"
    >
      <Tabs value={tab} onValueChange={setTab} className="size-full gap-0">
        <div className="flex items-center justify-between border-b border-border p-2">
          <div className="flex items-center gap-1">
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
          <Inspector key={selected?.id} node={selected} />
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
