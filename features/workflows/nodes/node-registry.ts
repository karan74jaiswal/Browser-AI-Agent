import type { Node } from "@xyflow/react"
import {
  AlertOctagon,
  Bot,
  ClipboardList,
  Clock,
  CreditCard,
  Eye,
  FileText,
  GitBranch,
  GitFork,
  Globe,
  Mail,
  MousePointerClick,
  Zap,
  type LucideIcon,
} from "lucide-react"
import { DiscordIcon } from "./discord"
import { SlackIcon } from "./slack"

export type StepNodeKind = "trigger" | "action"

export type NodeFieldOption = {
  label: string
  value: string
}

// One editable field on a node, rendered as an input in the inspector later.
export type NodeField = {
  key: string
  label: string
  placeholder?: string
  multiline?: boolean
  required?: boolean
  options?: NodeFieldOption[]
  defaultValue?: string
}

export type NodeOutput = {
  path: string
  label: string
}

// A node type's manifest entry. Add a node by adding an entry to nodeRegistry.
export type NodeDefinition = {
  type: string
  kind: StepNodeKind
  label: string
  icon: LucideIcon | React.ComponentType<{ className?: string }>
  accent: string // Tailwind classes for the icon chip color
  fields: NodeField[]
  outputs: NodeOutput[]
  requiredPlan?: "pro" | "enterprise" | (string & {})
  requiredFeature?: string
}

export const nodeRegistry = {
  start: {
    type: "start",
    kind: "trigger",
    label: "Start",
    icon: MousePointerClick,
    accent: "bg-blue-500 text-white",
    fields: [],
    outputs: [],
  },
  "google-form-trigger": {
    type: "google-form-trigger",
    kind: "trigger",
    label: "Google Form",
    icon: ClipboardList,
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
  "stripe-trigger": {
    type: "stripe-trigger",
    kind: "trigger",
    label: "Stripe",
    icon: CreditCard,
    accent: "bg-[#635BFF] text-white",
    requiredPlan: "pro",
    fields: [
      {
        key: "eventType",
        label: "Event Type",
        defaultValue: "payment_intent.succeeded",
        options: [
          {
            label: "Payment Succeeded (payment_intent.succeeded)",
            value: "payment_intent.succeeded",
          },
          {
            label: "Checkout Session Completed (checkout.session.completed)",
            value: "checkout.session.completed",
          },
          {
            label: "Subscription Created (customer.subscription.created)",
            value: "customer.subscription.created",
          },
          {
            label: "Invoice Paid (invoice.payment_succeeded)",
            value: "invoice.payment_succeeded",
          },
          {
            label: "Charge Succeeded (charge.succeeded)",
            value: "charge.succeeded",
          },
          {
            label: "All Events (Listen to any Stripe event)",
            value: "all",
          },
        ],
      },
    ],
    outputs: [
      { path: "amount", label: "Amount" },
      { path: "currency", label: "Currency" },
      { path: "customerEmail", label: "Customer Email" },
      { path: "customerId", label: "Customer ID" },
      { path: "eventType", label: "Event Type" },
      { path: "status", label: "Payment Status" },
      { path: "paymentIntentId", label: "Payment Intent ID" },
      { path: "rawEvent", label: "Raw Event Data" },
    ],
  },
  "open-url": {
    type: "open-url",
    kind: "action",
    label: "Open URL",
    icon: Globe,
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
  act: {
    type: "act",
    kind: "action",
    label: "Act",
    icon: Zap,
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
  extract: {
    type: "extract",
    kind: "action",
    label: "Extract",
    icon: FileText,
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
  observe: {
    type: "observe",
    kind: "action",
    label: "Observe",
    icon: Eye,
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
  agent: {
    type: "agent",
    kind: "action",
    label: "Agent",
    icon: Bot,
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
  "send-email": {
    type: "send-email",
    kind: "action",
    label: "Send Email",
    icon: Mail,
    accent: "bg-sky-500 text-white",
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
  "http-request": {
    type: "http-request",
    kind: "action",
    label: "HTTP Request",
    icon: Globe,
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
        placeholder: '{\n  "Authorization": "Bearer ...",\n  "Content-Type": "application/json"\n}',
        multiline: true,
      },
      {
        key: "body",
        label: "Request Body",
        placeholder: '{\n  "name": "Jane Doe",\n  "email": "jane@example.com"\n}',
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
  discord: {
    type: "discord",
    kind: "action",
    label: "Discord",
    icon: DiscordIcon,
    accent: "bg-[#5865F2] text-white",
    fields: [
      {
        key: "webhookUrl",
        label: "Webhook URL",
        placeholder: "https://discord.com/api/webhooks/...",
        required: true,
      },
      {
        key: "content",
        label: "Message Content",
        placeholder: "Summary: {{ Extract · Result }}",
        multiline: true,
        required: true,
      },
      {
        key: "username",
        label: "Bot Username (Optional)",
        placeholder: "Workflow Bot",
      },
    ],
    outputs: [
      { path: "messageContent", label: "Message Content" },
      { path: "success", label: "Success" },
    ],
  },
  slack: {
    type: "slack",
    kind: "action",
    label: "Slack",
    icon: SlackIcon,
    accent: "bg-[#4A154B] text-white",
    fields: [
      {
        key: "webhookUrl",
        label: "Webhook URL",
        placeholder: "https://hooks.slack.com/services/...",
        required: true,
      },
      {
        key: "content",
        label: "Message Content",
        placeholder: "Summary: {{ Extract · Result }}",
        multiline: true,
        required: true,
      },
      {
        key: "username",
        label: "Bot Username (Optional)",
        placeholder: "Workflow Bot",
      },
    ],
    outputs: [
      { path: "messageContent", label: "Message Content" },
      { path: "success", label: "Success" },
    ],
  },
  if: {
    type: "if",
    kind: "action",
    label: "If",
    icon: GitBranch,
    accent: "bg-amber-600 text-white",
    fields: [],
    outputs: [
      { path: "result", label: "Result (Boolean)" },
      { path: "branch", label: "Active Branch (true/false)" },
      { path: "reason", label: "Reason" },
    ],
  },
  switch: {
    type: "switch",
    kind: "action",
    label: "Switch",
    icon: GitFork,
    accent: "bg-orange-600 text-white",
    fields: [],
    outputs: [
      { path: "outputIndex", label: "Matched Output Index" },
      { path: "outputName", label: "Matched Output Name" },
      { path: "branch", label: "Active Branch" },
      { path: "value", label: "Evaluated Value" },
    ],
  },
  wait: {
    type: "wait",
    kind: "action",
    label: "Wait",
    icon: Clock,
    accent: "bg-indigo-600 text-white",
    fields: [
      {
        key: "seconds",
        label: "Wait Duration (seconds)",
        placeholder: "e.g. 5",
        defaultValue: "5",
        required: true,
      },
    ],
    outputs: [
      { path: "seconds", label: "Seconds Waited" },
      { path: "completedAt", label: "Completed At" },
    ],
  },
  "throw-error": {
    type: "throw-error",
    kind: "action",
    label: "Throw Error",
    icon: AlertOctagon,
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
} satisfies Record<string, NodeDefinition>

export type NodeType = keyof typeof nodeRegistry

// Plain JSON only (synced through Liveblocks later). type keys into the registry;
// kind and title are denormalized so the server can read them without the registry.
export type StepNodeData = {
  type: NodeType
  kind: StepNodeKind
  title: string
  values: Record<string, string>
}

export type StepNodeType = Node<StepNodeData, "step">

export type ActionNodeType = {
  [K in NodeType]: (typeof nodeRegistry)[K]["kind"] extends "action" ? K : never
}[NodeType]
