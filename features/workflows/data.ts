import { desc, eq } from "drizzle-orm"
import { db, workflows } from "@/db"
import type { Workflow } from "@/db"

export function listWorkflows(orgId: string) {
  return db
    .select()
    .from(workflows)
    .where(eq(workflows.orgId, orgId))
    .orderBy(desc(workflows.createdAt))
}

export async function createWorkflow(
  params: { orgId: string; name: string }
): Promise<Workflow>
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
  const name =
    typeof paramOrOrgId === "object" ? paramOrOrgId.name : maybeName!

  const [workflow] = await db
    .insert(workflows)
    .values({
      orgId,
      name,
    })
    .returning()

  return workflow
}

