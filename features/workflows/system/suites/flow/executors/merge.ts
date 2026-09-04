export type MergeMode = "first" | "combine" | "array"
export type OnBranchFailureMode = "continue" | "halt"

export interface MergeNodeParams {
  values?: Record<string, string>
  results?: Record<string, unknown>
  incomingNodeIds?: string[]
  activeIncomingNodeIds?: string[]
  failedBranches?: Array<{ nodeId: string; title?: string; error: string }>
}

export interface MergeNodeOutput {
  mode: MergeMode
  result?: unknown
  sourceNodeId?: string
  sourceTitle?: string
  merged?: Record<string, unknown>
  items?: unknown[]
  count?: number
  activeCount: number
  failedCount: number
  hasErrors: boolean
  errors: Array<{ nodeId: string; title?: string; error: string }>
}

/**
 * Merge / Join Node Executor
 *
 * Synchronizes multiple incoming branches from If / Switch or parallel action paths,
 * combines healthy branch outputs, and cleanly isolates failed branches.
 */
export async function mergeNode({
  values = {},
  results = {},
  incomingNodeIds = [],
  activeIncomingNodeIds = [],
  failedBranches = [],
}: MergeNodeParams): Promise<MergeNodeOutput> {
  const mode: MergeMode = (values.mode as MergeMode) || "combine"
  const onBranchFailure: OnBranchFailureMode =
    (values.onBranchFailure as OnBranchFailureMode) || "continue"

  const hasErrors = failedBranches.length > 0

  if (hasErrors && onBranchFailure === "halt") {
    const firstErr = failedBranches[0]
    throw new Error(
      `Merge aborted: Branch "${firstErr.title || firstErr.nodeId}" failed with error: ${firstErr.error}`
    )
  }

  // Identify active incoming nodes that produced results
  const activeIds =
    activeIncomingNodeIds.length > 0
      ? activeIncomingNodeIds
      : incomingNodeIds.filter((id) => id in results)

  const activeCount = activeIds.length
  const failedCount = failedBranches.length

  const mergedMap: Record<string, unknown> = {}
  for (const nodeId of activeIds) {
    if (nodeId in results) {
      mergedMap[nodeId] = results[nodeId]
    }
  }

  if (mode === "combine") {
    return {
      mode: "combine",
      merged: mergedMap,
      result: mergedMap,
      activeCount,
      failedCount,
      hasErrors,
      errors: failedBranches,
    }
  }

  if (mode === "array") {
    const items: unknown[] = []
    for (const nodeId of activeIds) {
      const val = results[nodeId]
      if (val !== undefined && val !== null) {
        if (Array.isArray(val)) {
          items.push(...val)
        } else if (
          typeof val === "object" &&
          val !== null &&
          "items" in val &&
          Array.isArray((val as { items: unknown[] }).items)
        ) {
          items.push(...(val as { items: unknown[] }).items)
        } else {
          items.push(val)
        }
      }
    }

    return {
      mode: "array",
      items,
      count: items.length,
      result: items,
      merged: mergedMap,
      activeCount,
      failedCount,
      hasErrors,
      errors: failedBranches,
    }
  }

  // Mode: "first" (Pass-Through / Winner)
  const firstActiveNodeId = activeIds[0]
  const firstResult = firstActiveNodeId ? results[firstActiveNodeId] : undefined

  return {
    mode: "first",
    result: firstResult,
    sourceNodeId: firstActiveNodeId,
    merged: mergedMap,
    activeCount,
    failedCount,
    hasErrors,
    errors: failedBranches,
  }
}
