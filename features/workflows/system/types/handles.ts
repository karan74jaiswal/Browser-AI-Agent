import type * as React from "react"
import type { NodeProps, NodeConnection } from "@xyflow/react"
import type { StepNodeType } from "./runtime"

/**
 * Handle Topology Definitions
 *
 * Defines the connection interfaces (source handles) for each node.
 */
export type NodeHandleTopology =
  | { readonly type: "none" } // Trigger or terminal leaf node with no source handles
  | { readonly type: "standard" } // Standard 1-to-1 output on the right
  | {
      readonly type: "boolean"
      readonly trueHandleId: "true"
      readonly falseHandleId: "false"
    }
  | {
      readonly type: "loop"
      readonly doneHandleId: "done"
      readonly loopHandleId: "loop"
    }
  | {
      readonly type: "dynamic"
      readonly getHandles: (values: Record<string, string>) => Array<{
        readonly id: string
        readonly label: string
      }>
    }

/**
 * Props passed to custom or default node handle components.
 * Directly extends React Flow's NodeProps<StepNodeType> to avoid duplicate type definitions.
 */
export interface NodeHandlesProps extends NodeProps<StepNodeType> {
  readonly outgoingConnections: readonly NodeConnection[]
  readonly isLeafNode: boolean
  readonly isRunning: boolean
  readonly isDone: boolean
  readonly isFailed: boolean
  readonly isStepCanceling: boolean
  readonly winningBranch?: string
  readonly isLive: boolean
}

export type NodeHandleComponent = React.ComponentType<NodeHandlesProps> & {
  containerClassName?: string
  getContainerStyle?: (values: Record<string, string>) => React.CSSProperties
}

