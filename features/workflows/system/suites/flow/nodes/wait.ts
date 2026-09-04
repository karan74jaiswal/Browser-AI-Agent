import { Clock } from "lucide-react"
import type { ActionNodeModule } from "../../../types/module"

export const waitNodeModule: ActionNodeModule<"wait"> = {
  manifest: {
    id: "wait",
    suiteId: "flow",
    kind: "action",
    label: "Wait",
    description: "Pauses workflow execution for a specified duration in seconds",
    accent: "bg-indigo-600 text-white",
    fields: [
      {
        key: "seconds",
        label: "Wait Duration (seconds)",
        placeholder: "e.g. 5",
        defaultValue: "5",
        required: true,
      },
    ],
    outputs: [
      { path: "seconds", label: "Seconds Waited" },
      { path: "completedAt", label: "Completed At" },
    ],
  },
  icon: Clock,
  iconSvgPath: `<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>`,
  handleTopology: { type: "standard" },
  getInitialValues: () => ({ seconds: "5" }),
}

