"use server"

import { auth } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { auth as triggerAuth, tasks } from "@trigger.dev/sdk"
import type { helloWorldTask } from "@/trigger/example"

import { createWorkflow, getWorkflow } from "@/features/workflows/data"

export async function getWorkflowAction(id: string) {
  const { orgId } = await auth()

  if (!orgId) {
    return null
  }

  if (!id || typeof id !== "string") {
    return null
  }

  const workflow = await getWorkflow(orgId, id)

  return workflow ?? null
}

export async function createWorkflowAction(name: string) {
  const { orgId } = await auth()

  if (!orgId) {
    throw new Error("Unauthorized: No active organization found")
  }

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    throw new Error("Workflow name is required")
  }

  const workflow = await createWorkflow(orgId, name.trim())

  revalidatePath("/workflows", "layout")
  redirect(`/workflows/${workflow.id}`)
}

export async function runWorkflowAction() {
  const { orgId } = await auth()

  if (!orgId) {
    throw new Error("Unauthorized: No active organization found")
  }

  const handle = await tasks.trigger<typeof helloWorldTask>("hello-world", {
    message: "Hello from Right Sidebar",
  })
  const publicAccessToken = await triggerAuth.createPublicToken({
    scopes: {
      read: {
        runs: [handle.id],
      },
    },
  })

  return {
    runId: handle.id,
    publicAccessToken,
  }
}
