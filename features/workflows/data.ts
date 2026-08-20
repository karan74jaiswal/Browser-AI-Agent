import { and, desc, eq } from "drizzle-orm"
import { db, workflows } from "@/lib/db"
import type { Workflow } from "@/lib/db"

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
