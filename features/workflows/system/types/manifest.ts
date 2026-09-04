import type {
  NodeKind,
  RegisteredNodeId,
  SuiteId,
  AppCategoryId,
} from "./taxonomy"

export interface NodeFieldOption {
  readonly label: string
  readonly value: string
}

export interface NodeFieldDefinition {
  readonly key: string
  readonly label: string
  readonly placeholder?: string
  readonly multiline?: boolean
  readonly required?: boolean
  readonly defaultValue?: string
  readonly options?: readonly NodeFieldOption[]
  readonly language?: "javascript" | "python"
}

export interface NodeOutputDefinition {
  readonly path: string
  readonly label: string
}

export interface NodeSecretRequirement {
  readonly key: string
  readonly label: string
  readonly description?: string
  readonly optional?: boolean
}

/**
 * Pure, database-serializable manifest for a node.
 * This represents the exact shape that can be stored in a `nodes` table
 * in PostgreSQL or served by a remote Node Registry API.
 */
export interface NodeManifest<TId extends RegisteredNodeId = RegisteredNodeId> {
  readonly id: TId
  readonly suiteId: SuiteId
  /** Optional category: undefined for direct nodes (Flow, Core), required for Apps */
  readonly categoryId?: AppCategoryId
  readonly kind: NodeKind
  readonly label: string
  readonly description?: string
  readonly accent: string // Tailwind classes for the icon chip color
  readonly fields: readonly NodeFieldDefinition[]
  readonly outputs: readonly NodeOutputDefinition[]
  readonly requiredSecrets?: readonly NodeSecretRequirement[]
  readonly requiredPlan?: "pro" | "enterprise" | (string & {})
  readonly requiredFeature?: string
  readonly maxInstances?: number
  readonly version?: string
}
