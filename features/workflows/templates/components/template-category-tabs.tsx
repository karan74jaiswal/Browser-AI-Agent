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
  SlidersHorizontal,
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
    <div className="flex flex-col gap-4 select-none">
      {/* Search Input Bar with Studio Canvas Styling */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <Input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search blueprints by name, node type, or integration..."
            className="pl-9 pr-14 h-9 text-xs sm:text-sm bg-card border-border/80 focus-visible:ring-primary/20 dark:bg-[#141417] shadow-xs"
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted"
              title="Clear search"
            >
              <X className="size-3.5" />
            </button>
          ) : (
            <span className="hidden sm:inline-flex absolute right-2.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground rounded bg-muted/60 border border-border/60">
              ⌘K
            </span>
          )}
        </div>

        <div className="text-xs text-muted-foreground font-mono self-end sm:self-center flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-emerald-500" />
          <span>{templates.length} Production Blueprints</span>
        </div>
      </div>

      {/* Category Pills Scrolling Row (Matching Studio Pill Filters) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
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
                "inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap border shrink-0 cursor-pointer shadow-2xs",
                isSelected
                  ? "bg-primary text-primary-foreground border-primary shadow-xs font-semibold"
                  : "bg-card text-muted-foreground border-border/80 hover:bg-muted hover:text-foreground dark:bg-[#141417]"
              )}
            >
              <Icon className="size-3.5" />
              <span>{cat.label}</span>
              <span
                className={cn(
                  "px-1.5 py-0.2 rounded-full text-[10px] font-mono leading-tight",
                  isSelected
                    ? "bg-primary-foreground/20 text-primary-foreground font-bold"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {count}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
