import { Bot } from "lucide-react"
import type { ActionNodeModule } from "../../../../../types/module"

export const agentNodeModule: ActionNodeModule<"agent"> = {
  manifest: {
    id: "agent",
    suiteId: "apps",
    categoryId: "browserbase",
    kind: "action",
    label: "Agent",
    description: "Autonomous multi-step browser AI agent for completing complex web goals",
    accent: "bg-indigo-500 text-white",
    requiredPlan: "pro",
    fields: [
      {
        key: "instruction",
        label: "Instruction",
        placeholder: "Search for hotels in Paris and book the cheapest one",
        multiline: true,
        required: true,
      },
      {
        key: "maxSteps",
        label: "Max Steps",
        defaultValue: "10",
        options: [
          { label: "10 steps (Default)", value: "10" },
          { label: "15 steps", value: "15" },
          { label: "20 steps", value: "20" },
          { label: "25 steps", value: "25" },
          { label: "30 steps", value: "30" },
        ],
      },
    ],
    outputs: [
      { path: "success", label: "Success" },
      { path: "message", label: "Message" },
      { path: "completed", label: "Completed" },
    ],
  },
  icon: Bot,
  iconSvgPath: `<path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/>`,
  handleTopology: { type: "standard" },
  getInitialValues: () => ({
    instruction: "",
    maxSteps: "10",
  }),
}

