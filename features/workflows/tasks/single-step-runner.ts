import { logger, metadata } from "@trigger.dev/sdk"
import type { DeserializedJson } from "@trigger.dev/core"
import type { Edge } from "@xyflow/react"
import type { Stagehand } from "@browserbasehq/stagehand"
import { nodeRegistry, type NodeType, type StepNodeType } from "../nodes/node-registry"
import type { QueueItem, RunStep } from "./types"
import { cascadeDisabledEdges, discoverNextReadyChildren } from "./graph-traversal"
import { executeStep } from "./step-executor"

export interface ExecuteSingleNodeStepParams {
  nodeId: string
  edgeId?: string
  byId: Map<string, StepNodeType>
  steps: RunStep[]
  results: Record<string, unknown>
  secrets?: Record<string, string>
  triggerData?: Record<string, unknown>
  outgoingEdges: Map<string, Edge[]>
  incomingEdges: Map<string, Edge[]>
  activeEdges: Set<string>
  disabledEdges: Set<string>
  completedNodeIds: Set<string>
  failedNodeIds: Set<string>
  failedBranches: Array<{ nodeId: string; title?: string; error: string }>
  getStagehand: () => Promise<Stagehand>
  signal?: AbortSignal
}

export interface ExecuteSingleNodeStepResult {
  step: RunStep | null
  result: unknown
  readyChildren: QueueItem[]
  pendingSteps: RunStep[]
  isFailure: boolean
  error?: unknown
}

async function safeFlushMetadata(steps: RunStep[]) {
  try {
    metadata.set("steps", steps)
    await metadata.flush()
  } catch {
    // Gracefully no-op when running outside of Trigger.dev worker context (e.g. unit tests)
  }
}

/**
 * Orchestrates the full lifecycle of a single workflow step:
 * 1. Initializes / updates the Trigger.dev RunStep with running status.
 * 2. Streams real-time progress via metadata.flush().
 * 3. Executes the underlying node via executeStep.
 * 4. Records completion status, timing, output, and discovers ready downstream children.
 * 5. Handles error boundaries and cancellation abort signals.
 */
export async function executeSingleNodeStep({
  nodeId,
  edgeId,
  byId,
  steps,
  results,
  secrets,
  triggerData,
  outgoingEdges,
  incomingEdges,
  activeEdges,
  disabledEdges,
  completedNodeIds,
  failedNodeIds,
  failedBranches,
  getStagehand,
  signal,
}: ExecuteSingleNodeStepParams): Promise<ExecuteSingleNodeStepResult> {
  if (signal?.aborted) {
    for (const s of steps) {
      if (s.status === "running") s.status = "canceled"
      else if (s.status === "pending") s.status = "skipped"
    }
    await safeFlushMetadata(steps)
    throw new Error("Workflow run was canceled")
  }

  const node = byId.get(nodeId)
  if (!node) {
    return {
      step: null,
      result: null,
      readyChildren: [],
      pendingSteps: [],
      isFailure: false,
    }
  }

  const def = nodeRegistry[node.data.type]
  const type = node.data.type as NodeType
  const title = node.data.title || def?.label || node.data.type || "Step"
  const kind = node.data.kind || def?.kind || "action"

  let step = steps.find(
    (s) =>
      (edgeId ? s.edgeId === edgeId : s.nodeId === nodeId || s.id === nodeId) &&
      s.status === "pending"
  )
  const startedAt = Date.now()
  if (!step) {
    step = {
      id: crypto.randomUUID(),
      nodeId,
      edgeId,
      type,
      title,
      kind,
      status: "running",
      startedAt,
    }
    steps.push(step)
  } else {
    step.status = "running"
    step.startedAt = startedAt
  }

  await safeFlushMetadata(steps)

  logger.log(`Running step: ${title} (${type})`)

  try {
    const result = await executeStep({
      node,
      results,
      secrets,
      triggerData,
      outgoingEdges,
      incomingEdges,
      activeEdges,
      disabledEdges,
      failedBranches,
      byId,
      getStagehand,
    })

    completedNodeIds.add(nodeId)

    const completedAt = Date.now()
    step.status = "done"
    step.completedAt = completedAt
    step.duration = completedAt - startedAt
    step.durationMs = completedAt - startedAt
    step.output = (result as DeserializedJson) ?? { completed: true }

    const { readyChildren, pendingSteps } = discoverNextReadyChildren({
      nodeId,
      outgoingEdges,
      incomingEdges,
      activeEdges,
      disabledEdges,
      completedNodeIds,
      failedNodeIds,
      byId,
    })

    steps.push(...pendingSteps)

    await safeFlushMetadata(steps)

    return {
      step,
      result,
      readyChildren,
      pendingSteps,
      isFailure: false,
    }
  } catch (error) {
    const isAbort =
      signal?.aborted ||
      (error instanceof Error && error.message.includes("canceled"))

    const completedAt = Date.now()
    step.status = isAbort ? "canceled" : "failed"
    step.completedAt = completedAt
    step.duration = completedAt - startedAt
    step.durationMs = completedAt - startedAt
    step.error = isAbort
      ? "Workflow run was canceled"
      : error instanceof Error
        ? error.message
        : String(error)

    await safeFlushMetadata(steps)

    if (isAbort) {
      for (const s of steps) {
        if (s.status === "pending") s.status = "skipped"
      }
      await safeFlushMetadata(steps)
      throw error
    }

    failedNodeIds.add(nodeId)
    failedBranches.push({
      nodeId,
      title,
      error: step.error || "Step execution failed",
    })

    // Prune outgoing edges of the failed node down this branch
    const outEdges = outgoingEdges.get(nodeId) || []
    const newlyPruned: string[] = []
    for (const edge of outEdges) {
      disabledEdges.add(edge.id)
      newlyPruned.push(edge.id)
    }

    // Cascade disabled edges down non-merge branches so downstream Merge nodes know
    if (newlyPruned.length > 0) {
      cascadeDisabledEdges(newlyPruned, outgoingEdges, disabledEdges, byId)
    }

    // Check if any downstream Merge node can now proceed with remaining healthy branches
    const { readyChildren, pendingSteps } = discoverNextReadyChildren({
      nodeId,
      outgoingEdges,
      incomingEdges,
      activeEdges,
      disabledEdges,
      completedNodeIds,
      failedNodeIds,
      byId,
    })

    steps.push(...pendingSteps)

    await safeFlushMetadata(steps)

    return {
      step,
      result: null,
      readyChildren,
      pendingSteps,
      isFailure: true,
      error,
    }
  }
}
