"use server"

import { auth, clerkClient } from "@clerk/nextjs/server"

export interface EnsureDefaultOrgResult {
  success: boolean
  orgId?: string
  error?: string
}

/**
 * Ensures that a signed-in user has at least one organization workspace.
 * If the user has no organizations, automatically provisions "[Name]'s Workspace".
 */
export async function ensureDefaultOrganizationAction(
  authGetter?: typeof auth
): Promise<EnsureDefaultOrgResult> {
  try {
    const { userId, orgId } = await (authGetter || auth)()
    if (!userId) {
      return { success: false, error: "Not authenticated" }
    }

    if (orgId) {
      return { success: true, orgId }
    }

    const client = await clerkClient()
    const user = await client.users.getUser(userId)

    // Check if the user already belongs to any organization
    const memberships = await client.users.getOrganizationMembershipList({
      userId,
      limit: 10,
    })

    if (memberships.data.length > 0) {
      return { success: true, orgId: memberships.data[0].organization.id }
    }

    // Provision default workspace
    const displayName =
      user.firstName || user.username || user.emailAddresses[0]?.emailAddress?.split("@")[0] || "My"
    const workspaceName = `${displayName}'s Workspace`

    const newOrg = await client.organizations.createOrganization({
      name: workspaceName,
      createdBy: userId,
    })

    return { success: true, orgId: newOrg.id }
  } catch (err: unknown) {
    console.error("Failed to provision default organization:", err)
    const message = err instanceof Error ? err.message : "Failed to ensure default organization"
    return { success: false, error: message }
  }
}
