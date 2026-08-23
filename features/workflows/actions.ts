"use server"

import { auth } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"
import { runs, tasks } from "@trigger.dev/sdk"

import type { runWorkflowTask } from "@/features/workflows/tasks/run-workflow"
import {
  createWorkflow,
  deleteWorkflow,
  getWorkflow,
  saveWorkflowGraph,
  updateWorkflowName,
} from "@/features/workflows/data"
import type { WorkflowGraph } from "@/lib/db"
import { liveblocks } from "@/lib/liveblocks"

export async function getWorkflowAction(id: string) {
  const { orgId } = await auth()

  if (!orgId || !id || typeof id !== "string") return null

  const workflow = await getWorkflow(orgId, id)

  return workflow ?? null
}

export async function createWorkflowAction(name: string) {
  const { orgId } = await auth()

  if (!orgId) throw new Error("Unauthorized: No active organization found")

  if (!name || typeof name !== "string" || name.trim().length === 0)
    throw new Error("Workflow name is required")

  const workflow = await createWorkflow(orgId, name.trim())

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
    console.error("Failed to update Liveblocks room metadata:", error)
  }

  revalidatePath("/workflows", "layout")
  revalidatePath(`/workflows/${id}`, "page")
  return workflow
}

export async function runWorkflowAction(id: string, graph: WorkflowGraph) {
  const { orgId } = await auth()

  if (!orgId) throw new Error("Unauthorized: No active organization found")

  if (!id || typeof id !== "string") throw new Error("Workflow ID is required")

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
  return handle
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
    console.error("Failed to delete Liveblocks room:", error)
  }

  revalidatePath("/workflows", "layout")
  revalidatePath("/", "layout")
  return { success: true }
}

export async function cancelWorkflowAction(runId: string) {
  const { orgId } = await auth()

  if (!orgId) throw new Error("Unauthorized: No active organization found")

  if (!runId || typeof runId !== "string") throw new Error("Run ID is required")

  const result = await runs.cancel(runId)

  return result
}
