"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@clerk/nextjs"
import {
  ArrowDown,
  ArrowRight,
  Bot,
  CheckCircle2,
  Clock,
  CreditCard,
  Eye,
  GitBranch,
  GitFork,
  Globe,
  KeyRound,
  Loader2,
  Mail,
  Share2,
  Sparkles,
  Split,
  Zap,
} from "lucide-react"
import type { Edge } from "@xyflow/react"
import { toast } from "sonner"
import * as Sentry from "@sentry/nextjs"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { nodeRegistry, type NodeType, type StepNodeType } from "@/features/workflows/nodes/node-registry"
import { NodeIcon } from "@/features/workflows/components/node-icon"
import { TEMPLATE_CATEGORIES, type WorkflowTemplate } from "../types"
import { cloneWorkflowFromTemplateAction } from "../actions"

interface TemplateDialogProps {
  template: WorkflowTemplate | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

const TEMPLATE_BRAND_ICONS: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  CreditCard,
  Bot,
  Eye,
  Globe,
  Mail,
  Zap,
}

interface GraphBranchTrack {
  handle: string
  label: string
  sublabel?: string
  badgeColor: string
  nodes: StepNodeType[]
}

interface GraphStepItem {
  type: "single"
  node: StepNodeType
  stepNumber: number
}

interface GraphBranchGroup {
  type: "branch_group"
  parentNode: StepNodeType
  stepNumber: number
  branchType: "switch" | "if" | "loop" | "parallel"
  branches: GraphBranchTrack[]
}

type GraphPipelineItem = GraphStepItem | GraphBranchGroup

const ROUTE_COLOR_PALETTE = [
  "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30",
  "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30",
  "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
]

function traceBranchPath(
  startNode: StepNodeType,
  nodeMap: Map<string, StepNodeType>,
  outgoingMap: Map<string, Edge[]>,
  incomingMap: Map<string, Edge[]>,
  visited: Set<string>
): StepNodeType[] {
  const path: StepNodeType[] = []
  let curr: StepNodeType | undefined = startNode

  while (curr && !visited.has(curr.id)) {
    // If this node has multiple incoming edges (e.g. merge node), stop here so it gets rendered as a convergence step
    if ((incomingMap.get(curr.id)?.length ?? 0) > 1 && path.length > 0) {
      break
    }

    visited.add(curr.id)
    path.push(curr)

    const out = outgoingMap.get(curr.id) || []
    if (out.length === 1) {
      const next = nodeMap.get(out[0].target)
      // Check if next node is a convergence node (multiple incoming edges)
      if (next && (incomingMap.get(next.id)?.length ?? 0) > 1) {
        break
      }
      curr = next
    } else {
      break
    }
  }

  return path
}

function buildPipelineHierarchy(
  nodes: StepNodeType[],
  edges: Edge[]
): GraphPipelineItem[] {
  if (!nodes || nodes.length === 0) return []

  const nodeMap = new Map<string, StepNodeType>(nodes.map((n) => [n.id, n]))
  const outgoingMap = new Map<string, Edge[]>()
  const incomingMap = new Map<string, Edge[]>()

  for (const edge of edges) {
    if (!outgoingMap.has(edge.source)) outgoingMap.set(edge.source, [])
    outgoingMap.get(edge.source)!.push(edge)

    if (!incomingMap.has(edge.target)) incomingMap.set(edge.target, [])
    incomingMap.get(edge.target)!.push(edge)
  }

  // Find root node (kind === "trigger" or 0 incoming edges)
  const rootNode =
    nodes.find((n) => n.data?.kind === "trigger") ||
    nodes.find((n) => (incomingMap.get(n.id)?.length ?? 0) === 0) ||
    nodes[0]

  const pipeline: GraphPipelineItem[] = []
  const visited = new Set<string>()

  let current: StepNodeType | undefined = rootNode
  let stepCounter = 1

  while (current && !visited.has(current.id)) {
    visited.add(current.id)
    const outEdges = outgoingMap.get(current.id) || []
    const nodeType = current.data?.type

    if (
      outEdges.length > 1 ||
      nodeType === "switch" ||
      nodeType === "if" ||
      nodeType === "loop"
    ) {
      // Branching node
      const branchTracks: GraphBranchTrack[] = []

      if (nodeType === "loop") {
        for (const edge of outEdges) {
          const targetNode = nodeMap.get(edge.target)
          if (!targetNode) continue

          const isLoopHandle =
            edge.sourceHandle === "loop" || edge.sourceHandle === "body"
          const label = isLoopHandle
            ? "🌿 Loop Body (Processed per item)"
            : "🏁 On Completion (Post-loop summary)"
          const badgeColor = isLoopHandle
            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
            : "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30"

          const branchNodes = traceBranchPath(
            targetNode,
            nodeMap,
            outgoingMap,
            incomingMap,
            visited
          )

          branchTracks.push({
            handle: edge.sourceHandle || (isLoopHandle ? "loop" : "done"),
            label,
            badgeColor,
            nodes: branchNodes.length > 0 ? branchNodes : [targetNode],
          })
        }

        pipeline.push({
          type: "branch_group",
          parentNode: current,
          stepNumber: stepCounter++,
          branchType: "loop",
          branches: branchTracks,
        })
      } else if (nodeType === "switch") {
        let rules: { id?: string; name?: string }[] = []
        try {
          rules = JSON.parse(current.data?.values?.rules || "[]")
        } catch {
          rules = []
        }
        const fallbackName =
          current.data?.values?.fallbackName || "Default Fallback"

        for (const edge of outEdges) {
          const targetNode = nodeMap.get(edge.target)
          if (!targetNode) continue

          let label = "Matched Route"
          let badgeColor = ROUTE_COLOR_PALETTE[0]

          if (edge.sourceHandle === "fallback") {
            label = `Fallback: ${fallbackName}`
            badgeColor = "bg-muted text-muted-foreground border-border"
          } else if (
            edge.sourceHandle !== undefined &&
            edge.sourceHandle !== null
          ) {
            const ruleIdx = parseInt(String(edge.sourceHandle), 10)
            if (!isNaN(ruleIdx) && rules[ruleIdx]) {
              label = `Route: ${rules[ruleIdx].name || `Condition ${ruleIdx + 1}`}`
              badgeColor =
                ROUTE_COLOR_PALETTE[ruleIdx % ROUTE_COLOR_PALETTE.length]
            } else if (String(edge.sourceHandle).startsWith("rule-")) {
              const r = rules.find((item) => item.id === edge.sourceHandle)
              label = `Route: ${r?.name || edge.sourceHandle}`
              badgeColor = ROUTE_COLOR_PALETTE[1]
            }
          }

          const branchNodes = traceBranchPath(
            targetNode,
            nodeMap,
            outgoingMap,
            incomingMap,
            visited
          )

          branchTracks.push({
            handle: edge.sourceHandle || "default",
            label,
            badgeColor,
            nodes: branchNodes.length > 0 ? branchNodes : [targetNode],
          })
        }

        pipeline.push({
          type: "branch_group",
          parentNode: current,
          stepNumber: stepCounter++,
          branchType: "switch",
          branches: branchTracks,
        })
      } else if (nodeType === "if") {
        for (const edge of outEdges) {
          const targetNode = nodeMap.get(edge.target)
          if (!targetNode) continue

          const isTrue = edge.sourceHandle === "true"
          const label = isTrue
            ? "True Branch (Condition Met)"
            : "False Branch (Condition Not Met)"
          const badgeColor = isTrue
            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
            : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"

          const branchNodes = traceBranchPath(
            targetNode,
            nodeMap,
            outgoingMap,
            incomingMap,
            visited
          )

          branchTracks.push({
            handle: edge.sourceHandle || (isTrue ? "true" : "false"),
            label,
            badgeColor,
            nodes: branchNodes.length > 0 ? branchNodes : [targetNode],
          })
        }

        pipeline.push({
          type: "branch_group",
          parentNode: current,
          stepNumber: stepCounter++,
          branchType: "if",
          branches: branchTracks,
        })
      } else {
        // Parallel multi-branch broadcast (e.g. multi-channel announcements or parallel data extraction)
        let chIdx = 0
        for (const edge of outEdges) {
          const targetNode = nodeMap.get(edge.target)
          if (!targetNode) continue

          const targetDef = nodeRegistry[targetNode.data?.type as NodeType]
          const label = `Channel ${chIdx + 1}: ${targetDef?.label || targetNode.data?.type}`
          const badgeColor =
            ROUTE_COLOR_PALETTE[chIdx % ROUTE_COLOR_PALETTE.length]
          chIdx++

          const branchNodes = traceBranchPath(
            targetNode,
            nodeMap,
            outgoingMap,
            incomingMap,
            visited
          )

          branchTracks.push({
            handle: edge.sourceHandle || `ch-${chIdx}`,
            label,
            badgeColor,
            nodes: branchNodes.length > 0 ? branchNodes : [targetNode],
          })
        }

        pipeline.push({
          type: "branch_group",
          parentNode: current,
          stepNumber: stepCounter++,
          branchType: "parallel",
          branches: branchTracks,
        })
      }

      // Check if branches converge to a subsequent node (like a merge node)
      let convergenceNode: StepNodeType | undefined
      for (const node of nodes) {
        if (!visited.has(node.id)) {
          const inCount = incomingMap.get(node.id)?.length ?? 0
          if (inCount > 1) {
            convergenceNode = node
            break
          }
        }
      }

      if (convergenceNode) {
        current = convergenceNode
      } else {
        break
      }
    } else {
      // Linear single step
      pipeline.push({
        type: "single",
        node: current,
        stepNumber: stepCounter++,
      })

      if (outEdges.length === 1) {
        current = nodeMap.get(outEdges[0].target)
      } else {
        current = undefined
      }
    }
  }

  // Add any unvisited nodes if graph had remaining items
  for (const node of nodes) {
    if (!visited.has(node.id)) {
      visited.add(node.id)
      pipeline.push({
        type: "single",
        node,
        stepNumber: stepCounter++,
      })
    }
  }

  return pipeline
}

function formatPreviewDetails(
  nodeType: NodeType,
  values: Record<string, string>
): { label: string; value: string }[] {
  const details: { label: string; value: string }[] = []

  const cleanTokens = (str: string) => {
    return str.replace(/\{\{\s*([a-zA-Z0-9_-]+)\.([^}\s]+)\s*\}\}/g, (_, node, path) => {
      const cleanPath = path.replace(/_/g, " ")
      return `[${cleanPath}]`
    })
  }

  if (nodeType === "stripe-trigger") {
    details.push({
      label: "Event",
      value: values.eventType || "payment_intent.payment_failed",
    })
  } else if (nodeType === "google-form-trigger") {
    details.push({
      label: "Trigger Mode",
      value: "Incoming form response webhook",
    })
  } else if (nodeType === "start") {
    details.push({
      label: "Trigger",
      value: "Manual start or scheduled trigger",
    })
  } else if (nodeType === "if") {
    try {
      const conds = JSON.parse(values.conditions || "[]")
      if (Array.isArray(conds) && conds[0]) {
        const c = conds[0]
        const left = cleanTokens(c.left || "value")
        const op = (c.operator || "equals").replace(/_/g, " ")
        details.push({
          label: "Condition",
          value: `${left} ${op} ${c.right ?? ""}`,
        })
      }
    } catch {
      details.push({ label: "Condition", value: "Branch rule evaluation" })
    }
  } else if (nodeType === "switch") {
    details.push({
      label: "Router Mode",
      value: values.mode === "value_match" ? "Value match" : "Rule-based multi-branch",
    })
    try {
      const rules = JSON.parse(values.rules || "[]")
      if (Array.isArray(rules) && rules.length > 0) {
        details.push({
          label: "Rule Routes",
          value: `${rules.map((r: { name?: string }) => r.name || "Rule").join(" · ")} · Fallback`,
        })
      }
    } catch {
      // ignore
    }
  } else if (nodeType === "open-url") {
    if (values.url) {
      details.push({ label: "URL", value: values.url })
    }
  } else if (nodeType === "extract") {
    if (values.instruction) {
      details.push({ label: "Extraction Goal", value: values.instruction })
    }
  } else if (nodeType === "observe") {
    if (values.instruction) {
      details.push({ label: "Observation Goal", value: values.instruction })
    }
  } else if (nodeType === "act") {
    if (values.instruction) {
      details.push({ label: "Action", value: values.instruction })
    }
  } else if (nodeType === "python-code" || nodeType === "js-code") {
    details.push({
      label: "Runtime Sandbox",
      value: nodeType === "python-code" ? "Python 3.11 (E2B)" : "Node.js (E2B)",
    })
  } else if (nodeType === "send-email") {
    if (values.to) {
      details.push({ label: "To", value: cleanTokens(values.to) })
    }
    if (values.subject) {
      details.push({ label: "Subject", value: values.subject })
    }
  } else if (nodeType === "http-request") {
    details.push({
      label: "Endpoint",
      value: `${values.method || "POST"} ${values.endpoint || ""}`,
    })
  } else if (nodeType === "loop") {
    details.push({
      label: "Loop Mode",
      value:
        values.mode === "count"
          ? `Fixed count (${values.count || "5"} times)`
          : values.mode === "while"
            ? "Conditional while/until loop"
            : "For-each item array",
    })
    if (values.onItemFailure) {
      details.push({
        label: "Error Policy",
        value:
          values.onItemFailure === "halt"
            ? "Halt workflow on error"
            : "Continue on error (isolated)",
      })
    }
  } else if (nodeType === "merge") {
    details.push({
      label: "Merge Mode",
      value:
        values.mode === "array"
          ? "Flatten branches into Array"
          : values.mode === "first"
            ? "Pass-through first active branch"
            : "Combine active branches into Object Map",
    })
    if (values.onBranchFailure) {
      details.push({
        label: "Failure Policy",
        value:
          values.onBranchFailure === "halt"
            ? "Halt workflow if branch fails"
            : "Continue with successful branches",
      })
    }
  } else if (nodeType === "slack" || nodeType === "discord") {
    if (values.username) {
      details.push({ label: "Bot Name", value: values.username })
    }
    if (values.content) {
      details.push({ label: "Message", value: cleanTokens(values.content) })
    }
  }

  return details
}

export function TemplateDialog({
  template,
  open,
  onOpenChange,
}: TemplateDialogProps) {
  const router = useRouter()
  const { isSignedIn, orgId } = useAuth()
  const [isCloning, startCloneTransition] = React.useTransition()

  // Track active template across renders so exit animations complete cleanly
  // When a new non-null template is clicked, it immediately renders fresh data
  const activeTemplateRef = React.useRef<WorkflowTemplate | null>(template)
  if (template) {
    activeTemplateRef.current = template
  }
  const currentTemplate = template ?? activeTemplateRef.current

  const nodes = React.useMemo(
    () => currentTemplate?.graph.nodes ?? [],
    [currentTemplate]
  )
  const edges = React.useMemo(
    () => currentTemplate?.graph.edges ?? [],
    [currentTemplate]
  )

  const pipelineItems = React.useMemo(() => {
    if (!currentTemplate) return []
    return buildPipelineHierarchy(nodes, edges)
  }, [currentTemplate, nodes, edges])

  const categoryMetadata = React.useMemo(() => {
    if (!currentTemplate) return undefined
    return TEMPLATE_CATEGORIES.find((c) => c.id === currentTemplate.category)
  }, [currentTemplate])

  if (!currentTemplate) return null

  const BrandIcon = TEMPLATE_BRAND_ICONS[currentTemplate.icon] || Sparkles

  const handleUseTemplate = () => {
    if (!currentTemplate) return

    if (!isSignedIn) {
      router.push(`/sign-in?redirect_url=/templates?clone=${currentTemplate.id}`)
      return
    }

    if (!orgId) {
      router.push(
        `/choose-organization?redirect_url=/templates?clone=${currentTemplate.id}`
      )
      return
    }

    startCloneTransition(async () => {
      try {
        const result = await cloneWorkflowFromTemplateAction(currentTemplate.id)
        if (result.success && result.workflowId) {
          onOpenChange(false)
          toast.success("Template imported successfully!")
          router.push(`/workflows/${result.workflowId}`)
        }
      } catch (error) {
        Sentry.logger.error("Failed to clone template", {
          "template.id": currentTemplate.id,
          reason: error instanceof Error ? error.message : String(error),
        })
        const message =
          error instanceof Error ? error.message : "Failed to import template"
        toast.error(message)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl lg:max-w-5xl max-h-[90vh] flex flex-col p-0 overflow-hidden rounded-2xl border border-border bg-card dark:bg-[#121214] shadow-2xl duration-200">
        {/* Modal Header */}
        <DialogHeader className="p-5 md:p-6 pb-4 border-b border-border/70 bg-muted/25 shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div
                className={cn(
                  "flex size-12 shrink-0 items-center justify-center rounded-xl shadow-xs",
                  currentTemplate.accent
                )}
              >
                <BrandIcon className="size-6" />
              </div>
              <div className="flex flex-col gap-1 text-left">
                <DialogTitle className="text-lg md:text-xl font-bold tracking-tight text-foreground">
                  {currentTemplate.title}
                </DialogTitle>
                <div className="flex items-center gap-2.5 flex-wrap">
                  {categoryMetadata && (
                    <Badge
                      variant="secondary"
                      className="text-[11px] font-medium bg-muted text-foreground/80 px-2 py-0.5"
                    >
                      {categoryMetadata.label}
                    </Badge>
                  )}
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground font-medium">
                    <Clock className="size-3 text-muted-foreground" />
                    Est. {currentTemplate.estimatedRunTime}
                  </span>
                  <span className="text-muted-foreground text-xs">•</span>
                  <span className="text-xs text-muted-foreground">
                    By {currentTemplate.author.name}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* 2-Column Split Body */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden min-h-0">
          {/* Left Column: Overview & Credentials */}
          <div className="md:col-span-5 border-b md:border-b-0 md:border-r border-border/70 p-5 md:p-6 space-y-6 overflow-y-auto bg-muted/10">
            {/* About this automation */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                About This Automation
              </h4>
              <p className="text-xs md:text-sm text-foreground/90 leading-relaxed">
                {currentTemplate.fullDescription}
              </p>
            </div>

            {/* Key capabilities */}
            {currentTemplate.highlights &&
              currentTemplate.highlights.length > 0 && (
                <div className="space-y-2.5">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Key Capabilities
                  </h4>
                  <div className="flex flex-col gap-2">
                    {currentTemplate.highlights.map((highlight, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2.5 text-xs text-foreground/90 bg-muted/40 border border-border/60 rounded-lg p-2.5"
                      >
                        <CheckCircle2 className="size-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span className="font-medium leading-snug">
                          {highlight}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            {/* Required Integrations */}
            {currentTemplate.requiredIntegrations.length > 0 && (
              <div className="space-y-2.5">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Required Integrations &amp; API Keys
                </h4>
                <div className="flex flex-col gap-2.5">
                  {currentTemplate.requiredIntegrations.map((integration) => (
                    <div
                      key={integration.key}
                      className="flex flex-col gap-1.5 p-3 rounded-xl border border-border/80 bg-background text-xs shadow-2xs"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground">
                            {integration.name}
                          </span>
                          <code className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                            {integration.key}
                          </code>
                        </div>
                        <Badge
                          variant="outline"
                          className="text-[10px] font-normal border-border bg-muted/30 text-muted-foreground"
                        >
                          {integration.optional ? "Optional" : "Required"}
                        </Badge>
                      </div>
                      {integration.description && (
                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                          {integration.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Workflow Step Pipeline Topology */}
          <div
            className="md:col-span-7 p-5 md:p-6 space-y-4 overflow-y-auto bg-background/50 relative"
            style={{
              backgroundImage: "radial-gradient(hsl(var(--foreground) / 0.12) 1px, transparent 1px)",
              backgroundSize: "20px 20px",
            }}
          >
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-emerald-500" />
                <span>Workflow Topology Pipeline</span>
              </h4>
              <span className="text-[11px] font-mono text-muted-foreground font-medium">
                {nodes.length} Steps · {edges.length} Connections
              </span>
            </div>

            <div className="flex flex-col gap-3">
              {pipelineItems.map((item, idx) => {
                if (item.type === "single") {
                  const nodeType = item.node.data?.type as NodeType
                  const def = nodeRegistry[nodeType]
                  const title = item.node.data?.title || def?.label || "Step"
                  const values = item.node.data?.values || {}
                  const details = formatPreviewDetails(nodeType, values)

                  return (
                    <React.Fragment key={item.node.id}>
                      {/* Step Card with Handles */}
                      <div className="relative flex flex-col gap-2 p-3.5 rounded-xl bg-card/90 dark:bg-[#161619] backdrop-blur-xs border border-border/80 shadow-xs group select-none">
                        {/* Step Handle Notches */}
                        <div
                          style={{
                            position: "absolute",
                            left: 0,
                            top: "50%",
                            transform: "translate(-100%, -50%)",
                          }}
                          className="w-1.5 h-3 rounded-l-xs bg-border group-hover:bg-blue-500 transition-colors"
                        />
                        <div
                          style={{
                            position: "absolute",
                            right: 0,
                            top: "50%",
                            transform: "translate(100%, -50%)",
                          }}
                          className="w-1.5 h-3 rounded-r-xs bg-border group-hover:bg-blue-500 transition-colors"
                        />

                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-bold text-muted-foreground font-mono">
                              {item.stepNumber}
                            </span>
                            <NodeIcon type={nodeType} className="size-6 shrink-0" />
                            <span className="text-xs md:text-sm font-semibold text-foreground truncate">
                              {title}
                            </span>
                          </div>

                          <Badge
                            variant="secondary"
                            className="text-[10px] font-medium shrink-0 bg-muted text-muted-foreground font-mono"
                          >
                            {def?.label || nodeType}
                          </Badge>
                        </div>

                        {details.length > 0 && (
                          <div className="grid grid-cols-1 gap-1 pl-8 text-[11px] font-mono">
                            {details.map((d, dIdx) => (
                              <div key={dIdx} className="flex items-baseline gap-2">
                                <span className="text-muted-foreground font-medium shrink-0 min-w-[75px]">
                                  {d.label}:
                                </span>
                                <span className="text-foreground/90 break-all line-clamp-2">
                                  {d.value}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Downward connector */}
                      {idx < pipelineItems.length - 1 && (
                        <div className="flex items-center justify-center py-0.5">
                          <div className="flex items-center justify-center size-5 rounded-full bg-card text-muted-foreground border border-border/80 shadow-2xs">
                            <ArrowDown className="size-3 text-blue-500" />
                          </div>
                        </div>
                      )}
                    </React.Fragment>
                  )
                }

                // Branch Group (Switch / If / Parallel)
                const parentType = item.parentNode.data?.type as NodeType
                const parentDef = nodeRegistry[parentType]
                const parentTitle =
                  item.parentNode.data?.title || parentDef?.label || "Router"
                const parentValues = item.parentNode.data?.values || {}
                const parentDetails = formatPreviewDetails(parentType, parentValues)

                return (
                  <React.Fragment key={item.parentNode.id}>
                    {/* Branching Router Step Card */}
                    <div className="flex flex-col gap-2 p-3.5 rounded-xl bg-card border border-primary/30 shadow-2xs">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary text-xs font-bold font-mono">
                            {item.stepNumber}
                          </span>
                          <NodeIcon type={parentType} className="size-6 shrink-0" />
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-xs md:text-sm font-semibold text-foreground truncate">
                              {parentTitle}
                            </span>
                            <Badge
                              variant="outline"
                              className="text-[10px] font-medium border-primary/40 bg-primary/10 text-primary gap-1 px-1.5 py-0"
                            >
                              <Split className="size-2.5" />
                              {item.branches.length} Routes
                            </Badge>
                          </div>
                        </div>

                        <Badge
                          variant="secondary"
                          className="text-[10px] font-medium shrink-0 bg-muted text-muted-foreground"
                        >
                          {parentDef?.label || parentType}
                        </Badge>
                      </div>

                      {parentDetails.length > 0 && (
                        <div className="grid grid-cols-1 gap-1 pl-8 text-[11px]">
                          {parentDetails.map((d, dIdx) => (
                            <div key={dIdx} className="flex items-baseline gap-2">
                              <span className="text-muted-foreground font-medium shrink-0 min-w-[75px]">
                                {d.label}:
                              </span>
                              <span className="text-foreground/90 font-mono break-all line-clamp-2">
                                {d.value}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Multi-Branch Visual Container */}
                    <div className="relative pl-3 md:pl-4 border-l-2 border-dashed border-border/80 my-1 space-y-3">
                      <div className="flex items-center gap-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider pl-1">
                        <GitFork className="size-3.5 text-primary" />
                        <span>
                          {item.branchType === "switch"
                            ? "Alternative Conditional Routes"
                            : item.branchType === "if"
                              ? "Conditional Decision Branches"
                              : item.branchType === "loop"
                                ? "Iterative Loop Processor Tracks"
                                : "Simultaneous Multi-Channel Broadcasts"}
                        </span>
                      </div>

                      {/* Render Each Branch Route Track */}
                      <div className="flex flex-col gap-2.5">
                        {item.branches.map((branch, bIdx) => (
                          <div
                            key={bIdx}
                            className="flex flex-col gap-2 p-3 rounded-xl border border-border/80 bg-muted/25"
                          >
                            {/* Branch Route Header Badge */}
                            <div className="flex items-center justify-between gap-2">
                              <Badge
                                variant="outline"
                                className={cn(
                                  "text-[10px] font-semibold px-2 py-0.5 border",
                                  branch.badgeColor
                                )}
                              >
                                {branch.label}
                              </Badge>
                              <span className="text-[10px] font-mono text-muted-foreground">
                                Route #{bIdx + 1}
                              </span>
                            </div>

                            {/* Downstream Nodes for this Route */}
                            <div className="flex flex-col gap-2 pl-1">
                              {branch.nodes.map((bNode) => {
                                const bType = bNode.data?.type as NodeType
                                const bDef = nodeRegistry[bType]
                                const bTitle =
                                  bNode.data?.title || bDef?.label || "Action"
                                const bValues = bNode.data?.values || {}
                                const bDetails = formatPreviewDetails(
                                  bType,
                                  bValues
                                )

                                return (
                                  <div
                                    key={bNode.id}
                                    className="flex flex-col gap-1.5 p-2.5 rounded-lg bg-card border border-border/70 text-xs shadow-2xs"
                                  >
                                    <div className="flex items-center justify-between gap-2">
                                      <div className="flex items-center gap-2 min-w-0">
                                        <NodeIcon
                                          type={bType}
                                          className="size-5 shrink-0"
                                        />
                                        <span className="font-semibold text-foreground truncate">
                                          {bTitle}
                                        </span>
                                      </div>
                                      <Badge
                                        variant="secondary"
                                        className="text-[9px] font-normal px-1.5 py-0"
                                      >
                                        {bDef?.label || bType}
                                      </Badge>
                                    </div>

                                    {bDetails.length > 0 && (
                                      <div className="grid grid-cols-1 gap-0.5 pl-7 text-[10px]">
                                        {bDetails.map((bd, bdIdx) => (
                                          <div
                                            key={bdIdx}
                                            className="flex items-baseline gap-1.5"
                                          >
                                            <span className="text-muted-foreground font-medium shrink-0">
                                              {bd.label}:
                                            </span>
                                            <span className="text-foreground/90 font-mono break-all line-clamp-1">
                                              {bd.value}
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </React.Fragment>
                )
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer with Clean Spacing & Non-Sticking Margins */}
        <div className="flex flex-row items-center justify-between gap-3 p-4 px-6 border-t border-border/70 bg-muted/20 shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isCloning}
            className="h-9 px-4 text-xs cursor-pointer"
          >
            Cancel
          </Button>

          <Button
            type="button"
            onClick={handleUseTemplate}
            disabled={isCloning}
            className="h-9 px-5 text-xs font-semibold gap-1.5 cursor-pointer shadow-xs"
          >
            {isCloning ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                <span>Importing Workflow...</span>
              </>
            ) : (
              <>
                <span>Use This Template</span>
                <ArrowRight className="size-4" />
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
