import { Globe } from "lucide-react"
import type { ActionNodeModule } from "../../../types/module"

export const httpRequestNodeModule: ActionNodeModule<"http-request"> = {
  manifest: {
    id: "http-request",
    suiteId: "core",
    kind: "action",
    label: "HTTP Request",
    description: "Performs outbound REST API requests, webhooks, or GraphQL calls",
    accent: "bg-teal-600 text-white",
    fields: [
      {
        key: "endpoint",
        label: "Endpoint URL",
        placeholder: "https://api.example.com/v1/resource",
        required: true,
      },
      {
        key: "method",
        label: "Method",
        defaultValue: "GET",
        options: [
          { label: "GET", value: "GET" },
          { label: "POST", value: "POST" },
          { label: "PUT", value: "PUT" },
          { label: "PATCH", value: "PATCH" },
          { label: "DELETE", value: "DELETE" },
        ],
      },
      {
        key: "headers",
        label: "Headers (JSON)",
        placeholder:
          '{\n  "Authorization": "Bearer ...",\n  "Content-Type": "application/json"\n}',
        multiline: true,
      },
      {
        key: "body",
        label: "Request Body",
        placeholder:
          '{\n  "name": "Jane Doe",\n  "email": "jane@example.com"\n}',
        multiline: true,
      },
    ],
    outputs: [
      { path: "status", label: "Status Code" },
      { path: "statusText", label: "Status Text" },
      { path: "data", label: "Response Body" },
      { path: "headers", label: "Response Headers" },
    ],
  },
  icon: Globe,
  iconSvgPath: `<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>`,
  handleTopology: { type: "standard" },
  getInitialValues: () => ({
    method: "GET",
  }),
}

