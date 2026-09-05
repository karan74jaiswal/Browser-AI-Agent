import type React from "react"
import {
  suitesCatalogDefinitions,
  appCategoriesCatalogDefinitions,
} from "./suites/definitions"
import type { WorkflowNodeModule } from "./types/module"

export interface PaletteSuiteMeta {
  id: string
  label: string
  description?: string
  icon: React.ComponentType<{ className?: string }>
  accent: string
  structure: "direct" | "categorized" | "mixed"
  hasCategories: boolean
  countLabel: string
}

export interface PaletteCategoryMeta {
  id: string
  suiteId: string
  label: string
  description?: string
  icon: React.ComponentType<{ className?: string }>
  brandColor?: string
  nodeCount: number
}

export interface LoadedNodeGroup {
  triggers: readonly WorkflowNodeModule[]
  actions: readonly WorkflowNodeModule[]
}

/**
 * 1. Pure Suite Metadata (Zero Node imports!)
 * Keeps memory at 0 nodes when browsing the top-level suites.
 */
export const paletteSuitesMetadata: readonly PaletteSuiteMeta[] = [
  {
    id: suitesCatalogDefinitions.flow.id,
    label: suitesCatalogDefinitions.flow.label,
    description: suitesCatalogDefinitions.flow.description,
    icon: suitesCatalogDefinitions.flow.icon,
    accent: suitesCatalogDefinitions.flow.accent,
    structure: "direct",
    hasCategories: false,
    countLabel: "7 nodes",
  },
  {
    id: suitesCatalogDefinitions.core.id,
    label: suitesCatalogDefinitions.core.label,
    description: suitesCatalogDefinitions.core.description,
    icon: suitesCatalogDefinitions.core.icon,
    accent: suitesCatalogDefinitions.core.accent,
    structure: "direct",
    hasCategories: false,
    countLabel: "8 nodes",
  },
  {
    id: suitesCatalogDefinitions.apps.id,
    label: suitesCatalogDefinitions.apps.label,
    description: suitesCatalogDefinitions.apps.description,
    icon: suitesCatalogDefinitions.apps.icon,
    accent: suitesCatalogDefinitions.apps.accent,
    structure: "categorized",
    hasCategories: true,
    countLabel: "6 apps",
  },
]

/**
 * 2. Pure Category Metadata for Apps (Zero Node imports!)
 * Keeps memory at 0 nodes when browsing the apps category list.
 */
export const paletteCategoriesMetadata: readonly PaletteCategoryMeta[] = [
  {
    id: appCategoriesCatalogDefinitions.browserbase.id,
    suiteId: "apps",
    label: appCategoriesCatalogDefinitions.browserbase.label,
    description: appCategoriesCatalogDefinitions.browserbase.description,
    icon: appCategoriesCatalogDefinitions.browserbase.icon,
    brandColor: appCategoriesCatalogDefinitions.browserbase.brandColor,
    nodeCount: 5,
  },
  {
    id: appCategoriesCatalogDefinitions.stripe.id,
    suiteId: "apps",
    label: appCategoriesCatalogDefinitions.stripe.label,
    description: appCategoriesCatalogDefinitions.stripe.description,
    icon: appCategoriesCatalogDefinitions.stripe.icon,
    brandColor: appCategoriesCatalogDefinitions.stripe.brandColor,
    nodeCount: 1,
  },
  {
    id: appCategoriesCatalogDefinitions.resend.id,
    suiteId: "apps",
    label: appCategoriesCatalogDefinitions.resend.label,
    description: appCategoriesCatalogDefinitions.resend.description,
    icon: appCategoriesCatalogDefinitions.resend.icon,
    brandColor: appCategoriesCatalogDefinitions.resend.brandColor,
    nodeCount: 1,
  },
  {
    id: appCategoriesCatalogDefinitions["google-form"].id,
    suiteId: "apps",
    label: appCategoriesCatalogDefinitions["google-form"].label,
    description: appCategoriesCatalogDefinitions["google-form"].description,
    icon: appCategoriesCatalogDefinitions["google-form"].icon,
    brandColor: appCategoriesCatalogDefinitions["google-form"].brandColor,
    nodeCount: 1,
  },
  {
    id: appCategoriesCatalogDefinitions.slack.id,
    suiteId: "apps",
    label: appCategoriesCatalogDefinitions.slack.label,
    description: appCategoriesCatalogDefinitions.slack.description,
    icon: appCategoriesCatalogDefinitions.slack.icon,
    brandColor: appCategoriesCatalogDefinitions.slack.brandColor,
    nodeCount: 1,
  },
  {
    id: appCategoriesCatalogDefinitions.discord.id,
    suiteId: "apps",
    label: appCategoriesCatalogDefinitions.discord.label,
    description: appCategoriesCatalogDefinitions.discord.description,
    icon: appCategoriesCatalogDefinitions.discord.icon,
    brandColor: appCategoriesCatalogDefinitions.discord.brandColor,
    nodeCount: 1,
  },
]

/**
 * 3. Dynamic Chunk Loaders: Only triggered when user clicks into an active suite or category.
 */
const paletteSuiteLoaders: Record<string, () => Promise<LoadedNodeGroup>> = {
  flow: async () => {
    const m = await import("./suites/flow")
    return {
      triggers: m.flowNodes.filter((n) => n.manifest.kind === "trigger"),
      actions: m.flowNodes.filter((n) => n.manifest.kind === "action"),
    }
  },
  core: async () => {
    const m = await import("./suites/core")
    return {
      triggers: m.coreNodes.filter((n) => n.manifest.kind === "trigger"),
      actions: m.coreNodes.filter((n) => n.manifest.kind === "action"),
    }
  },
}

const paletteCategoryLoaders: Record<string, () => Promise<LoadedNodeGroup>> = {
  browserbase: async () => {
    const m = await import("./suites/apps/categories/browserbase")
    return {
      triggers: m.browserbaseNodes.filter((n) => n.manifest.kind === "trigger"),
      actions: m.browserbaseNodes.filter((n) => n.manifest.kind === "action"),
    }
  },
  stripe: async () => {
    const m = await import("./suites/apps/categories/stripe")
    return {
      triggers: m.stripeNodes.filter((n) => n.manifest.kind === "trigger"),
      actions: m.stripeNodes.filter((n) => n.manifest.kind === "action"),
    }
  },
  resend: async () => {
    const m = await import("./suites/apps/categories/resend")
    return {
      triggers: m.resendNodes.filter((n) => n.manifest.kind === "trigger"),
      actions: m.resendNodes.filter((n) => n.manifest.kind === "action"),
    }
  },
  "google-form": async () => {
    const m = await import("./suites/apps/categories/google-form")
    return {
      triggers: m.googleFormNodes.filter((n) => n.manifest.kind === "trigger"),
      actions: m.googleFormNodes.filter((n) => n.manifest.kind === "action"),
    }
  },
  slack: async () => {
    const m = await import("./suites/apps/categories/slack")
    return {
      triggers: m.slackNodes.filter((n) => n.manifest.kind === "trigger"),
      actions: m.slackNodes.filter((n) => n.manifest.kind === "action"),
    }
  },
  discord: async () => {
    const m = await import("./suites/apps/categories/discord")
    return {
      triggers: m.discordNodes.filter((n) => n.manifest.kind === "trigger"),
      actions: m.discordNodes.filter((n) => n.manifest.kind === "action"),
    }
  },
}

const nodeGroupCache = new Map<string, Promise<LoadedNodeGroup>>()

export function loadPaletteNodeGroup(
  key: string,
  isSuite: boolean
): Promise<LoadedNodeGroup> {
  const cacheKey = `${isSuite ? "suite" : "cat"}:${key}`
  const existing = nodeGroupCache.get(cacheKey)
  if (existing) return existing

  const loader = isSuite
    ? paletteSuiteLoaders[key]
    : paletteCategoryLoaders[key]

  if (!loader) {
    return Promise.resolve({ triggers: [], actions: [] })
  }

  const promise = loader()
  nodeGroupCache.set(cacheKey, promise)
  return promise
}

export interface SearchNodeItem {
  mod: WorkflowNodeModule
  suiteLabel: string
  categoryLabel?: string
}

let cachedSearchNodesPromise: Promise<SearchNodeItem[]> | null = null

/**
 * Lazy search index loader: only executed when the user actually types a search query.
 */
export function loadAllSearchNodes(): Promise<SearchNodeItem[]> {
  if (cachedSearchNodesPromise) return cachedSearchNodesPromise

  cachedSearchNodesPromise = (async () => {
    const [
      flow,
      core,
      browserbase,
      stripe,
      resend,
      googleForm,
      slack,
      discord,
    ] = await Promise.all([
      import("./suites/flow"),
      import("./suites/core"),
      import("./suites/apps/categories/browserbase"),
      import("./suites/apps/categories/stripe"),
      import("./suites/apps/categories/resend"),
      import("./suites/apps/categories/google-form"),
      import("./suites/apps/categories/slack"),
      import("./suites/apps/categories/discord"),
    ])

    const list: SearchNodeItem[] = []

    for (const n of flow.flowNodes) {
      list.push({ mod: n, suiteLabel: "Flow" })
    }
    for (const n of core.coreNodes) {
      list.push({ mod: n, suiteLabel: "Core" })
    }
    for (const n of browserbase.browserbaseNodes) {
      list.push({ mod: n, suiteLabel: "Apps", categoryLabel: "Browserbase" })
    }
    for (const n of stripe.stripeNodes) {
      list.push({ mod: n, suiteLabel: "Apps", categoryLabel: "Stripe" })
    }
    for (const n of resend.resendNodes) {
      list.push({ mod: n, suiteLabel: "Apps", categoryLabel: "Resend" })
    }
    for (const n of googleForm.googleFormNodes) {
      list.push({ mod: n, suiteLabel: "Apps", categoryLabel: "Google Forms" })
    }
    for (const n of slack.slackNodes) {
      list.push({ mod: n, suiteLabel: "Apps", categoryLabel: "Slack" })
    }
    for (const n of discord.discordNodes) {
      list.push({ mod: n, suiteLabel: "Apps", categoryLabel: "Discord" })
    }

    return list
  })()

  return cachedSearchNodesPromise
}
