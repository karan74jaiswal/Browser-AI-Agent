import { GitBranch } from "lucide-react"
import type { ActionNodeModule } from "../../../types/module"
import type { ConditionCriterion } from "@/features/workflows/lib/evaluate-condition"
import { IfNodeHandles } from "../handles/if-handle"

export const ifNodeModule: ActionNodeModule<"if"> = {
  manifest: {
    id: "if",
    suiteId: "flow",
    kind: "action",
    label: "If",
    description: "Evaluates multi-condition logical rules (12 operators) into True and False branches",
    accent: "bg-amber-600 text-white",
    fields: [],
    outputs: [
      { path: "result", label: "Result (Boolean)" },
      { path: "branch", label: "Active Branch (true/false)" },
      { path: "reason", label: "Reason" },
    ],
  },
  icon: GitBranch,
  iconSvgPath: `<line x1="6" x2="6" y1="3" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/>`,
  handleTopology: {
    type: "boolean",
    trueHandleId: "true",
    falseHandleId: "false",
  },
  handleComponent: IfNodeHandles,
  loadCustomInspector: () => import("../inspectors/if-inspector"),
  acceptsTokens: true,
  onInsertTokenFallback: (
    node,
    token,
    updateNodeData,
    setActiveFieldKey,
    getInputHandle
  ) => {
    try {
      const conditions: ConditionCriterion[] = JSON.parse(
        node.data.values?.conditions || "[]"
      )
      if (conditions.length > 0) {
        const first = conditions[0]
        const fieldKey = `condition-${first.id}-left`
        setActiveFieldKey?.(fieldKey)
        const handle = getInputHandle?.(fieldKey)
        if (handle) {
          handle.insertToken(token)
        } else {
          const next = [
            { ...first, left: first.left ? `${first.left} ${token}` : token },
            ...conditions.slice(1),
          ]
          updateNodeData(node.id, {
            values: { ...node.data.values, conditions: JSON.stringify(next) },
          })
        }
      }
    } catch {}
  },
  getInitialValues: () => ({
    combinator: "and",
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

