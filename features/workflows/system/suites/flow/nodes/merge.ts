import { GitMerge } from "lucide-react"
import type { ActionNodeModule } from "../../../types/module"

export const mergeNodeModule: ActionNodeModule<"merge"> = {
  manifest: {
    id: "merge",
    suiteId: "flow",
    kind: "action",
    label: "Merge / Join",
    description: "Synchronizes concurrent parallel branches into a unified result map, array, or first winner",
    accent: "bg-indigo-600 text-white",
    fields: [
      {
        key: "mode",
        label: "Merge Mode",
        defaultValue: "combine",
        required: true,
        options: [
          {
            label: "Combine All Active (Object Map)",
            value: "combine",
          },
          {
            label: "Flatten into Array (List)",
            value: "array",
          },
          {
            label: "Pass-Through / Winner (Single Active Branch)",
            value: "first",
          },
        ],
      },
      {
        key: "onBranchFailure",
        label: "On Branch Failure",
        defaultValue: "continue",
        required: false,
        options: [
          {
            label: "Continue with Successful Branches",
            value: "continue",
          },
          {
            label: "Halt Workflow if Any Branch Fails",
            value: "halt",
          },
        ],
      },
    ],
    outputs: [
      { path: "merged", label: "Merged Object Map" },
      { path: "items", label: "Merged Items Array" },
      { path: "result", label: "Pass-Through / Winner Result" },
      { path: "activeCount", label: "Active Branch Count" },
      { path: "failedCount", label: "Failed Branch Count" },
      { path: "hasErrors", label: "Has Failed Branches" },
      { path: "errors", label: "Branch Error Details" },
    ],
  },
  icon: GitMerge,
  iconSvgPath: `<circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M6 9v3a6 6 0 0 0 6 6h3"/>`,
  handleTopology: { type: "standard" },
  loadCustomInspector: () =>
    import("@/features/workflows/components/rightSidebar/merge-inspector"),
  getInitialValues: () => ({
    mode: "combine",
    onBranchFailure: "continue",
  }),
}

