import type { WorkflowGraph } from "@/lib/db"

export type TemplateCategory =
  | "ai-agents"
  | "ecommerce-billing"
  | "lead-generation"
  | "marketing-comms"
  | "devops-monitoring"

export interface TemplateIntegration {
  name: string
  icon: string
  key: string // e.g. "RESEND_API_KEY", "STRIPE_SECRET_KEY"
  optional?: boolean
  description?: string
}

export interface WorkflowTemplate {
  id: string
  title: string
  shortDescription: string
  fullDescription: string
  category: TemplateCategory
  icon: string // Branded icon identifier or Lucide name
  accent: string // Badge background class
  requiredIntegrations: TemplateIntegration[]
  graph: WorkflowGraph
  estimatedRunTime: string
  author: {
    name: string
    avatarUrl?: string
  }
  highlights?: string[]
}

export interface CategoryMetadata {
  id: TemplateCategory | "all"
  label: string
  description: string
  iconName: string
}

export const TEMPLATE_CATEGORIES: CategoryMetadata[] = [
  {
    id: "all",
    label: "All Templates",
    description: "Explore all pre-built automation workflows",
    iconName: "LayoutGrid",
  },
  {
    id: "ecommerce-billing",
    label: "E-Commerce & Billing",
    description: "Payment recovery, checkout tracking, and churn prevention",
    iconName: "CreditCard",
  },
  {
    id: "ai-agents",
    label: "AI & Browser Agents",
    description: "Autonomous browser web scraping, research, and analysis",
    iconName: "Bot",
  },
  {
    id: "lead-generation",
    label: "Lead Generation",
    description: "Form lead scoring, routing, and qualification pipelines",
    iconName: "ClipboardList",
  },
  {
    id: "marketing-comms",
    label: "Marketing & Comms",
    description: "Multi-channel updates, newsletters, and announcements",
    iconName: "Mail",
  },
  {
    id: "devops-monitoring",
    label: "DevOps & Monitoring",
    description: "Price watchdogs, uptime monitors, and error alerts",
    iconName: "Eye",
  },
]
