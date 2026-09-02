"use server"

import { auth } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"
import * as Sentry from "@sentry/nextjs"

import {
  countWorkflows,
  createWorkflow,
  saveWorkflowGraph,
} from "@/features/workflows/data"
import { liveblocks } from "@/lib/liveblocks"
import {
  getWorkflowLimit,
  PLAN_LIMITS,
} from "@/features/workflows/lib/plan-limits"
import { getTemplateById } from "./registry"
import { cloneTemplateGraph } from "./lib/clone-template"

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error)
}

export async function cloneWorkflowFromTemplateAction(
  templateId: string,
  customName?: string
): Promise<{ success: boolean; workflowId: string }> {
  const { orgId, has } = await auth()

  if (!orgId) {
    throw new Error("Unauthorized: No active organization found")
  }

  if (!templateId || typeof templateId !== "string") {
    throw new Error("Template ID is required")
  }

  const template = getTemplateById(templateId)
  if (!template) {
    throw new Error(`Template "${templateId}" was not found in the registry`)
  }

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

  const name = (customName?.trim() || template.title).trim()

  // Clone graph with fresh node IDs, remapped tokens and edges, and fresh webhook secrets
  const freshGraph = cloneTemplateGraph(template)

  // Insert workflow into Postgres
  const workflow = await createWorkflow(orgId, name)

  // Persist the cloned nodes and edges
  await saveWorkflowGraph(workflow.id, orgId, freshGraph)

  // Initialize Liveblocks room metadata
  try {
    await liveblocks.updateRoom(workflow.id, {
      metadata: {
        title: name,
      },
    })
  } catch (error) {
    Sentry.logger.warn(
      "Failed to initialize Liveblocks room metadata for cloned template",
      {
        "workflow.id": workflow.id,
        "template.id": templateId,
        "org.id": orgId,
        reason: errorMessage(error),
      }
    )
    Sentry.captureException(error)
  }

  Sentry.logger.info("Workflow cloned from template", {
    "workflow.id": workflow.id,
    "template.id": templateId,
    "org.id": orgId,
    "node.count": freshGraph.nodes.length,
    plan: currentPlan,
  })

  revalidatePath("/workflows", "layout")
  revalidatePath("/templates", "page")

  return { success: true, workflowId: workflow.id }
}
