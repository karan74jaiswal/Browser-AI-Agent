import type * as React from "react"
import type { Node } from "@xyflow/react"
import type { LucideIcon } from "lucide-react"
import type { Stagehand } from "@browserbasehq/stagehand"
import type { RegisteredNodeId, NodeKind } from "./taxonomy"
import type { NodeFieldOption, NodeSecretRequirement } from "./manifest"

export type StepNodeKind = NodeKind

export interface NodeField {
  readonly key: string
  readonly label: string
  readonly placeholder?: string
  readonly multiline?: boolean
  readonly required?: boolean
  readonly options?: readonly NodeFieldOption[]
  readonly defaultValue?: string
  readonly language?: "javascript" | "python"
}

export interface NodeOutput {
  readonly path: string
  readonly label: string
}

export interface NodeDefinition {
  readonly type: string
  readonly kind: StepNodeKind
  readonly label: string
  readonly icon: LucideIcon | React.ComponentType<{ className?: string }>
  readonly accent: string
  readonly fields: readonly NodeField[]
  readonly outputs: readonly NodeOutput[]
  readonly requiredSecrets?: readonly NodeSecretRequirement[]
  readonly requiredPlan?: "pro" | "enterprise" | (string & {})
  readonly requiredFeature?: string
  readonly maxInstances?: number
}

export type NodeType = RegisteredNodeId

export type StepNodeData = {
  type: NodeType
  kind: StepNodeKind
  title: string
  values: Record<string, string>
  [key: string]: unknown
}

export type StepNodeType = Node<StepNodeData, "step">

export type ActionNodeType = {
  [K in NodeType]: K extends
    | "open-url"
    | "act"
    | "extract"
    | "observe"
    | "agent"
    | "send-email"
    | "http-request"
    | "discord"
    | "slack"
    | "if"
    | "switch"
    | "merge"
    | "loop"
    | "wait"
    | "throw-error"
    | "js-code"
    | "python-code"
    ? K
    : never
}[NodeType]

export interface NodeContext {
  values: Record<string, string>
  secrets?: Record<string, string>
  getStagehand(): Promise<Stagehand>
}

export type NodeExecutor = (ctx: NodeContext) => Promise<unknown>
