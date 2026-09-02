"use client"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { useReactFlow, useStore } from "@xyflow/react"
import Section from "./section"
import { Lock } from "lucide-react"
import { toast } from "sonner"
import { useProPlan } from "../../hooks"
import {
  StepNodeType,
  NodeType,
  nodeRegistry,
  NodeField,
  StepNodeKind,
  NodeDefinition,
} from "../../nodes/node-registry"
import { NodeIcon } from "../node-icon"

// The Toolbar's groups, one accordion section per node kind.
const sections: { kind: StepNodeKind; label: string }[] = [
  { kind: "trigger", label: "Triggers" },
  { kind: "action", label: "Actions" },
]

// Every node type from the registry, filtered into the groups below.
const definitions: NodeDefinition[] = Object.values(nodeRegistry)

export default function Palette() {
  const { getNodes, getViewport, addNodes } = useReactFlow<StepNodeType>()
  const { isNodeLocked, redirectToPricing } = useProPlan()

  const width = useStore((s) => s.width)
  const height = useStore((s) => s.height)
  const add = (type: NodeType) => {
    const def: NodeDefinition | undefined = nodeRegistry[type]
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
    if (type === "if") {
      initialValues.combinator = "and"
      initialValues.conditions = JSON.stringify([
        {
          id: crypto.randomUUID(),
          left: "",
          operator: "equals",
          right: "",
        },
      ])
    }
    if (type === "switch") {
      initialValues.mode = "rules"
      initialValues.fallbackEnabled = "true"
      initialValues.fallbackName = "Fallback"
      initialValues.rules = JSON.stringify([
        {
          id: crypto.randomUUID(),
          name: "Route 1",
          combinator: "and",
          conditions: [
            {
              id: crypto.randomUUID(),
              left: "",
              operator: "equals",
              right: "",
            },
          ],
        },
      ])
      initialValues.cases = JSON.stringify([
        {
          id: crypto.randomUUID(),
          name: "Case 1",
          operator: "equals",
          value: "",
        },
      ])
    }
    if (type === "loop") {
      initialValues.mode = "for_each"
      initialValues.items = ""
      initialValues.count = "5"
      initialValues.maxIterations = "50"
      initialValues.batchDelayMs = "0"
      initialValues.onItemFailure = "continue"
      initialValues.whileRuleMode = "until"
      initialValues.conditions = JSON.stringify([
        {
          id: crypto.randomUUID(),
          left: "",
          operator: "equals",
          right: "",
        },
      ])
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
