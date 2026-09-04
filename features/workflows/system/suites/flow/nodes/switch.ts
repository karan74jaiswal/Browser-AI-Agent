import { GitFork } from "lucide-react"
import type { ActionNodeModule } from "../../../types/module"
import { SwitchNodeHandles, getSwitchOutputs } from "../handles/switch-handle"

export const switchNodeModule: ActionNodeModule<"switch"> = {
  manifest: {
    id: "switch",
    suiteId: "flow",
    kind: "action",
    label: "Switch",
    description: "Routes workflow execution across multiple branching paths based on rules or value matching",
    accent: "bg-orange-600 text-white",
    fields: [],
    outputs: [
      { path: "outputIndex", label: "Matched Output Index" },
      { path: "outputName", label: "Matched Output Name" },
      { path: "branch", label: "Active Branch" },
      { path: "value", label: "Evaluated Value" },
    ],
  },
  icon: GitFork,
  iconSvgPath: `<circle cx="12" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><circle cx="18" cy="6" r="3"/><path d="M18 9v2c0 .6-.4 1-1 1H7c-.6 0-1-.4-1-1V9"/><path d="M12 12v3"/>`,
  handleTopology: {
    type: "dynamic",
    getHandles: getSwitchOutputs,
  },
  handleComponent: SwitchNodeHandles,
  loadCustomInspector: () =>
    import("@/features/workflows/components/rightSidebar/switch-inspector"),
  getInitialValues: () => ({
    mode: "rules",
    fallbackEnabled: "true",
    fallbackName: "Fallback",
    rules: JSON.stringify([
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
    ]),
    cases: JSON.stringify([
      {
        id: crypto.randomUUID(),
        name: "Case 1",
        operator: "equals",
        value: "",
      },
    ]),
  }),
}

