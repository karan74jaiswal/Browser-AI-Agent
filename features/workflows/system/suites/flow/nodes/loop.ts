import { Repeat } from "lucide-react"
import type { ActionNodeModule } from "../../../types/module"
import type { ConditionCriterion } from "@/features/workflows/lib/evaluate-condition"
import { LoopNodeHandles } from "../handles/loop-handle"

export const loopNodeModule: ActionNodeModule<"loop"> = {
  manifest: {
    id: "loop",
    suiteId: "flow",
    kind: "action",
    label: "Loop",
    description: "Iterates over an array, counter, or condition with error boundary isolation",
    accent: "bg-emerald-600 text-white",
    fields: [],
    outputs: [
      { path: "item", label: "Current Item Data" },
      { path: "index", label: "Current Item Number (0-based)" },
      { path: "iteration", label: "Current Iteration (1-based)" },
      { path: "total", label: "Total Items Count" },
      { path: "isFirst", label: "Is First Item (True/False)" },
      { path: "isLast", label: "Is Last Item (True/False)" },
      { path: "results", label: "All Processed Results (List)" },
      { path: "successCount", label: "Successful Items Count" },
      { path: "failureCount", label: "Failed Items Count" },
      { path: "completed", label: "Loop Completed (True/False)" },
    ],
  },
  icon: Repeat,
  iconSvgPath: `<path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/>`,
  handleTopology: {
    type: "loop",
    doneHandleId: "done",
    loopHandleId: "loop",
  },
  handleComponent: LoopNodeHandles,
  loadCustomInspector: () => import("../inspectors/loop-inspector"),
  acceptsTokens: true,
  onInsertTokenFallback: (
    node,
    token,
    updateNodeData,
    setActiveFieldKey,
    getInputHandle
  ) => {
    const values = node.data.values || {}
    const mode = values.mode || "for_each"
    if (mode === "while") {
      try {
        const conditions: ConditionCriterion[] = JSON.parse(
          values.conditions || "[]"
        )
        if (conditions.length > 0) {
          const first = conditions[0]
          setActiveFieldKey?.("conditions")
          const handle = getInputHandle?.("conditions")
          if (handle) {
            handle.insertToken(token)
          } else {
            const next = [
              {
                ...first,
                left: first.left ? `${first.left} ${token}` : token,
              },
              ...conditions.slice(1),
            ]
            updateNodeData(node.id, {
              values: { ...values, conditions: JSON.stringify(next) },
            })
          }
        }
      } catch {}
    } else {
      setActiveFieldKey?.("items")
      const handle = getInputHandle?.("items")
      if (handle) {
        handle.insertToken(token)
      } else {
        const currentVal = values.items ?? ""
        const newVal = currentVal ? `${currentVal} ${token}` : token
        updateNodeData(node.id, {
          values: { ...values, items: newVal },
        })
      }
    }
  },
  getInitialValues: () => ({
    mode: "for_each",
    items: "",
    count: "5",
    maxIterations: "50",
    batchDelayMs: "0",
    onItemFailure: "continue",
    whileRuleMode: "until",
    conditions: JSON.stringify([
      {
        id: crypto.randomUUID(),
        left: "",
        operator: "equals",
        right: "",
      },
    ]),
  }),
}

