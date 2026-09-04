import type React from "react"
import type { SuiteId, AppCategoryId } from "./taxonomy"
import type { WorkflowNodeModule } from "./module"

export interface CategoryDefinition {
  readonly id: AppCategoryId
  readonly label: string
  readonly description?: string
  readonly icon: React.ComponentType<{ className?: string }>
  readonly brandColor?: string
}

export interface SuiteDefinition {
  readonly id: SuiteId
  readonly label: string
  readonly description?: string
  readonly icon: React.ComponentType<{ className?: string }>
  readonly accent: string
  /** Whether nodes in this suite are direct, categorized, or mixed */
  readonly structure: "direct" | "categorized" | "mixed"
}

export interface CatalogCategoryView {
  readonly category: CategoryDefinition
  readonly triggers: readonly WorkflowNodeModule[]
  readonly actions: readonly WorkflowNodeModule[]
}

export interface CatalogSuiteView {
  readonly suite: SuiteDefinition
  readonly directTriggers: readonly WorkflowNodeModule[]
  readonly directActions: readonly WorkflowNodeModule[]
  readonly categories: readonly CatalogCategoryView[]
}

export type PaletteCatalog = readonly CatalogSuiteView[]
