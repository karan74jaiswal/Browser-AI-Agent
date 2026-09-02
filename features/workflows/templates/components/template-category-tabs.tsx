"use client"

import * as React from "react"
import {
  Bot,
  ClipboardList,
  CreditCard,
  Eye,
  LayoutGrid,
  Mail,
  Search,
  X,
} from "lucide-react"

import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
  TEMPLATE_CATEGORIES,
  type TemplateCategory,
  type WorkflowTemplate,
} from "../types"

interface TemplateCategoryTabsProps {
  selectedCategory: TemplateCategory | "all"
  onSelectCategory: (category: TemplateCategory | "all") => void
  searchQuery: string
  onSearchChange: (query: string) => void
  templates: WorkflowTemplate[]
}

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutGrid,
  CreditCard,
  Bot,
  ClipboardList,
  Mail,
  Eye,
}

export function TemplateCategoryTabs({
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  templates,
}: TemplateCategoryTabsProps) {
  const getCategoryCount = (categoryId: TemplateCategory | "all") => {
    if (categoryId === "all") return templates.length
    return templates.filter((t) => t.category === categoryId).length
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Search Input Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <Input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search templates by name, integration, or keyword..."
            className="pl-9 pr-8 h-9 text-sm bg-background border-border/80 focus-visible:border-ring"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted"
              title="Clear search"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        <div className="text-xs text-muted-foreground font-medium self-end sm:self-center">
          Showing {templates.length} {templates.length === 1 ? "template" : "templates"}
        </div>
      </div>

      {/* Category Pills Scrolling Row */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {TEMPLATE_CATEGORIES.map((cat) => {
          const Icon = CATEGORY_ICONS[cat.iconName] || LayoutGrid
          const isSelected = selectedCategory === cat.id
          const count = getCategoryCount(cat.id)

          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onSelectCategory(cat.id)}
              className={cn(
                "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap border shrink-0",
                isSelected
                  ? "bg-primary text-primary-foreground border-primary shadow-xs"
                  : "bg-card text-muted-foreground border-border/80 hover:bg-accent/80 hover:text-foreground"
              )}
            >
              <Icon className="size-3.5" />
              <span>{cat.label}</span>
              <Badge
                variant="secondary"
                className={cn(
                  "h-4 px-1.5 text-[10px] font-mono leading-none rounded-full",
                  isSelected
                    ? "bg-primary-foreground/20 text-primary-foreground border-transparent"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {count}
              </Badge>
            </button>
          )
        })}
      </div>
    </div>
  )
}
