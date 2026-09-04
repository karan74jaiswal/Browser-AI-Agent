import { MousePointerClick } from "lucide-react"
import type { TriggerNodeModule } from "../../../types/module"

export const startNodeModule: TriggerNodeModule<"start"> = {
  manifest: {
    id: "start",
    suiteId: "flow",
    kind: "trigger",
    label: "Start",
    description: "Initiates the workflow via manual test run or execution dispatch",
    accent: "bg-blue-500 text-white",
    maxInstances: 1,
    fields: [],
    outputs: [],
  },
  icon: MousePointerClick,
  iconSvgPath: `<path d="m9 9 5 12 1.8-5.2L21 14Z"/><path d="M7.2 2.2 8 5.1"/><path d="m5.1 8-2.9-.8"/><path d="M14 4.1 12 6"/><path d="m6 12-1.9 2"/>`,
  handleTopology: { type: "standard" },
  getInitialValues: () => ({}),
  getTriggerFallback: () => ({
    startedAt: new Date().toISOString(),
  }),
}
