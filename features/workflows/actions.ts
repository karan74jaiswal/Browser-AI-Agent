"use server"

import { auth } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { createWorkflow } from "@/features/workflows/data"

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
