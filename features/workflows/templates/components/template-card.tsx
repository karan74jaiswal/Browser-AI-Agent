"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@clerk/nextjs"
import {
  ArrowRight,
  Bot,
  ChevronRight,
  Clock,
  CreditCard,
  Eye,
  Globe,
  KeyRound,
  Loader2,
  Mail,
  Sparkles,
  Split,
  Workflow,
  Zap,
} from "lucide-react"
import { toast } from "sonner"
import * as Sentry from "@sentry/nextjs"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { nodeRegistry, type NodeType } from "@/features/workflows/system"
import { NodeIcon } from "@/features/workflows/components/node-icon"
import type { WorkflowTemplate } from "../types"
import { cloneWorkflowFromTemplateAction } from "../actions"

interface TemplateCardProps {
  template: WorkflowTemplate
  onPreview: (template: WorkflowTemplate) => void
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

export function TemplateCard({ template, onPreview }: TemplateCardProps) {
  const router = useRouter()
  const { isSignedIn, orgId } = useAuth()
  const [isCloning, startCloneTransition] = React.useTransition()

  const BrandIcon = TEMPLATE_BRAND_ICONS[template.icon] || Sparkles

  const handleUseTemplate = (e: React.MouseEvent) => {
    e.stopPropagation()

    if (!isSignedIn) {
      router.push(`/sign-in?redirect_url=/templates?clone=${template.id}`)
      return
    }

    if (!orgId) {
      router.push(`/choose-organization?redirect_url=/templates?clone=${template.id}`)
      return
    }

    startCloneTransition(async () => {
      try {
        const result = await cloneWorkflowFromTemplateAction(template.id)
        if (result.success && result.workflowId) {
          toast.success("Template imported successfully!")
          router.push(`/workflows/${result.workflowId}`)
        }
      } catch (error) {
        Sentry.logger.error("Failed to clone template", {
          "template.id": template.id,
          reason: error instanceof Error ? error.message : String(error),
        })
        const message =
          error instanceof Error ? error.message : "Failed to import template"
        toast.error(message)
      }
    })
  }

  const nodes = template.graph.nodes ?? []
  const edges = template.graph.edges ?? []

  // Check if graph has branching router (switch / if / loop / parallel fork)
  const branchRouterNode = nodes.find(
    (n) =>
      n.data?.type === "switch" ||
      n.data?.type === "if" ||
      n.data?.type === "loop"
  )
  const mergeNode = nodes.find((n) => n.data?.type === "merge")
  const outgoingBranches = branchRouterNode
    ? edges.filter((e) => e.source === branchRouterNode.id).length
    : 0

  return (
    <div
      onClick={() => onPreview(template)}
      className="group relative flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-5 shadow-xs transition-all duration-200 hover:border-primary/50 hover:shadow-xl dark:bg-[#141417] cursor-pointer select-none"
    >
      {/* Studio Canvas Node Handles (Left Target & Right Source) */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: "42px",
          transform: "translate(-100%, -50%)",
        }}
        className="w-1.5 h-3.5 rounded-l-xs bg-border group-hover:bg-blue-500 transition-colors"
      />
      <div
        style={{
          position: "absolute",
          right: 0,
          top: "42px",
          transform: "translate(100%, -50%)",
        }}
        className="w-1.5 h-3.5 rounded-r-xs bg-border group-hover:bg-blue-500 transition-colors"
      />

      <div>
        {/* Card Header with Branded Squircle Icon & Time */}
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-border/60">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex size-10 shrink-0 items-center justify-center rounded-xl shadow-xs transition-transform group-hover:scale-105 duration-200",
                template.accent
              )}
            >
              <BrandIcon className="size-5" />
            </div>

            <div>
              <h3 className="text-sm sm:text-base font-bold tracking-tight text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                {template.title}
              </h3>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                <span className="inline-flex items-center gap-1 font-mono text-[11px]">
                  <Clock className="size-3" />
                  {template.estimatedRunTime}
                </span>
                <span>•</span>
                <span className="font-mono text-[11px] text-muted-foreground">
                  {nodes.length} nodes
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Short Description */}
        <p className="mt-3 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
          {template.shortDescription}
        </p>

        {/* Step Flow Pipeline (Visual DAG Sequence) */}
        <div className="mt-4 p-2.5 rounded-xl border border-border/80 bg-muted/20 dark:bg-[#1a1a1d] space-y-1.5">
          <span className="text-[10px] uppercase font-mono font-semibold tracking-wider text-muted-foreground block">
            Pipeline Sequence
          </span>
          <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none">
            {branchRouterNode && outgoingBranches > 1 ? (
              // Branched workflow summary preview
              <div className="flex items-center gap-1.5">
                {nodes
                  .filter(
                    (n) =>
                      n.id !== branchRouterNode.id &&
                      !edges.some(
                        (e) =>
                          e.source === branchRouterNode.id && e.target === n.id
                      )
                  )
                  .map((node) => {
                    const nodeType = node.data?.type as NodeType
                    const nodeTitle =
                      node.data?.title || nodeRegistry[nodeType]?.label || "Step"
                    return (
                      <React.Fragment key={node.id}>
                        <div
                          title={nodeTitle}
                          className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-card border border-border/80 text-[11px] font-medium text-foreground shrink-0 max-w-[130px] shadow-2xs"
                        >
                          <NodeIcon type={nodeType} className="size-3.5 shrink-0" />
                          <span className="truncate">{nodeTitle}</span>
                        </div>
                        <ChevronRight className="size-3 text-muted-foreground/60 shrink-0" />
                      </React.Fragment>
                    )
                  })}

                {/* The Router Node */}
                <div
                  title={branchRouterNode.data?.title || "Router"}
                  className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-primary/10 border border-primary/30 text-[11px] font-semibold text-primary shrink-0 max-w-[140px]"
                >
                  <NodeIcon
                    type={branchRouterNode.data?.type as NodeType}
                    className="size-3.5 shrink-0"
                  />
                  <span className="truncate">
                    {branchRouterNode.data?.title || "Router"}
                  </span>
                </div>

                <ChevronRight className="size-3 text-muted-foreground/60 shrink-0" />

                {/* Branch Count Badge */}
                <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-muted border border-border text-[11px] font-medium text-foreground shrink-0">
                  <Split className="size-3 text-primary" />
                  <span>
                    {branchRouterNode.data?.type === "loop"
                      ? "2 Tracks"
                      : `${outgoingBranches} Routes`}
                  </span>
                </div>
              </div>
            ) : mergeNode ? (
              // Multi-branch convergence with merge preview
              <div className="flex items-center gap-1.5">
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-card border border-border/80 text-[11px] font-medium text-foreground shrink-0 max-w-[130px] shadow-2xs">
                  <NodeIcon type="start" className="size-3.5 shrink-0" />
                  <span className="truncate">Start</span>
                </div>
                <ChevronRight className="size-3 text-muted-foreground/60 shrink-0" />
                <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-muted border border-border text-[11px] font-medium text-foreground shrink-0">
                  <Split className="size-3 text-primary" />
                  <span>Parallel</span>
                </div>
                <ChevronRight className="size-3 text-muted-foreground/60 shrink-0" />
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-primary/10 border border-primary/30 text-[11px] font-semibold text-primary shrink-0 max-w-[140px]">
                  <NodeIcon type="merge" className="size-3.5 shrink-0" />
                  <span className="truncate">
                    {mergeNode.data?.title || "Merge"}
                  </span>
                </div>
              </div>
            ) : (
              // Linear workflow sequence preview
              nodes.slice(0, 4).map((node, index) => {
                const nodeType = node.data?.type as NodeType
                const nodeTitle =
                  node.data?.title || nodeRegistry[nodeType]?.label || "Step"

                return (
                  <React.Fragment key={node.id}>
                    {index > 0 && (
                      <ChevronRight className="size-3 text-muted-foreground/60 shrink-0" />
                    )}
                    <div
                      title={nodeTitle}
                      className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-card border border-border/80 text-[11px] font-medium text-foreground shrink-0 max-w-[140px] shadow-2xs"
                    >
                      <NodeIcon type={nodeType} className="size-3.5 shrink-0" />
                      <span className="truncate">{nodeTitle}</span>
                    </div>
                  </React.Fragment>
                )
              })
            )}

            {!branchRouterNode && !mergeNode && nodes.length > 4 && (
              <div className="flex items-center justify-center px-2 py-1 rounded-md bg-muted text-[10px] font-mono font-semibold text-muted-foreground shrink-0">
                +{nodes.length - 4} more
              </div>
            )}
          </div>
        </div>

        {/* Required Integrations Chips */}
        {template.requiredIntegrations.length > 0 && (
          <div className="mt-3 flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] text-muted-foreground font-mono flex items-center gap-1">
              <KeyRound className="size-2.5" />
              Requires:
            </span>
            {template.requiredIntegrations.map((integration) => (
              <span
                key={integration.key}
                className="text-[10px] font-mono px-2 py-0.5 rounded-md border border-border/80 bg-muted/40 text-foreground"
              >
                {integration.name}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Card Footer with Token Reference & Action Buttons */}
      <div className="mt-5 pt-3.5 border-t border-border/80 flex flex-col gap-2.5">
        <div className="flex items-center justify-between gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              onPreview(template)
            }}
            className="h-8 px-3 text-xs text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
          >
            Inspect Topology
          </Button>

          <Button
            type="button"
            size="sm"
            disabled={isCloning}
            onClick={handleUseTemplate}
            className="h-8 px-3.5 text-xs font-semibold gap-1.5 cursor-pointer shadow-xs"
          >
            {isCloning ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                <span>Importing...</span>
              </>
            ) : (
              <>
                <span>Clone Blueprint</span>
                <ArrowRight className="size-3.5" />
              </>
            )}
          </Button>
        </div>

        <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground/80 pt-1">
          <span>Blueprint ID</span>
          <span className="text-foreground dark:text-zinc-400">
            {template.id}
          </span>
        </div>
      </div>
    </div>
  )
}
