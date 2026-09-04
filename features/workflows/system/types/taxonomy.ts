/**
 * Taxonomy Types for the Workflow Node System
 *
 * Pre-identifies all valid Suites, Categories, and Node IDs at compile-time.
 * Designed to align with a future Node Database schema and package repository.
 */

export type PredefinedSuiteId = "flow" | "core" | "apps"
export type SuiteId = PredefinedSuiteId | "human-review" | "ai-data"

export type AppCategoryId =
  | "browserbase"
  | "stripe"
  | "resend"
  | "apify"
  | "google-form"
  | "slack"
  | "discord"

export type CategoryId = AppCategoryId

export type NodeKind = "trigger" | "action"

export type FlowNodeId =
  | "start"
  | "if"
  | "switch"
  | "merge"
  | "loop"
  | "wait"
  | "throw-error"

export type CoreNodeId = "js-code" | "python-code" | "http-request"

export type AppNodeId =
  // Browserbase (Cloud Browser & Automation)
  | "open-url"
  | "act"
  | "extract"
  | "observe"
  | "agent"
  // Stripe (Financial & Billing)
  | "stripe-trigger"
  // Resend (Email Communications)
  | "send-email"
  // Google Form (Forms & Surveys)
  | "google-form-trigger"
  // Slack & Discord (Messaging)
  | "slack"
  | "discord"

export type RegisteredNodeId = FlowNodeId | CoreNodeId | AppNodeId
