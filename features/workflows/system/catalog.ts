import type { PaletteCatalog } from "./types/suite"
import {
  suitesCatalogDefinitions,
  appCategoriesCatalogDefinitions,
} from "./suites/definitions"
import { flowNodes } from "./suites/flow"
import { coreNodes } from "./suites/core"
import {
  browserbaseNodes,
  stripeNodes,
  resendNodes,
  googleFormNodes,
  slackNodes,
  discordNodes,
} from "./suites/apps"

export const systemPaletteCatalog: PaletteCatalog = [
  {
    suite: suitesCatalogDefinitions.flow,
    directTriggers: flowNodes.filter((n) => n.manifest.kind === "trigger"),
    directActions: flowNodes.filter((n) => n.manifest.kind === "action"),
    categories: [],
  },
  {
    suite: suitesCatalogDefinitions.core,
    directTriggers: coreNodes.filter((n) => n.manifest.kind === "trigger"),
    directActions: coreNodes.filter((n) => n.manifest.kind === "action"),
    categories: [],
  },
  {
    suite: suitesCatalogDefinitions.apps,
    directTriggers: [],
    directActions: [],
    categories: [
      {
        category: appCategoriesCatalogDefinitions.browserbase,
        triggers: browserbaseNodes.filter((n) => n.manifest.kind === "trigger"),
        actions: browserbaseNodes.filter((n) => n.manifest.kind === "action"),
      },
      {
        category: appCategoriesCatalogDefinitions.stripe,
        triggers: stripeNodes.filter((n) => n.manifest.kind === "trigger"),
        actions: stripeNodes.filter((n) => n.manifest.kind === "action"),
      },
      {
        category: appCategoriesCatalogDefinitions.resend,
        triggers: resendNodes.filter((n) => n.manifest.kind === "trigger"),
        actions: resendNodes.filter((n) => n.manifest.kind === "action"),
      },
      {
        category: appCategoriesCatalogDefinitions["google-form"],
        triggers: googleFormNodes.filter((n) => n.manifest.kind === "trigger"),
        actions: googleFormNodes.filter((n) => n.manifest.kind === "action"),
      },
      {
        category: appCategoriesCatalogDefinitions.slack,
        triggers: slackNodes.filter((n) => n.manifest.kind === "trigger"),
        actions: slackNodes.filter((n) => n.manifest.kind === "action"),
      },
      {
        category: appCategoriesCatalogDefinitions.discord,
        triggers: discordNodes.filter((n) => n.manifest.kind === "trigger"),
        actions: discordNodes.filter((n) => n.manifest.kind === "action"),
      },
    ],
  },
]
