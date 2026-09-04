import { ClipboardList } from "lucide-react"
import type { TriggerNodeModule } from "../../../../../types/module"

export const googleFormTriggerNodeModule: TriggerNodeModule<"google-form-trigger"> =
  {
    manifest: {
      id: "google-form-trigger",
      suiteId: "apps",
      categoryId: "google-form",
      kind: "trigger",
      label: "Google Form",
      description: "Triggers workflow runs when a Google Form submission is received",
      accent: "bg-purple-600 text-white",
      requiredPlan: "pro",
      fields: [
        {
          key: "accessMode",
          label: "Access Mode",
          defaultValue: "private",
          options: [
            { label: "Private (Organization members only)", value: "private" },
            { label: "Public (Anyone can submit)", value: "public" },
          ],
        },
      ],
      outputs: [
        { path: "formId", label: "Form ID" },
        { path: "formTitle", label: "Form Title" },
        { path: "responseId", label: "Response ID" },
        { path: "respondentEmail", label: "Respondent Email" },
        { path: "timestamp", label: "Timestamp" },
        { path: "responses", label: "Responses" },
      ],
    },
    icon: ClipboardList,
    iconSvgPath: `<rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/>`,
    handleTopology: { type: "standard" },
    loadCustomInspector: () =>
      import(
        "@/features/workflows/components/rightSidebar/google-form-trigger-inspector"
      ),
    getInitialValues: () => ({
      accessMode: "private",
      secret: `whsec_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`,
    }),
    getTriggerFallback: () => ({
      formId: "sample-form-id",
      formTitle: "Sample Form",
      responseId: "sample-response-id",
      respondentEmail: "test@example.com",
      timestamp: new Date().toISOString(),
      responses: {
        "Sample Question": "Sample Answer",
      },
    }),
  }
