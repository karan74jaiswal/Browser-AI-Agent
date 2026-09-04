import {
  GitBranch,
  Code2,
  Boxes,
  Globe,
  CreditCard,
  Mail,
  ClipboardList,
} from "lucide-react"
import { DiscordIcon } from "./apps/categories/discord/icon"
import { SlackIcon } from "./apps/categories/slack/icon"
import type {
  SuiteDefinition,
  CategoryDefinition,
} from "../types/suite"
import type { SuiteId, AppCategoryId } from "../types/taxonomy"

export const suitesCatalogDefinitions: Record<SuiteId, SuiteDefinition> = {
  flow: {
    id: "flow",
    label: "Flow",
    description: "Control flow, routing, and execution lifecycle primitives",
    icon: GitBranch,
    accent: "bg-blue-600 text-white",
    structure: "direct",
  },
  core: {
    id: "core",
    label: "Core",
    description: "Code sandboxes and network execution primitives",
    icon: Code2,
    accent: "bg-amber-600 text-white",
    structure: "direct",
  },
  apps: {
    id: "apps",
    label: "Apps",
    description: "Third-party application services and ecosystems",
    icon: Boxes,
    accent: "bg-purple-600 text-white",
    structure: "categorized",
  },
  "human-review": {
    id: "human-review",
    label: "Human Review",
    description: "Human-in-the-loop approvals, escalations, and manual input",
    icon: Boxes,
    accent: "bg-rose-600 text-white",
    structure: "mixed",
  },
  "ai-data": {
    id: "ai-data",
    label: "AI Data",
    description: "AI data extraction, transformation, and vector operations",
    icon: Boxes,
    accent: "bg-emerald-600 text-white",
    structure: "mixed",
  },
}

export const appCategoriesCatalogDefinitions: Record<
  AppCategoryId,
  CategoryDefinition
> = {
  browserbase: {
    id: "browserbase",
    label: "Browserbase",
    description: "Cloud browser sessions and AI-guided browser automation",
    icon: Globe,
    brandColor: "#FF4500",
  },
  stripe: {
    id: "stripe",
    label: "Stripe",
    description: "Payments, customer billing, and financial webhooks",
    icon: CreditCard,
    brandColor: "#635BFF",
  },
  resend: {
    id: "resend",
    label: "Resend",
    description: "Transactional and batch email communications",
    icon: Mail,
    brandColor: "#000000",
  },
  apify: {
    id: "apify",
    label: "Apify",
    description: "Cloud web scrapers, data extractors, and crawlers",
    icon: Globe,
    brandColor: "#00A699",
  },
  "google-form": {
    id: "google-form",
    label: "Google Forms",
    description: "Survey, lead capture, and form submission events",
    icon: ClipboardList,
    brandColor: "#7248B9",
  },
  slack: {
    id: "slack",
    label: "Slack",
    description: "Team notifications and incident channel alerts",
    icon: SlackIcon,
    brandColor: "#4A154B",
  },
  discord: {
    id: "discord",
    label: "Discord",
    description: "Community webhooks, bot alerts, and server messages",
    icon: DiscordIcon,
    brandColor: "#5865F2",
  },
}
