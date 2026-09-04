import type React from "react"
import type { StepNodeType } from "./runtime"
import type { TokenInputHandle } from "@/features/workflows/components/token-input"

export interface NodeInspectorProps {
  node: StepNodeType
  workflowId: string
  onFocusField?: (key: string) => void
  registerInputRef?: (key: string, handle: TokenInputHandle | null) => void
}

export type NodeInspectorComponent = React.ComponentType<NodeInspectorProps>
