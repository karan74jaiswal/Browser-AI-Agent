"use client"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { useReactFlow, useStoreApi } from "@xyflow/react"
import { useStatus } from "@liveblocks/react"
import Section from "./section"
import { Lock } from "lucide-react"
import { toast } from "sonner"
import { useProPlan } from "../../hooks"
import { NodeIcon } from "../node-icon"
import {
  systemPaletteCatalog,
  systemNodeInitialValues,
  systemNodeRegistry,
  type StepNodeType,
  type NodeType,
  type NodeField,
  type NodeDefinition,
  type WorkflowNodeModule,
} from "@/features/workflows/system"

export function PaletteSkeleton() {
  return (
    <Section title="Toolbar">
      <div className="space-y-4 px-3 py-3 animate-pulse">
        <div className="space-y-2">
          <div className="h-3.5 w-20 rounded bg-muted" />
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center gap-2.5 px-1.5 py-1">
              <div className="size-5 rounded bg-muted" />
              <div className="h-3.5 w-24 rounded bg-muted" />
            </div>
            <div className="flex items-center gap-2.5 px-1.5 py-1">
              <div className="size-5 rounded bg-muted" />
              <div className="h-3.5 w-28 rounded bg-muted" />
            </div>
          </div>
        </div>
        <div className="space-y-2 pt-2">
          <div className="h-3.5 w-16 rounded bg-muted" />
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center gap-2.5 px-1.5 py-1">
              <div className="size-5 rounded bg-muted" />
              <div className="h-3.5 w-20 rounded bg-muted" />
            </div>
            <div className="flex items-center gap-2.5 px-1.5 py-1">
              <div className="size-5 rounded bg-muted" />
              <div className="h-3.5 w-32 rounded bg-muted" />
            </div>
          </div>
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

  if (!isConnected) {
    return <PaletteSkeleton />
  }

  const add = (type: NodeType) => {
    const def: NodeDefinition | undefined = systemNodeRegistry[type]
    if (!def) return

    if (isNodeLocked(def)) {
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

    // Fully decoupled: initial values come directly from the node's factory
    const initialValues: Record<string, string> = {
      ...(systemNodeInitialValues[type]?.() ?? {}),
    }

    // Fallback: populate field defaultValues if not set by factory
    for (const field of def.fields as NodeField[]) {
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
    const def = systemNodeRegistry[type]
    const isLocked = def ? isNodeLocked(def) : false

    return (
      <Button
        key={type}
        variant="ghost"
        onClick={() => {
          if (isLocked) {
            redirectToPricing()
            return
          }
          add(type)
        }}
        className="w-full justify-start gap-2.5 px-2 py-1.5 h-auto text-xs font-normal hover:bg-accent/80 transition-colors"
      >
        <NodeIcon type={type} />
        <span className="truncate">{mod.manifest.label}</span>
        {isLocked && (
          <Lock className="ml-auto size-3.5 shrink-0 text-muted-foreground" />
        )}
      </Button>
    )
  }

  return (
    <Section title="Toolbar">
      <Accordion
        type="multiple"
        defaultValue={["flow", "core", "apps"]}
        className="px-2 py-1 space-y-1.5"
      >
        {systemPaletteCatalog.map((suiteView) => {
          const { suite, directTriggers, directActions, categories } = suiteView
          const SuiteIcon = suite.icon

          return (
            <AccordionItem
              key={suite.id}
              value={suite.id}
              className="border-b-0 rounded-lg bg-card/40 border border-border/40 overflow-hidden"
            >
              <AccordionTrigger className="px-2.5 py-2 text-xs font-semibold text-foreground hover:no-underline hover:bg-muted/40 transition-colors">
                <div className="flex items-center gap-2">
                  <div
                    className={`flex size-4.5 items-center justify-center rounded-sm ${suite.accent}`}
                  >
                    <SuiteIcon className="size-3" />
                  </div>
                  <span>{suite.label}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-1.5 pb-2 pt-1 flex flex-col gap-1.5">
                {/* Direct Nodes: Triggers & Actions */}
                {directTriggers.length > 0 && (
                  <div className="flex flex-col gap-0.5">
                    <div className="px-2 py-0.5 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                      Triggers
                    </div>
                    {directTriggers.map(renderNodeButton)}
                  </div>
                )}

                {directActions.length > 0 && (
                  <div className="flex flex-col gap-0.5">
                    <div className="px-2 py-0.5 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                      Actions
                    </div>
                    {directActions.map(renderNodeButton)}
                  </div>
                )}

                {/* Categorized Nodes (Apps Suite) */}
                {categories.length > 0 && (
                  <Accordion
                    type="multiple"
                    defaultValue={["browserbase", "stripe", "resend"]}
                    className="flex flex-col gap-1 pt-0.5"
                  >
                    {categories.map((catView) => {
                      const { category, triggers, actions } = catView
                      const CategoryIcon = category.icon
                      const totalCount = triggers.length + actions.length

                      return (
                        <AccordionItem
                          key={category.id}
                          value={category.id}
                          className="border-b-0 rounded-md border border-border/30 bg-background/50 overflow-hidden"
                        >
                          <AccordionTrigger className="px-2 py-1.5 text-xs font-medium text-foreground hover:no-underline hover:bg-muted/30 transition-colors">
                            <div className="flex items-center gap-2">
                              <span
                                className="flex size-4 items-center justify-center rounded-xs"
                                style={{
                                  backgroundColor: `${category.brandColor || "#635BFF"}20`,
                                  color: category.brandColor || "#635BFF",
                                }}
                              >
                                <CategoryIcon className="size-2.5" />
                              </span>
                              <span className="text-xs">{category.label}</span>
                              <span className="text-[10px] text-muted-foreground ml-auto pr-1">
                                {totalCount}
                              </span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="px-1 pb-1.5 pt-0.5 flex flex-col gap-1">
                            {triggers.length > 0 && (
                              <div className="flex flex-col gap-0.5">
                                <div className="px-2 py-0.5 text-[9px] font-semibold tracking-wider text-muted-foreground/80 uppercase">
                                  Triggers
                                </div>
                                {triggers.map(renderNodeButton)}
                              </div>
                            )}
                            {actions.length > 0 && (
                              <div className="flex flex-col gap-0.5">
                                <div className="px-2 py-0.5 text-[9px] font-semibold tracking-wider text-muted-foreground/80 uppercase">
                                  Actions
                                </div>
                                {actions.map(renderNodeButton)}
                              </div>
                            )}
                          </AccordionContent>
                        </AccordionItem>
                      )
                    })}
                  </Accordion>
                )}
              </AccordionContent>
            </AccordionItem>
          )
        })}
      </Accordion>
    </Section>
  )
}
