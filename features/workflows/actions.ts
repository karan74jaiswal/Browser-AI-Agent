"use server"

import { auth } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"
import { runs, tasks } from "@trigger.dev/sdk"
import * as Sentry from "@sentry/nextjs"

import type { runWorkflowTask } from "@/features/workflows/tasks/run-workflow"
import {
  countWorkflows,
  createWorkflow,
  deleteWorkflow,
  getWorkflow,
  saveWorkflowGraph,
  updateWorkflowName,
} from "@/features/workflows/data"
import type { WorkflowGraph } from "@/lib/db"
import { liveblocks } from "@/lib/liveblocks"
import {
  nodeRegistry,
  type NodeDefinition,
  type NodeType,
  type StepNodeType,
} from "@/features/workflows/system"
import {
  getWorkflowLimit,
  PLAN_LIMITS,
} from "@/features/workflows/lib/plan-limits"
import { parseAndValidateWorkflowJson } from "@/features/workflows/lib/workflow-export-import"
import type { Edge } from "@xyflow/react"

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error)
}

export async function getWorkflowAction(id: string) {
  const { orgId } = await auth()

  if (!orgId || !id || typeof id !== "string") return null

  const workflow = await getWorkflow(orgId, id)

  return workflow ?? null
}

export async function createWorkflowAction(name: string) {
  const { orgId, has } = await auth()

  if (!orgId) throw new Error("Unauthorized: No active organization found")

  if (!name || typeof name !== "string" || name.trim().length === 0)
    throw new Error("Workflow name is required")

  const isPro = has({ plan: "pro" }) || has({ plan: "org:pro" })
  const currentPlan = isPro ? "pro" : "free"
  const limit = getWorkflowLimit(currentPlan)

  const currentCount = await countWorkflows(orgId)
  if (currentCount >= limit) {
    const planConfig = PLAN_LIMITS[currentPlan] ?? PLAN_LIMITS.free
    const upgradeSuggestion =
      currentPlan === "free"
        ? " Upgrade to Pro to create up to 20 workflows."
        : ""
    throw new Error(
      `Workflow limit reached: Your ${planConfig.name} plan allows up to ${limit} workflows.${upgradeSuggestion}`
    )
  }

  const workflow = await createWorkflow(orgId, name.trim())

  Sentry.logger.info("Workflow created", {
    "workflow.id": workflow.id,
    "org.id": orgId,
    plan: currentPlan,
  })

  revalidatePath("/workflows", "layout")
  return workflow
}

export async function updateWorkflowNameAction(id: string, name: string) {
  const { orgId } = await auth()

  if (!orgId) throw new Error("Unauthorized: No active organization found")

  if (!id || typeof id !== "string") throw new Error("Workflow ID is required")

  if (!name || typeof name !== "string" || name.trim().length === 0)
    throw new Error("Workflow name is required")

  const workflow = await updateWorkflowName(id, orgId, name.trim())

  if (!workflow) throw new Error("Workflow not found")

  try {
    await liveblocks.updateRoom(id, {
      metadata: {
        title: name.trim(),
      },
    })
  } catch (error) {
    Sentry.logger.warn("Failed to update Liveblocks room metadata", {
      "workflow.id": id,
      "org.id": orgId,
      reason: errorMessage(error),
    })
    Sentry.captureException(error)
  }

  Sentry.logger.info("Workflow renamed", {
    "workflow.id": id,
    "org.id": orgId,
  })

  revalidatePath("/workflows", "layout")
  revalidatePath(`/workflows/${id}`, "page")
  return workflow
}

export async function runWorkflowAction(id: string, graph: WorkflowGraph) {
  const { orgId, has } = await auth()

  if (!orgId) throw new Error("Unauthorized: No active organization found")

  if (!id || typeof id !== "string") throw new Error("Workflow ID is required")

  // Check if any node in the graph requires a plan or feature not granted to the organization
  for (const node of graph.nodes) {
    const nodeType = node.data?.type as NodeType
    const def: NodeDefinition | undefined = nodeRegistry[nodeType]
    if (def?.requiredPlan) {
      const isGranted = Boolean(
        has({ plan: def.requiredPlan }) ||
        has({ plan: `org:${def.requiredPlan}` })
      )
      if (!isGranted) {
        throw new Error(
          `Plan upgrade required: The "${def.label}" step requires the ${def.requiredPlan.toUpperCase()} plan.`
        )
      }
    }
    if (def?.requiredFeature) {
      if (!has({ feature: def.requiredFeature })) {
        throw new Error(
          `Feature upgrade required: The "${def.label}" step requires the "${def.requiredFeature}" feature.`
        )
      }
    }
  }

  await saveWorkflowGraph(id, orgId, graph)

  const handle = await tasks.trigger<typeof runWorkflowTask>(
    "run-workflow",
    {
      orgId,
      workflowId: id,
    },
    {
      tags: [`workflow:${id}`],
    }
  )

  Sentry.logger.info("Workflow run triggered", {
    "workflow.id": id,
    "org.id": orgId,
    "run.id": handle.id,
    "node.count": graph.nodes.length,
  })

  return handle
}

export async function saveWorkflowGraphAction(
  id: string,
  graph: WorkflowGraph
) {
  const { orgId } = await auth()

  if (!orgId) throw new Error("Unauthorized: No active organization found")
  if (!id || typeof id !== "string") throw new Error("Workflow ID is required")

  await saveWorkflowGraph(id, orgId, graph)
  return { success: true }
}

export async function deleteWorkflowAction(id: string) {
  const { orgId } = await auth()

  if (!orgId) throw new Error("Unauthorized: No active organization found")

  if (!id || typeof id !== "string") throw new Error("Workflow ID is required")

  const workflow = await deleteWorkflow(orgId, id)

  if (!workflow) throw new Error("Workflow not found")

  try {
    await liveblocks.deleteRoom(id)
  } catch (error) {
    Sentry.logger.warn("Failed to delete Liveblocks room", {
      "workflow.id": id,
      "org.id": orgId,
      reason: errorMessage(error),
    })
    Sentry.captureException(error)
  }

  Sentry.logger.info("Workflow deleted", {
    "workflow.id": id,
    "org.id": orgId,
  })

  revalidatePath("/workflows", "layout")
  revalidatePath("/", "layout")
  return { success: true }
}

export async function cancelWorkflowAction(runId: string) {
  const { orgId } = await auth()

  if (!orgId) throw new Error("Unauthorized: No active organization found")

  if (!runId || typeof runId !== "string") throw new Error("Run ID is required")

  const result = await runs.cancel(runId)

  Sentry.logger.info("Workflow run cancel requested", {
    "run.id": runId,
    "org.id": orgId,
  })

  return result
}

export async function importWorkflowAction(fileContent: string) {
  const { orgId, has } = await auth()

  if (!orgId) throw new Error("Unauthorized: No active organization found")

  const validation = parseAndValidateWorkflowJson(fileContent)
  if (!validation.success || !validation.data) {
    throw new Error(validation.error || "Invalid workflow file")
  }

  const { name, graph } = validation.data

  const isPro = has({ plan: "pro" }) || has({ plan: "org:pro" })
  const currentPlan = isPro ? "pro" : "free"
  const limit = getWorkflowLimit(currentPlan)

  const currentCount = await countWorkflows(orgId)
  if (currentCount >= limit) {
    const planConfig = PLAN_LIMITS[currentPlan] ?? PLAN_LIMITS.free
    const upgradeSuggestion =
      currentPlan === "free"
        ? " Upgrade to Pro to create up to 20 workflows."
        : ""
    throw new Error(
      `Workflow limit reached: Your ${planConfig.name} plan allows up to ${limit} workflows.${upgradeSuggestion}`
    )
  }

  // Create workflow record in DB
  const workflow = await createWorkflow(orgId, name.trim())

  // Save the imported nodes and edges
  await saveWorkflowGraph(workflow.id, orgId, {
    nodes: graph.nodes as StepNodeType[],
    edges: graph.edges as Edge[],
  })

  try {
    await liveblocks.updateRoom(workflow.id, {
      metadata: {
        title: name.trim(),
      },
    })
  } catch (error) {
    Sentry.logger.warn(
      "Failed to initialize Liveblocks room metadata for imported workflow",
      {
        "workflow.id": workflow.id,
        "org.id": orgId,
        reason: errorMessage(error),
      }
    )
  }

  Sentry.logger.info("Workflow imported", {
    "workflow.id": workflow.id,
    "org.id": orgId,
    "node.count": graph.nodes.length,
    plan: currentPlan,
  })

  revalidatePath("/workflows", "layout")
  return workflow
}
