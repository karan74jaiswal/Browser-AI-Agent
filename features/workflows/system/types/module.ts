import type React from "react"
import type { StepNodeType, NodeExecutor } from "./runtime"
import type { RegisteredNodeId } from "./taxonomy"
import type { NodeManifest } from "./manifest"
import type { NodeHandleTopology, NodeHandleComponent } from "./handles"
import type { NodeInspectorComponent, NodeInspectorProps } from "./inspectors"

export interface CustomInspectorProps {
  node: StepNodeType
  workflowId: string
}

export interface CustomNodeBodyProps {
  node: StepNodeType
  values: Record<string, string>
}

export interface InputTokenHandle {
  insertToken: (token: string) => void
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
    | { default: React.ComponentType<NodeInspectorProps> }
    | React.ComponentType<NodeInspectorProps>
  >
  readonly customBody?: React.ComponentType<CustomNodeBodyProps>
  /**
   * Custom handle component for specialized nodes (e.g. if, loop, switch).
   * Falls back to DefaultNodeHandles when not provided.
   */
  readonly handleComponent?: NodeHandleComponent
  /**
   * Custom inspector component for right sidebar editor tab.
   * Falls back to DefaultNodeInspector when not provided.
   */
  readonly inspectorComponent?: NodeInspectorComponent
  /**
   * Whether this node accepts upstream connection tokens (even if def.fields is empty).
   */
  readonly acceptsTokens?: boolean
  /**
   * Custom formatter for vault secret interpolation (e.g. process.env.KEY for JS, os.environ["KEY"] for Python).
   */
  readonly formatSecretToken?: (secretName: string) => string
  /**
   * Fallback logic when a user clicks a variable chip without an active input focused.
   */
  readonly onInsertTokenFallback?: (
    node: StepNodeType,
    token: string,
    updateNodeData: (id: string, data: Partial<StepNodeType["data"]>) => void,
    setActiveFieldKey?: (key: string) => void,
    getInputHandle?: (key: string) => InputTokenHandle | undefined
  ) => void
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
