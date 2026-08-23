import { and, desc, eq } from "drizzle-orm"
import { db, workflows } from "@/lib/db"
import type { Workflow, WorkflowGraph } from "@/lib/db"
import { validateGraph } from "./lib/validate-graph"

export function listWorkflows(orgId: string) {
  return db
    .select()
    .from(workflows)
    .where(eq(workflows.orgId, orgId))
    .orderBy(desc(workflows.createdAt))
}

export async function getWorkflow(params: {
  orgId: string
  id: string
}): Promise<Workflow | undefined>
export async function getWorkflow(
  orgId: string,
  id: string
): Promise<Workflow | undefined>
export async function getWorkflow(
  paramOrOrgId: string | { orgId: string; id: string },
  maybeId?: string
): Promise<Workflow | undefined> {
  const orgId =
    typeof paramOrOrgId === "object" ? paramOrOrgId.orgId : paramOrOrgId
  const id = typeof paramOrOrgId === "object" ? paramOrOrgId.id : maybeId!

  const [workflow] = await db
    .select()
    .from(workflows)
    .where(and(eq(workflows.orgId, orgId), eq(workflows.id, id)))

  return workflow
}

export async function createWorkflow(params: {
  orgId: string
  name: string
}): Promise<Workflow>
export async function createWorkflow(
  orgId: string,
  name: string
): Promise<Workflow>
export async function createWorkflow(
  paramOrOrgId: string | { orgId: string; name: string },
  maybeName?: string
): Promise<Workflow> {
  const orgId =
    typeof paramOrOrgId === "object" ? paramOrOrgId.orgId : paramOrOrgId
  const name = typeof paramOrOrgId === "object" ? paramOrOrgId.name : maybeName!

  const [workflow] = await db
    .insert(workflows)
    .values({
      orgId,
      name,
    })
    .returning()

  return workflow
}

export async function deleteWorkflow(params: {
  orgId: string
  id: string
}): Promise<Workflow | undefined>
export async function deleteWorkflow(
  orgId: string,
  id: string
): Promise<Workflow | undefined>
export async function deleteWorkflow(
  paramOrOrgId: string | { orgId: string; id: string },
  maybeId?: string
): Promise<Workflow | undefined> {
  const orgId =
    typeof paramOrOrgId === "object" ? paramOrOrgId.orgId : paramOrOrgId
  const id = typeof paramOrOrgId === "object" ? paramOrOrgId.id : maybeId!

  const [workflow] = await db
    .delete(workflows)
    .where(and(eq(workflows.orgId, orgId), eq(workflows.id, id)))
    .returning()

  return workflow
}

export async function saveWorkflowGraph(params: {
  id: string
  orgId: string
  graph: WorkflowGraph
}): Promise<void>
export async function saveWorkflowGraph(
  id: string,
  orgId: string,
  graph: WorkflowGraph
): Promise<void>
export async function saveWorkflowGraph(
  paramOrId: string | { id: string; orgId: string; graph: WorkflowGraph },
  maybeOrgId?: string,
  maybeGraph?: WorkflowGraph
): Promise<void> {
  const id = typeof paramOrId === "object" ? paramOrId.id : paramOrId
  const orgId = typeof paramOrId === "object" ? paramOrId.orgId : maybeOrgId!
  const graph = typeof paramOrId === "object" ? paramOrId.graph : maybeGraph!

  const problems = validateGraph(graph)
  if (problems.length > 0) {
    throw new Error(problems.join(" "))
  }

  await db
    .update(workflows)
    .set({
      graph,
      updatedAt: new Date(),
    })
    .where(and(eq(workflows.orgId, orgId), eq(workflows.id, id)))
}

export async function updateWorkflowName(params: {
  id: string
  orgId: string
  name: string
}): Promise<Workflow | undefined>
export async function updateWorkflowName(
  id: string,
  orgId: string,
  name: string
): Promise<Workflow | undefined>
export async function updateWorkflowName(
  paramOrId: string | { id: string; orgId: string; name: string },
  maybeOrgId?: string,
  maybeName?: string
): Promise<Workflow | undefined> {
  const id = typeof paramOrId === "object" ? paramOrId.id : paramOrId
  const orgId = typeof paramOrId === "object" ? paramOrId.orgId : maybeOrgId!
  const name = typeof paramOrId === "object" ? paramOrId.name : maybeName!

  const [workflow] = await db
    .update(workflows)
    .set({
      name,
      updatedAt: new Date(),
    })
    .where(and(eq(workflows.orgId, orgId), eq(workflows.id, id)))
    .returning()

  return workflow
}

