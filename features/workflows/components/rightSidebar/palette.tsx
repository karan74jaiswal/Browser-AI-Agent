"use client"

import { useState, useMemo, useEffect } from "react"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useReactFlow, useStoreApi } from "@xyflow/react"
import { useStatus } from "@liveblocks/react"
import Section from "./section"
import { ChevronLeft, ChevronRight, Lock, Search, X } from "lucide-react"
import { toast } from "sonner"
import { useProPlan } from "../../hooks"
import { NodeIcon } from "../node-icon"
import {
  paletteSuitesMetadata,
  paletteCategoriesMetadata,
  loadPaletteNodeGroup,
  loadAllSearchNodes,
  type LoadedNodeGroup,
  type SearchNodeItem,
} from "@/features/workflows/system/catalog-metadata"
import type {
  StepNodeType,
  NodeType,
  NodeField,
  WorkflowNodeModule,
} from "@/features/workflows/system"

type PaletteNav =
  | { level: "suites" }
  | { level: "suite"; suiteId: string }
  | { level: "category"; suiteId: string; categoryId: string }

export function PaletteSkeleton() {
  return (
    <Section title="Toolbar">
      <div className="space-y-3 px-3 py-3 animate-pulse">
        <div className="h-7 w-full rounded bg-muted" />
        <div className="space-y-2 pt-1">
          <div className="h-10 w-full rounded bg-muted/60" />
          <div className="h-10 w-full rounded bg-muted/60" />
          <div className="h-10 w-full rounded bg-muted/60" />
        </div>
      </div>
    </Section>
  )
}

export default function Palette() {
  const status = useStatus()
  const isConnected = status === "connected"

  const { getNodes, getViewport, addNodes } = useReactFlow<StepNodeType>()
  const store = useStoreApi()
  const { isNodeLocked, redirectToPricing } = useProPlan()

  const [nav, setNav] = useState<PaletteNav>({ level: "suites" })
  const [searchQuery, setSearchQuery] = useState("")

  // On-demand loaded nodes for the active Suite or Category
  const [loadedGroup, setLoadedGroup] = useState<LoadedNodeGroup | null>(null)
  const [isLoadingGroup, setIsLoadingGroup] = useState(false)

  // Lazy search index for root search
  const [searchIndex, setSearchIndex] = useState<SearchNodeItem[] | null>(null)

  // Active Suite and Category metadata (pure metadata, zero node modules)
  const currentSuite = useMemo(() => {
    if (nav.level === "suite" || nav.level === "category") {
      return paletteSuitesMetadata.find((s) => s.id === nav.suiteId)
    }
    return undefined
  }, [nav])

  const currentCategory = useMemo(() => {
    if (nav.level === "category") {
      return paletteCategoriesMetadata.find((c) => c.id === nav.categoryId)
    }
    return undefined
  }, [nav])

  // Filter categories for the current suite if it's categorized (e.g. apps)
  const suiteCategories = useMemo(() => {
    if (nav.level === "suite" && currentSuite?.hasCategories) {
      return paletteCategoriesMetadata.filter((c) => c.suiteId === currentSuite.id)
    }
    return []
  }, [nav, currentSuite])

  // On-demand chunk loading: only load nodes for the active suite or active category!
  useEffect(() => {
    if (nav.level === "suite" && currentSuite && !currentSuite.hasCategories) {
      setIsLoadingGroup(true)
      loadPaletteNodeGroup(currentSuite.id, true)
        .then((group) => {
          setLoadedGroup(group)
          setIsLoadingGroup(false)
        })
        .catch(() => setIsLoadingGroup(false))
      return
    }

    if (nav.level === "category" && currentCategory) {
      setIsLoadingGroup(true)
      loadPaletteNodeGroup(currentCategory.id, false)
        .then((group) => {
          setLoadedGroup(group)
          setIsLoadingGroup(false)
        })
        .catch(() => setIsLoadingGroup(false))
      return
    }

    setLoadedGroup(null)
    setIsLoadingGroup(false)
  }, [nav, currentSuite, currentCategory])

  // Lazy search: only load all nodes when the user types a search query at root level
  useEffect(() => {
    if (searchQuery.trim() && !searchIndex) {
      loadAllSearchNodes().then((items) => setSearchIndex(items))
    }
  }, [searchQuery, searchIndex])

  const searchResults = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return []

    // If searching inside an active loaded group, search locally
    if (loadedGroup) {
      const activeList: SearchNodeItem[] = [
        ...loadedGroup.triggers.map((mod) => ({
          mod,
          suiteLabel: currentSuite?.label || "",
          categoryLabel: currentCategory?.label,
        })),
        ...loadedGroup.actions.map((mod) => ({
          mod,
          suiteLabel: currentSuite?.label || "",
          categoryLabel: currentCategory?.label,
        })),
      ]
      return activeList.filter(
        (item) =>
          item.mod.manifest.label.toLowerCase().includes(query) ||
          item.mod.manifest.id.toLowerCase().includes(query)
      )
    }

    // Otherwise use lazy global search index
    if (!searchIndex) return []
    return searchIndex.filter(
      (item) =>
        item.mod.manifest.label.toLowerCase().includes(query) ||
        item.mod.manifest.id.toLowerCase().includes(query) ||
        item.suiteLabel.toLowerCase().includes(query) ||
        (item.categoryLabel && item.categoryLabel.toLowerCase().includes(query))
    )
  }, [searchQuery, loadedGroup, searchIndex, currentSuite, currentCategory])

  const add = (mod: WorkflowNodeModule) => {
    const def = mod.manifest
    const type = def.id as NodeType

    if (isNodeLocked(type)) {
      redirectToPricing()
      return
    }

    const nodes = getNodes()

    if (
      def.maxInstances !== undefined &&
      nodes.filter((node) => node.data?.type === type).length >= def.maxInstances
    ) {
      toast.error(
        `A workflow can only have ${def.maxInstances} ${def.label} trigger`
      )
      return
    }

    const count = nodes.filter((n) => n.data.type === type).length
    const title = `${def.label} ${count + 1}`

    const { x, y, zoom } = getViewport()
    const { width, height } = store.getState()

    const position = {
      x: (width / 2 - x) / zoom,
      y: (height / 2 - y) / zoom,
    }

    const initialValues: Record<string, string> = {
      ...(mod.getInitialValues?.() ?? {}),
    }

    for (const field of (def.fields || []) as NodeField[]) {
      if (initialValues[field.key] === undefined) {
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

  const renderNodeButton = (mod: WorkflowNodeModule) => {
    const type = mod.manifest.id as NodeType
    const isLocked = isNodeLocked(type)

    return (
      <Button
        key={type}
        variant="ghost"
        onClick={() => {
          if (isLocked) {
            redirectToPricing()
            return
          }
          add(mod)
        }}
        className="w-full justify-start gap-2.5 px-2.5 py-1.5 h-auto text-xs font-normal hover:bg-accent/80 transition-colors cursor-pointer"
      >
        <NodeIcon type={type} />
        <span className="truncate">{mod.manifest.label}</span>
        {isLocked && (
          <Lock className="ml-auto size-3.5 shrink-0 text-muted-foreground" />
        )}
      </Button>
    )
  }

  // Header Title
  const renderHeaderTitle = () => {
    if (nav.level === "category" && currentCategory) {
      const CategoryIcon = currentCategory.icon
      return (
        <div className="flex items-center gap-1.5 min-w-0 w-full">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setSearchQuery("")
              setNav({ level: "suite", suiteId: nav.suiteId })
            }}
            className="size-6 -ml-1 text-muted-foreground hover:text-foreground cursor-pointer shrink-0"
            title={`Back to ${currentSuite?.label ?? "Apps"}`}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <span
            className="flex size-4.5 shrink-0 items-center justify-center rounded-xs"
            style={{
              backgroundColor: `${currentCategory.brandColor || "#635BFF"}20`,
              color: currentCategory.brandColor || "#635BFF",
            }}
          >
            <CategoryIcon className="size-3" />
          </span>
          <span className="truncate text-xs font-semibold">
            {currentCategory.label}
          </span>
        </div>
      )
    }

    if (nav.level === "suite" && currentSuite) {
      const SuiteIcon = currentSuite.icon
      return (
        <div className="flex items-center gap-1.5 min-w-0 w-full">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setSearchQuery("")
              setNav({ level: "suites" })
            }}
            className="size-6 -ml-1 text-muted-foreground hover:text-foreground cursor-pointer shrink-0"
            title="Back to Suites"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <div
            className={`flex size-4.5 shrink-0 items-center justify-center rounded-xs ${currentSuite.accent}`}
          >
            <SuiteIcon className="size-3" />
          </div>
          <span className="truncate text-xs font-semibold">
            {currentSuite.label}
          </span>
        </div>
      )
    }

    return <span className="text-xs font-semibold">Toolbar</span>
  }

  // Accordions for Triggers and Actions
  const renderNodeAccordions = (
    triggers: readonly WorkflowNodeModule[],
    actions: readonly WorkflowNodeModule[]
  ) => {
    return (
      <Accordion
        type="multiple"
        defaultValue={["triggers", "actions"]}
        className="space-y-2 p-2"
      >
        <AccordionItem
          value="triggers"
          className="overflow-hidden rounded-lg border border-border/50 bg-card/40"
        >
          <AccordionTrigger className="px-2.5 py-2 text-xs font-semibold hover:bg-muted/40 hover:no-underline transition-colors">
            <div className="flex items-center gap-2">
              <span>Triggers</span>
              <Badge
                variant="secondary"
                className="h-4 px-1.5 py-0 text-[10px] font-normal"
              >
                {triggers.length}
              </Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent className="flex flex-col gap-0.5 px-1.5 pb-2 pt-1">
            {triggers.length > 0 ? (
              triggers.map(renderNodeButton)
            ) : (
              <p className="px-2 py-2 text-[11px] italic text-muted-foreground">
                No triggers available
              </p>
            )}
          </AccordionContent>
        </AccordionItem>

        <AccordionItem
          value="actions"
          className="overflow-hidden rounded-lg border border-border/50 bg-card/40"
        >
          <AccordionTrigger className="px-2.5 py-2 text-xs font-semibold hover:bg-muted/40 hover:no-underline transition-colors">
            <div className="flex items-center gap-2">
              <span>Actions</span>
              <Badge
                variant="secondary"
                className="h-4 px-1.5 py-0 text-[10px] font-normal"
              >
                {actions.length}
              </Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent className="flex flex-col gap-0.5 px-1.5 pb-2 pt-1">
            {actions.length > 0 ? (
              actions.map(renderNodeButton)
            ) : (
              <p className="px-2 py-2 text-[11px] italic text-muted-foreground">
                No actions available
              </p>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    )
  }

  if (!isConnected) {
    return <PaletteSkeleton />
  }

  return (
    <Section title={renderHeaderTitle()}>
      {/* Search Input Filter */}
      <div className="p-2 pb-1 border-b border-border/40">
        <div className="relative">
          <Search className="absolute left-2.5 top-2 size-3.5 text-muted-foreground pointer-events-none" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search nodes..."
            className="h-7.5 pl-8 pr-7 text-xs bg-muted/20 border-border/50 focus-visible:bg-background"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-2 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* When searching, show results */}
      {searchQuery.trim() ? (
        <div className="flex flex-col gap-1 p-2">
          <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Matching Nodes ({searchResults.length})
          </div>
          {searchResults.length > 0 ? (
            searchResults.map(({ mod, suiteLabel, categoryLabel }) => {
              const type = mod.manifest.id as NodeType
              const isLocked = isNodeLocked(type)

              return (
                <Button
                  key={type}
                  variant="ghost"
                  onClick={() => {
                    if (isLocked) {
                      redirectToPricing()
                      return
                    }
                    add(mod)
                  }}
                  className="w-full justify-start gap-2.5 px-2.5 py-1.5 h-auto text-xs font-normal hover:bg-accent/80 transition-colors cursor-pointer"
                >
                  <NodeIcon type={type} />
                  <div className="flex flex-col items-start min-w-0 text-left">
                    <span className="truncate text-xs font-medium text-foreground">
                      {mod.manifest.label}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {categoryLabel
                        ? `${categoryLabel} · ${mod.manifest.kind}`
                        : `${suiteLabel} · ${mod.manifest.kind}`}
                    </span>
                  </div>
                  {isLocked && (
                    <Lock className="ml-auto size-3.5 shrink-0 text-muted-foreground" />
                  )}
                </Button>
              )
            })
          ) : (
            <div className="p-4 text-center text-xs text-muted-foreground">
              {searchIndex === null ? (
                <div className="animate-pulse">Searching catalog...</div>
              ) : (
                `No nodes matching "${searchQuery}"`
              )}
            </div>
          )}
        </div>
      ) : (
        /* Multi-layer Drill Down Navigation */
        <>
          {/* Layer 1: Suites List (Pure metadata, 0 nodes in memory) */}
          {nav.level === "suites" && (
            <div className="flex flex-col gap-1.5 p-2">
              {paletteSuitesMetadata.map((suite) => {
                const SuiteIcon = suite.icon
                return (
                  <button
                    key={suite.id}
                    type="button"
                    onClick={() => setNav({ level: "suite", suiteId: suite.id })}
                    className="flex w-full items-center justify-between rounded-lg border border-border/50 bg-card/50 px-3 py-2.5 text-left transition-all hover:border-border hover:bg-accent/70 active:scale-[0.99] cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`flex size-6 shrink-0 items-center justify-center rounded-md ${suite.accent}`}
                      >
                        <SuiteIcon className="size-3.5" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                          {suite.label}
                        </span>
                        <span className="text-[10px] text-muted-foreground truncate max-w-44">
                          {suite.description}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      <Badge
                        variant="outline"
                        className="text-[10px] px-1.5 py-0 h-4 font-normal text-muted-foreground border-border/60"
                      >
                        {suite.countLabel}
                      </Badge>
                      <ChevronRight className="size-3.5 text-muted-foreground group-hover:text-foreground transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </button>
                )
              })}
            </div>
          )}

          {/* Layer 2: Suite View */}
          {nav.level === "suite" && currentSuite && (
            <>
              {/* If Suite has categories (e.g. Apps), show list of categories (0 nodes in memory) */}
              {currentSuite.hasCategories ? (
                <div className="flex flex-col gap-1.5 p-2">
                  {suiteCategories.map((category) => {
                    const CategoryIcon = category.icon
                    return (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() =>
                          setNav({
                            level: "category",
                            suiteId: currentSuite.id,
                            categoryId: category.id,
                          })
                        }
                        className="flex w-full items-center justify-between rounded-lg border border-border/40 bg-card/40 px-3 py-2 text-left transition-all hover:border-border hover:bg-accent/70 active:scale-[0.99] cursor-pointer group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className="flex size-5 shrink-0 items-center justify-center rounded-md"
                            style={{
                              backgroundColor: `${category.brandColor || "#635BFF"}20`,
                              color: category.brandColor || "#635BFF",
                            }}
                          >
                            <CategoryIcon className="size-3" />
                          </span>
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs font-medium text-foreground group-hover:text-primary transition-colors">
                              {category.label}
                            </span>
                            <span className="text-[10px] text-muted-foreground truncate max-w-44">
                              {category.description}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0 ml-2">
                          <Badge
                            variant="outline"
                            className="text-[10px] px-1.5 py-0 h-4 font-normal text-muted-foreground border-border/60"
                          >
                            {category.nodeCount}{" "}
                            {category.nodeCount === 1 ? "node" : "nodes"}
                          </Badge>
                          <ChevronRight className="size-3.5 text-muted-foreground group-hover:text-foreground transition-transform group-hover:translate-x-0.5" />
                        </div>
                      </button>
                    )
                  })}
                </div>
              ) : (
                /* Suite has direct nodes (e.g. Flow or Core), show on-demand loaded Triggers & Actions */
                isLoadingGroup ? (
                  <div className="space-y-2 p-3 animate-pulse">
                    <div className="h-10 w-full rounded-md bg-muted/40" />
                    <div className="h-10 w-full rounded-md bg-muted/40" />
                  </div>
                ) : (
                  renderNodeAccordions(
                    loadedGroup?.triggers || [],
                    loadedGroup?.actions || []
                  )
                )
              )}
            </>
          )}

          {/* Layer 3: Category View (e.g. Apps -> Stripe / Resend / Discord) */}
          {nav.level === "category" && currentCategory && (
            isLoadingGroup ? (
              <div className="space-y-2 p-3 animate-pulse">
                <div className="h-10 w-full rounded-md bg-muted/40" />
                <div className="h-10 w-full rounded-md bg-muted/40" />
              </div>
            ) : (
              renderNodeAccordions(
                loadedGroup?.triggers || [],
                loadedGroup?.actions || []
              )
            )
          )}
        </>
      )}
    </Section>
  )
}
