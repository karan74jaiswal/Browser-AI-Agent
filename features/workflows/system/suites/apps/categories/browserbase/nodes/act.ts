import { Zap } from "lucide-react"
import type { ActionNodeModule } from "../../../../../types/module"

export const actNodeModule: ActionNodeModule<"act"> = {
  manifest: {
    id: "act",
    suiteId: "apps",
    categoryId: "browserbase",
    kind: "action",
    label: "Act",
    description: "Performs an atomic AI action on the page (clicking, typing, selecting)",
    accent: "bg-purple-500 text-white",
    fields: [
      {
        key: "instruction",
        label: "Instruction",
        placeholder: "Click the 'Sign in' button",
        multiline: true,
        required: true,
      },
    ],
    outputs: [
      { path: "success", label: "Success" },
      { path: "message", label: "Message" },
      { path: "url", label: "URL" },
    ],
  },
  icon: Zap,
  iconSvgPath: `<path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/>`,
  handleTopology: { type: "standard" },
  getInitialValues: () => ({ instruction: "" }),
}

