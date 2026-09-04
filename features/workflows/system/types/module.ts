import type React from "react"
import type { StepNodeType, NodeExecutor } from "./runtime"
import type { RegisteredNodeId } from "./taxonomy"
import type { NodeManifest } from "./manifest"
import type { NodeHandleTopology, NodeHandleComponent } from "./handles"

export interface CustomInspectorProps {
  node: StepNodeType
  workflowId: string
}

export interface CustomNodeBodyProps {
  node: StepNodeType
  values: Record<string, string>
}

export interface BaseNodeModule<TId extends RegisteredNodeId> {
  readonly manifest: NodeManifest<TId>
  readonly icon: React.ComponentType<{ className?: string }>
  readonly iconSvgPath: string
  readonly handleTopology: NodeHandleTopology
  readonly getInitialValues: () => Record<string, string>
  /**
   * Lazily loads the custom inspector component when selected in the Right Sidebar.
   * Dynamic loading keeps backend runners, Trigger.dev tasks, and test suites
   * 100% decoupled from client-side React/Clerk components.
   */
  readonly loadCustomInspector?: () => Promise<
    | { default: React.ComponentType<CustomInspectorProps> }
    | React.ComponentType<CustomInspectorProps>
  >
  readonly customBody?: React.ComponentType<CustomNodeBodyProps>
  /**
   * Custom handle component for specialized nodes (e.g. if, loop, switch).
   * Falls back to DefaultNodeHandles when not provided.
   */
  readonly handleComponent?: NodeHandleComponent
}

/**
 * Action nodes manifest module (client-safe design-time definition).
 */
export interface ActionNodeModule<TId extends RegisteredNodeId>
  extends BaseNodeModule<TId> {
  readonly manifest: NodeManifest<TId> & { readonly kind: "action" }
}


/**
 * Trigger nodes MUST provide a fallback mock payload generator for canvas test runs.
 */
export interface TriggerNodeModule<TId extends RegisteredNodeId>
  extends BaseNodeModule<TId> {
  readonly manifest: NodeManifest<TId> & { readonly kind: "trigger" }
  readonly getTriggerFallback: (
    values: Record<string, string>
  ) => Record<string, unknown>
}

export type WorkflowNodeModule<TId extends RegisteredNodeId = RegisteredNodeId> =
  | ActionNodeModule<TId>
  | TriggerNodeModule<TId>
