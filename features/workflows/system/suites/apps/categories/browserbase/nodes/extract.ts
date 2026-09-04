import { FileText } from "lucide-react"
import type { ActionNodeModule } from "../../../../../types/module"

export const extractNodeModule: ActionNodeModule<"extract"> = {
  manifest: {
    id: "extract",
    suiteId: "apps",
    categoryId: "browserbase",
    kind: "action",
    label: "Extract",
    description: "Extracts structured data from the active browser page using AI",
    accent: "bg-amber-500 text-white",
    fields: [
      {
        key: "instruction",
        label: "Instruction",
        placeholder: "Extract the article title and content",
        multiline: true,
        required: true,
      },
    ],
    outputs: [{ path: "result", label: "Result" }],
  },
  icon: FileText,
  iconSvgPath: `<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/>`,
  handleTopology: { type: "standard" },
  getInitialValues: () => ({ instruction: "" }),
}

