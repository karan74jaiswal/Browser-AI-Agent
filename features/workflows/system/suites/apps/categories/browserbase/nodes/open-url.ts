import { Globe } from "lucide-react"
import type { ActionNodeModule } from "../../../../../types/module"

export const openUrlNodeModule: ActionNodeModule<"open-url"> = {
  manifest: {
    id: "open-url",
    suiteId: "apps",
    categoryId: "browserbase",
    kind: "action",
    label: "Open URL",
    description: "Navigates the Browserbase cloud browser to a web destination",
    accent: "bg-emerald-500 text-white",
    fields: [
      {
        key: "url",
        label: "URL",
        placeholder: "https://youtube.com",
        required: true,
      },
    ],
    outputs: [
      { path: "url", label: "URL" },
      { path: "title", label: "Title" },
    ],
  },
  icon: Globe,
  iconSvgPath: `<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>`,
  handleTopology: { type: "standard" },
  getInitialValues: () => ({ url: "" }),
}

