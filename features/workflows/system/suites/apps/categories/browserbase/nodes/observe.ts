import { Eye } from "lucide-react"
import type { ActionNodeModule } from "../../../../../types/module"

export const observeNodeModule: ActionNodeModule<"observe"> = {
  manifest: {
    id: "observe",
    suiteId: "apps",
    categoryId: "browserbase",
    kind: "action",
    label: "Observe",
    description: "Inspects the active browser DOM to plan and locate interactive elements",
    accent: "bg-rose-500 text-white",
    fields: [
      {
        key: "instruction",
        label: "Instruction",
        placeholder: "Find the 'Sign in' button",
        multiline: true,
        required: true,
      },
    ],
    outputs: [{ path: "matches", label: "Matches" }],
  },
  icon: Eye,
  iconSvgPath: `<path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/>`,
  handleTopology: { type: "standard" },
  getInitialValues: () => ({ instruction: "" }),
}

