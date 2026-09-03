"use client"

import * as React from "react"
import { useSearchParams, useRouter } from "next/navigation"
import {
  CheckCircle2,
  Cpu,
  Database,
  Layers,
  Sparkles,
  Workflow,
  Zap,
} from "lucide-react"

import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { WORKFLOW_TEMPLATES } from "../registry"
import type { TemplateCategory, WorkflowTemplate } from "../types"
import { TemplateCategoryTabs } from "./template-category-tabs"
import { TemplateCard } from "./template-card"
import { TemplateDialog } from "./template-dialog"

interface TemplateGalleryProps {
  initialTemplateId?: string
  initialCategory?: TemplateCategory | "all"
}

export function TemplateGallery({
  initialTemplateId,
  initialCategory = "all",
}: TemplateGalleryProps) {
  const searchParams = useSearchParams()
  const router = useRouter()

  const urlTemplateId =
    searchParams?.get("templateId") ||
    searchParams?.get("clone") ||
    initialTemplateId

  const initialFoundTemplate = React.useMemo(() => {
    if (!urlTemplateId) return null
    return WORKFLOW_TEMPLATES.find((t) => t.id === urlTemplateId) ?? null
  }, [urlTemplateId])

  const [selectedCategory, setSelectedCategory] = React.useState<
    TemplateCategory | "all"
  >(initialCategory)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [previewTemplate, setPreviewTemplate] =
    React.useState<WorkflowTemplate | null>(initialFoundTemplate)
  const [isDialogOpen, setIsDialogOpen] = React.useState(
    Boolean(initialFoundTemplate)
  )

  React.useEffect(() => {
    if (initialFoundTemplate) {
      setPreviewTemplate(initialFoundTemplate)
      setIsDialogOpen(true)
    }
  }, [initialFoundTemplate])

  const handleOpenPreview = (template: WorkflowTemplate) => {
    setPreviewTemplate(template)
    setIsDialogOpen(true)
  }

  const handleDialogChange = (open: boolean) => {
    setIsDialogOpen(open)
    if (!open) {
      // Clean up search params if needed
      if (searchParams?.get("templateId") || searchParams?.get("clone")) {
        router.replace("/templates")
      }
    }
  }

  const filteredTemplates = React.useMemo(() => {
    return WORKFLOW_TEMPLATES.filter((template) => {
      const matchesCategory =
        selectedCategory === "all" || template.category === selectedCategory

      if (!matchesCategory) return false

      if (!searchQuery.trim()) return true

      const q = searchQuery.toLowerCase().trim()
      const titleMatch = template.title.toLowerCase().includes(q)
      const descMatch =
        template.shortDescription.toLowerCase().includes(q) ||
        template.fullDescription.toLowerCase().includes(q)
      const integrationMatch = template.requiredIntegrations.some((i) =>
        i.name.toLowerCase().includes(q) || i.key.toLowerCase().includes(q)
      )
      const highlightMatch =
        template.highlights?.some((h) => h.toLowerCase().includes(q)) ?? false

      return titleMatch || descMatch || integrationMatch || highlightMatch
    })
  }, [selectedCategory, searchQuery])

  return (
    <div className="relative flex flex-col gap-8 w-full max-w-7xl mx-auto p-6 md:p-10">
      {/* Studio Canvas Ambient Header */}
      <div className="flex flex-col gap-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground w-fit shadow-xs">
          <span className="flex size-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Studio Blueprints · Production-Ready Topologies</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
          Workflow Templates Registry
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground max-w-3xl leading-relaxed">
          Production-ready automation workflows crafted for instant deployment. Explore pre-wired topologies,
          inspect integration credentials, and 1-click clone directly into your studio workspace.
        </p>

        {/* Blueprint Telemetry Quick-Bar */}
        <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-xl border border-border/80 bg-card/60 dark:bg-[#141417] text-xs font-mono">
            <span className="text-muted-foreground text-[10px] block uppercase">Catalog</span>
            <span className="text-sm font-bold text-foreground">20+ Production DAGs</span>
          </div>
          <div className="p-3 rounded-xl border border-border/80 bg-card/60 dark:bg-[#141417] text-xs font-mono">
            <span className="text-muted-foreground text-[10px] block uppercase">Execution</span>
            <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">Trigger.dev Durable</span>
          </div>
          <div className="p-3 rounded-xl border border-border/80 bg-card/60 dark:bg-[#141417] text-xs font-mono">
            <span className="text-muted-foreground text-[10px] block uppercase">Security</span>
            <span className="text-sm font-bold text-foreground">AES-256 Vault Pre-Wired</span>
          </div>
          <div className="p-3 rounded-xl border border-border/80 bg-card/60 dark:bg-[#141417] text-xs font-mono">
            <span className="text-muted-foreground text-[10px] block uppercase">Deployment</span>
            <span className="text-sm font-bold text-blue-600 dark:text-blue-400">1-Click Studio Clone</span>
          </div>
        </div>
      </div>

      {/* Category Tabs & Search Bar */}
      <TemplateCategoryTabs
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        templates={WORKFLOW_TEMPLATES}
      />

      {/* Templates Grid (Visual DAG Blueprint Cards) */}
      {filteredTemplates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onPreview={handleOpenPreview}
            />
          ))}
        </div>
      ) : (
        <div className="flex min-h-[300px] items-center justify-center p-8 rounded-2xl border border-dashed border-border bg-muted/10">
          <Empty className="max-w-md text-center">
            <EmptyHeader>
              <EmptyMedia
                variant="icon"
                className="mb-3 size-12 rounded-xl bg-card border border-border text-foreground shadow-xs mx-auto flex items-center justify-center"
              >
                <Workflow className="size-5 text-blue-500" />
              </EmptyMedia>
              <EmptyTitle className="text-base font-semibold text-foreground">
                No matching blueprints found
              </EmptyTitle>
              <EmptyDescription className="max-w-xs text-xs sm:text-sm text-muted-foreground mx-auto">
                Try adjusting your search query or switching to another category.
              </EmptyDescription>
            </EmptyHeader>
            <div className="mt-4 flex justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedCategory("all")
                  setSearchQuery("")
                }}
                className="text-xs font-mono cursor-pointer"
              >
                Reset Filters
              </Button>
            </div>
          </Empty>
        </div>
      )}

      {/* Template Preview Modal */}
      <TemplateDialog
        template={previewTemplate}
        open={isDialogOpen}
        onOpenChange={handleDialogChange}
      />
    </div>
  )
}
