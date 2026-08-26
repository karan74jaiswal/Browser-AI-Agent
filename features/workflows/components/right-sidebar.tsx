"use client"

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react"
import { useAuth, useOrganization } from "@clerk/nextjs"
import {
  useEdges,
  useNodes,
  useOnSelectionChange,
  useReactFlow,
  useStore,
} from "@xyflow/react"
import {
  AlertTriangle,
  Check,
  Code2,
  Copy,
  Lock,
  Pencil,
  Play,
  RefreshCw,
  Sparkles,
  Terminal,
  Trash2,
} from "lucide-react"
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
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { TokenInput, type TokenInputHandle } from "./token-input"
import { Label } from "@/components/ui/label"
import { ResizablePanel } from "@/components/ui/resizable"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { extractAllTokenReferences, generateGoogleFormScript, validateGraph } from "../lib"

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
  nodeId,
  onChange,
  onFocus,
  inputRef,
}: {
  field: NodeField
  value: string
  nodeId?: string
  onChange: (value: string) => void
  onFocus?: () => void
  inputRef?: (handle: TokenInputHandle | null) => void
}) {
  if (field.options && field.options.length > 0) {
    const currentValue =
      value || field.defaultValue || field.options[0]?.value || ""
    return (
      <Select value={currentValue} onValueChange={onChange}>
        <SelectTrigger id={field.key} className="w-full text-xs h-8 bg-background">
          <SelectValue placeholder={field.placeholder || "Select option..."} />
        </SelectTrigger>
        <SelectContent position="popper" className="max-h-64 min-w-[var(--radix-select-trigger-width)]">
          {field.options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value} className="text-xs cursor-pointer">
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
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
      currentNodeId={nodeId}
    />
  )
}


function GoogleFormTriggerInspector({
  node,
  workflowId,
}: {
  node: StepNodeType
  workflowId: string
}) {
  const { orgId } = useAuth()
  const { updateNodeData } = useReactFlow<StepNodeType>()
  const [copiedUrl, setCopiedUrl] = useState(false)
  const [copiedScript, setCopiedScript] = useState(false)

  // Ensure secret token is generated
  const secret = node.data.values?.secret || ""
  useEffect(() => {
    if (!node.data.values?.secret) {
      const generated = `whsec_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`
      updateNodeData(node.id, {
        values: { ...node.data.values, secret: generated },
      })
    }
  }, [node.id, node.data.values, updateNodeData])

  const handleRegenerateSecret = () => {
    const generated = `whsec_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`
    updateNodeData(node.id, {
      values: { ...node.data.values, secret: generated },
    })
    toast.success("Webhook secret regenerated")
  }

  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL || ""

  const webhookUrl = `${origin}/api/webhooks/google-form?orgId=${orgId ?? ""}&workflowId=${workflowId}&secret=${secret}`

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(webhookUrl)
      setCopiedUrl(true)
      toast.success("Webhook URL copied to clipboard")
      setTimeout(() => setCopiedUrl(false), 2000)
    } catch {
      toast.error("Failed to copy URL")
    }
  }

  const handleCopyScript = async () => {
    try {
      const script = generateGoogleFormScript(webhookUrl)
      await navigator.clipboard.writeText(script)
      setCopiedScript(true)
      toast.success("Google Apps Script copied to clipboard")
      setTimeout(() => setCopiedScript(false), 2000)
    } catch {
      toast.error("Failed to copy script")
    }
  }

  return (
    <div className="flex flex-col gap-3 border-t border-border pt-3">
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs font-medium">Webhook URL</Label>
        <div className="flex items-center gap-1.5">
          <Input
            readOnly
            value={webhookUrl}
            className="h-8 font-mono text-[11px] text-muted-foreground"
          />
          <Button
            type="button"
            size="icon"
            variant="outline"
            className="size-8 shrink-0"
            onClick={handleCopyUrl}
            title="Copy Webhook URL"
          >
            {copiedUrl ? (
              <Check className="size-3.5 text-emerald-500" />
            ) : (
              <Copy className="size-3.5" />
            )}
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-[11px] text-muted-foreground">Webhook Secret</span>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={handleRegenerateSecret}
          className="h-6 gap-1 px-1.5 text-[11px] text-muted-foreground hover:text-foreground"
        >
          <RefreshCw className="size-3" />
          <span>Regenerate</span>
        </Button>
      </div>

      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={handleCopyScript}
        className="w-full gap-2 text-xs"
      >
        {copiedScript ? (
          <Check className="size-3.5 text-emerald-500" />
        ) : (
          <Code2 className="size-3.5" />
        )}
        <span>Copy Google Apps Script</span>
      </Button>

      <div className="rounded-md border border-border bg-muted/30 p-2.5 text-xs text-muted-foreground">
        <div className="mb-1.5 font-semibold text-foreground">
          Setup Instructions
        </div>
        <ol className="list-inside list-decimal space-y-1 text-[11px] leading-relaxed">
          <li>Open your form on Google Forms</li>
          <li>
            Click the three dots (&vellip;) menu &rarr; <b>Apps Script</b>
          </li>
          <li>
            Paste the copied script and click <b>Save</b>
          </li>
          <li>
            Click <b>Triggers</b> (alarm icon) &rarr; <b>Add Trigger</b>
          </li>
          <li>
            Select &quot;On form submit&quot; &rarr; <b>Save</b>
          </li>
        </ol>
      </div>
    </div>
  )
}

function StripeTriggerInspector({
  node,
  workflowId,
}: {
  node: StepNodeType
  workflowId: string
}) {
  const { updateNodeData } = useReactFlow<StepNodeType>()
  const { organization } = useOrganization()
  const [copiedUrl, setCopiedUrl] = useState(false)
  const [copiedCli, setCopiedCli] = useState(false)

  const orgId = organization?.id || ""
  const secret = node.data.values?.secret || ""

  const baseUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

  const webhookUrl = `${baseUrl}/api/webhooks/stripe?workflowId=${workflowId}&orgId=${orgId}&secret=${secret}`
  const cliCommand = `stripe listen --forward-to "${webhookUrl}"`

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(webhookUrl)
      setCopiedUrl(true)
      toast.success("Stripe Webhook URL copied to clipboard")
      setTimeout(() => setCopiedUrl(false), 2000)
    } catch {
      toast.error("Failed to copy URL")
    }
  }

  const handleCopyCli = async () => {
    try {
      await navigator.clipboard.writeText(cliCommand)
      setCopiedCli(true)
      toast.success("Stripe CLI command copied to clipboard")
      setTimeout(() => setCopiedCli(false), 2000)
    } catch {
      toast.error("Failed to copy CLI command")
    }
  }

  const handleRegenerateSecret = () => {
    const newSecret = `whsec_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`
    updateNodeData(node.id, {
      values: { ...node.data.values, secret: newSecret },
    })
    toast.success("Webhook secret regenerated")
  }

  return (
    <div className="flex flex-col gap-3 border-t border-border pt-3">
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs font-medium">Webhook URL</Label>
        <div className="flex items-center gap-1.5">
          <Input
            readOnly
            value={webhookUrl}
            className="h-8 font-mono text-[11px] text-muted-foreground"
          />
          <Button
            type="button"
            size="icon"
            variant="outline"
            className="size-8 shrink-0"
            onClick={handleCopyUrl}
            title="Copy Webhook URL"
          >
            {copiedUrl ? (
              <Check className="size-3.5 text-emerald-500" />
            ) : (
              <Copy className="size-3.5" />
            )}
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-[11px] text-muted-foreground">Webhook Secret</span>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={handleRegenerateSecret}
          className="h-6 gap-1 px-1.5 text-[11px] text-muted-foreground hover:text-foreground"
        >
          <RefreshCw className="size-3" />
          <span>Regenerate</span>
        </Button>
      </div>

      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={handleCopyCli}
        className="w-full gap-2 text-xs cursor-pointer"
      >
        {copiedCli ? (
          <Check className="size-3.5 text-emerald-500" />
        ) : (
          <Terminal className="size-3.5" />
        )}
        <span>Copy Stripe CLI Test Command</span>
      </Button>

      <div className="rounded-md border border-border bg-muted/30 p-2.5 text-xs text-muted-foreground">
        <div className="mb-1.5 font-semibold text-foreground">
          Setup Instructions
        </div>
        <ol className="list-inside list-decimal space-y-1 text-[11px] leading-relaxed">
          <li>
            Open <b>Stripe Dashboard</b> &rarr; <b>Developers</b> &rarr; <b>Webhooks</b>
          </li>
          <li>
            Click <b>Add destination / Add endpoint</b>
          </li>
          <li>Paste the Webhook URL above</li>
          <li>
            Select the event(s) to listen for (e.g. <code>payment_intent.succeeded</code>)
          </li>
          <li>Save the endpoint</li>
        </ol>
      </div>
    </div>
  )
}

function DiscordInspector() {
  return (
    <div className="rounded-md border border-border bg-muted/30 p-2.5 text-xs text-muted-foreground">
      <div className="mb-1.5 font-semibold text-foreground">
        How to get a Discord Webhook URL
      </div>
      <ol className="list-inside list-decimal space-y-1 text-[11px] leading-relaxed">
        <li>Open Discord and go to your server</li>
        <li>Hover over your target channel &rarr; click <b>Edit Channel (⚙️)</b></li>
        <li>Navigate to <b>Integrations</b> &rarr; <b>Webhooks</b></li>
        <li>Click <b>New Webhook</b> (or select an existing one)</li>
        <li>Click <b>Copy Webhook URL</b> and paste it into the Webhook URL field above</li>
      </ol>
    </div>
  )
}

function SlackInspector() {
  return (
    <div className="rounded-md border border-border bg-muted/30 p-2.5 text-xs text-muted-foreground">
      <div className="mb-1.5 font-semibold text-foreground">
        How to get a Slack Webhook URL
      </div>
      <ol className="list-inside list-decimal space-y-1 text-[11px] leading-relaxed">
        <li>Go to <b>api.slack.com/apps</b> and select or create your App</li>
        <li>Click <b>Incoming Webhooks</b> in the left sidebar and toggle it <b>On</b></li>
        <li>Click <b>Add New Webhook to Workspace</b> at the bottom</li>
        <li>Choose the channel you want messages posted to &rarr; <b>Allow</b></li>
        <li>Copy the generated <b>Webhook URL</b> and paste it into the Webhook URL field above</li>
      </ol>
    </div>
  )
}

// The Editor tab: one input per field on the selected node, or an empty state.
function Inspector({
  node,
  workflowId,
}: {
  node: StepNodeType | undefined
  workflowId: string
}) {
  const { updateNodeData } = useReactFlow<StepNodeType>()
  const connections = useUpstreamConnections(node)
  const allNodes = useNodes<StepNodeType>()
  const allEdges = useEdges()
  const [activeFieldKey, setActiveFieldKey] = useState<string | null>(null)
  const inputRefs = useRef<Map<string, TokenInputHandle>>(new Map())

  // Find broken token references in node.data.values
  const { brokenTokens, relinkCandidates } = useMemo(() => {
    if (!node) return { brokenTokens: [], relinkCandidates: [] }

    const targetToSources = new Map<string, string[]>()
    for (const edge of allEdges) {
      if (!edge.source || !edge.target) continue
      const sources = targetToSources.get(edge.target)
      if (sources) {
        sources.push(edge.source)
      } else {
        targetToSources.set(edge.target, [edge.source])
      }
    }

    const ancestors = new Set<string>()
    const queue = [...(targetToSources.get(node.id) || [])]
    while (queue.length > 0) {
      const curr = queue.shift()!
      if (!ancestors.has(curr)) {
        ancestors.add(curr)
        const parents = targetToSources.get(curr) || []
        for (const p of parents) {
          if (!ancestors.has(p)) queue.push(p)
        }
      }
    }

    const nodeById = new Map(allNodes.map((n) => [n.id, n]))
    const broken: { raw: string; nodeId: string; path: string; fieldKey: string }[] = []

    for (const [fieldKey, rawVal] of Object.entries(node.data.values || {})) {
      if (typeof rawVal !== "string") continue
      const refs = extractAllTokenReferences(rawVal)
      for (const ref of refs) {
        if (!nodeById.has(ref.nodeId) || !ancestors.has(ref.nodeId)) {
          broken.push({
            raw: `{{ ${ref.nodeId}.${ref.path} }}`,
            nodeId: ref.nodeId,
            path: ref.path,
            fieldKey,
          })
        }
      }
    }

    // Upstream nodes that could satisfy these broken tokens
    const candidates: { id: string; title: string; type: NodeType }[] = []
    for (const ancestorId of ancestors) {
      const ancestorNode = nodeById.get(ancestorId)
      if (!ancestorNode) continue
      candidates.push({
        id: ancestorNode.id,
        title: ancestorNode.data?.title || "Step",
        type: ancestorNode.data?.type as NodeType,
      })
    }

    return { brokenTokens: broken, relinkCandidates: candidates }
  }, [node, allNodes, allEdges])

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

  const handleRelink = (targetNodeId: string, targetTitle: string) => {
    if (!node) return
    const newValues = { ...(node.data.values || {}) }
    let relinkedCount = 0

    for (const b of brokenTokens) {
      const currentVal = newValues[b.fieldKey]
      if (typeof currentVal === "string") {
        const escapedPath = b.path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
        const regex = new RegExp(`\\{\\{\\s*${b.nodeId}\\.${escapedPath}\\s*\\}\\}`, "g")
        const updated = currentVal.replace(
          regex,
          `{{ ${targetNodeId}.${b.path} }}`
        )
        if (updated !== currentVal) {
          newValues[b.fieldKey] = updated
          relinkedCount++
        }
      }
    }

    updateNodeData(node.id, { values: newValues })
    toast.success(
      `Relinked ${relinkedCount} token${relinkedCount === 1 ? "" : "s"} to ${targetTitle}`
    )
  }

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
        {brokenTokens.length > 0 && relinkCandidates.length > 0 && (
          <div className="flex flex-col gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-2.5 text-xs text-amber-700 dark:text-amber-400">
            <div className="flex items-center gap-1.5 font-medium">
              <AlertTriangle className="size-3.5 shrink-0" />
              <span>
                {brokenTokens.length} broken {brokenTokens.length === 1 ? "token" : "tokens"} detected
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Found variables referencing a deleted or replaced step. Relink them to your connected steps:
            </p>
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {relinkCandidates.map((candidate) => (
                <Button
                  key={candidate.id}
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => handleRelink(candidate.id, candidate.title)}
                  className="h-6 gap-1 bg-background/80 px-2 text-[11px] hover:bg-background hover:text-foreground cursor-pointer"
                >
                  <Sparkles className="size-3 text-amber-500" />
                  <span>Relink to {candidate.title}</span>
                </Button>
              ))}
            </div>
          </div>
        )}
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
                  nodeId={node.id}
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

        {type === "google-form-trigger" && (
          <GoogleFormTriggerInspector node={node} workflowId={workflowId} />
        )}

        {type === "stripe-trigger" && (
          <StripeTriggerInspector node={node} workflowId={workflowId} />
        )}

        {type === "discord" && <DiscordInspector />}

        {type === "slack" && <SlackInspector />}

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

    const initialValues: Record<string, string> = {}
    for (const field of def.fields as NodeField[]) {
      if (field.defaultValue) {
        initialValues[field.key] = field.defaultValue
      } else if (
        field.options &&
        field.options.length > 0 &&
        field.options[0]?.value
      ) {
        initialValues[field.key] = field.options[0].value
      }
    }
    if (type === "google-form-trigger" || type === "stripe-trigger") {
      initialValues.secret = `whsec_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`
    }
    if (type === "google-form-trigger") {
      initialValues.accessMode = "private"
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
        values: initialValues,
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
