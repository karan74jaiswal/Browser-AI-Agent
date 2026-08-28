import type { DeserializedJson } from "@trigger.dev/core"
import type { NodeType, StepNodeKind } from "../nodes/node-registry"

export type RunStep = {
  id: string
  nodeId?: string
  edgeId?: string
  type: NodeType
  title: string
  kind?: StepNodeKind
  status: "pending" | "running" | "done" | "failed" | "skipped" | "canceled"
  startedAt?: number
  completedAt?: number
  duration?: number
  durationMs?: number
  output?: DeserializedJson
  error?: string
}

export type QueueItem = {
  nodeId: string
  edgeId?: string
}

export type RunWorkflowTaskInput = {
  workflowId: string
  orgId: string
  triggerData?: Record<string, unknown>
}

export type RunWorkflowTaskOutput = {
  steps: RunStep[]
  sessionId?: string
}
