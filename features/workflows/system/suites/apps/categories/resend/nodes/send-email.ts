import { Mail } from "lucide-react"
import type { ActionNodeModule } from "../../../../../types/module"

export const sendEmailNodeModule: ActionNodeModule<"send-email"> = {
  manifest: {
    id: "send-email",
    suiteId: "apps",
    categoryId: "resend",
    kind: "action",
    label: "Send Email",
    description: "Sends a transactional email via Resend with dynamic token personalization",
    accent: "bg-sky-500 text-white",
    requiredSecrets: [
      {
        key: "RESEND_API_KEY",
        label: "Resend API Key",
        description: "Required to send emails from your organization",
      },
    ],
    fields: [
      {
        key: "to",
        label: "To",
        placeholder: "delivered@resend.dev",
        required: true,
      },
      {
        key: "subject",
        label: "Subject",
        placeholder: "Email subject",
        required: true,
      },
      {
        key: "body",
        label: "Body",
        placeholder: "Write your email body here...",
        multiline: true,
        required: true,
      },
    ],
    outputs: [{ path: "id", label: "Email ID" }],
  },
  icon: Mail,
  iconSvgPath: `<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>`,
  handleTopology: { type: "standard" },
  getInitialValues: () => ({
    to: "",
    subject: "",
    body: "",
  }),
}

