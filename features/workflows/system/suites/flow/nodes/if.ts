import { GitBranch } from "lucide-react"
import type { ActionNodeModule } from "../../../types/module"
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
  loadCustomInspector: () =>
    import("@/features/workflows/components/rightSidebar/if-inspector"),
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

