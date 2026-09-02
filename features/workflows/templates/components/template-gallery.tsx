"use client"

import * as React from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Sparkles, Workflow } from "lucide-react"

import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Button } from "@/components/ui/button"
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
    <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto p-6 md:p-10">
      {/* Header Banner */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-primary font-medium text-xs tracking-wide uppercase">
          <Sparkles className="size-4" />
          <span>Pre-Built Workflows</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Workflow Templates Registry
        </h1>
        <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
          Production-ready automation workflows crafted for instant deployment. Explore pre-wired topologies, inspect integration credentials, and 1-click clone directly into your workspace.
        </p>
      </div>

      {/* Category Tabs & Search Bar */}
      <TemplateCategoryTabs
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        templates={WORKFLOW_TEMPLATES}
      />

      {/* Templates Grid */}
      {filteredTemplates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTemplates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onPreview={handleOpenPreview}
            />
          ))}
        </div>
      ) : (
        <div className="flex min-h-[300px] items-center justify-center p-8 rounded-2xl border border-dashed border-border">
          <Empty className="max-w-md">
            <EmptyHeader>
              <EmptyMedia
                variant="icon"
                className="mb-3 size-12 rounded-xl bg-muted/80 text-foreground shadow-xs"
              >
                <Workflow className="size-5" />
              </EmptyMedia>
              <EmptyTitle className="text-base font-semibold text-foreground">
                No matching templates found
              </EmptyTitle>
              <EmptyDescription className="max-w-xs text-sm text-muted-foreground">
                Try adjusting your search keywords or switching category filters.
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
                className="text-xs"
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
