import { AlertOctagon } from "lucide-react"
import type { ActionNodeModule } from "../../../types/module"

export const throwErrorNodeModule: ActionNodeModule<"throw-error"> = {
  manifest: {
    id: "throw-error",
    suiteId: "flow",
    kind: "action",
    label: "Throw Error",
    description: "Intentionally triggers a step failure to test error boundary handling",
    accent: "bg-rose-600 text-white",
    fields: [
      {
        key: "message",
        label: "Error Message",
        placeholder: "e.g. Intentional failure for testing",
        defaultValue: "Intentional test error triggered by Throw Error node",
        required: false,
      },
    ],
    outputs: [],
  },
  icon: AlertOctagon,
  iconSvgPath: `<polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>`,
  handleTopology: { type: "standard" },
  getInitialValues: () => ({
    message: "Intentional test error triggered by Throw Error node",
  }),
}

