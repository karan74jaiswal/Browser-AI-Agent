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
  Zap,
} from "lucide-react"
import { toast } from "sonner"
import * as Sentry from "@sentry/nextjs"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { nodeRegistry, type NodeType } from "@/features/workflows/nodes/node-registry"
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
    <Card
      onClick={() => onPreview(template)}
      className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border-border/80 bg-card hover:border-border hover:shadow-md transition-all duration-200 cursor-pointer"
    >
      <CardHeader className="p-5 pb-3">
        <div className="flex items-start justify-between gap-3">
          {/* Branded Icon Chip */}
          <div
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-xl shadow-xs transition-transform group-hover:scale-105 duration-200",
              template.accent
            )}
          >
            <BrandIcon className="size-5" />
          </div>

          {/* Badges: Estimated time */}
          <div className="flex items-center gap-1.5 flex-wrap justify-end">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-muted text-muted-foreground">
              <Clock className="size-3" />
              {template.estimatedRunTime}
            </span>
          </div>
        </div>

        {/* Title and Short Description */}
        <div className="mt-3.5 flex flex-col gap-1.5">
          <h3 className="text-base font-semibold tracking-tight text-foreground line-clamp-1 group-hover:text-primary transition-colors">
            {template.title}
          </h3>
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {template.shortDescription}
          </p>
        </div>
      </CardHeader>

      <CardContent className="p-5 py-2 flex flex-col gap-3.5">
        {/* Step Flow Preview Pipeline */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground">
            Workflow Pipeline ({nodes.length} steps)
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
                          className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted/60 border border-border/60 text-[11px] font-medium text-foreground shrink-0 max-w-[130px]"
                        >
                          <NodeIcon type={nodeType} className="size-4 shrink-0" />
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
                    className="size-4 shrink-0"
                  />
                  <span className="truncate">
                    {branchRouterNode.data?.title || "Router"}
                  </span>
                </div>

                <ChevronRight className="size-3 text-muted-foreground/60 shrink-0" />

                {/* The Branch Count Badge */}
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
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted/60 border border-border/60 text-[11px] font-medium text-foreground shrink-0 max-w-[130px]">
                  <NodeIcon type="start" className="size-4 shrink-0" />
                  <span className="truncate">Start</span>
                </div>
                <ChevronRight className="size-3 text-muted-foreground/60 shrink-0" />
                <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-muted border border-border text-[11px] font-medium text-foreground shrink-0">
                  <Split className="size-3 text-primary" />
                  <span>Parallel Streams</span>
                </div>
                <ChevronRight className="size-3 text-muted-foreground/60 shrink-0" />
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-primary/10 border border-primary/30 text-[11px] font-semibold text-primary shrink-0 max-w-[140px]">
                  <NodeIcon type="merge" className="size-4 shrink-0" />
                  <span className="truncate">
                    {mergeNode.data?.title || "Merge"}
                  </span>
                </div>
                <ChevronRight className="size-3 text-muted-foreground/60 shrink-0" />
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted/60 border border-border/60 text-[11px] font-medium text-foreground shrink-0 max-w-[130px]">
                  <NodeIcon type="send-email" className="size-4 shrink-0" />
                  <span className="truncate">Send Digest</span>
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
                      className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted/60 border border-border/60 text-[11px] font-medium text-foreground shrink-0 max-w-[140px]"
                    >
                      <NodeIcon type={nodeType} className="size-4 shrink-0" />
                      <span className="truncate">{nodeTitle}</span>
                    </div>
                  </React.Fragment>
                )
              })
            )}

            {!branchRouterNode && !mergeNode && nodes.length > 4 && (
              <div className="flex items-center justify-center px-2 py-1 rounded-md bg-muted text-[10px] font-semibold text-muted-foreground shrink-0">
                +{nodes.length - 4} more
              </div>
            )}
          </div>
        </div>

        {/* Required Integrations Badges */}
        {template.requiredIntegrations.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap pt-1">
            <span className="text-[10px] text-muted-foreground font-medium mr-1 flex items-center gap-1">
              <KeyRound className="size-2.5" />
              Requires:
            </span>
            {template.requiredIntegrations.map((integration) => (
              <Badge
                key={integration.key}
                variant="outline"
                className="text-[10px] px-1.5 py-0.5 font-normal rounded-md border border-border/80 bg-muted/30 text-foreground"
              >
                {integration.name}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>

      <CardFooter className="p-4 px-5 border-t border-border/60 flex items-center justify-between gap-2 bg-muted/20 mt-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            onPreview(template)
          }}
          className="h-8 px-3 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/80 cursor-pointer"
        >
          Preview
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
              <span>Use Template</span>
              <ArrowRight className="size-3.5" />
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
