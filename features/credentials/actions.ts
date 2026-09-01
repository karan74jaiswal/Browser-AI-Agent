"use server"

import { auth } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"
import {
  listOrgCredentials,
  createOrgCredential,
  deleteOrgCredential,
  type CreateCredentialInput,
  type SafeCredential,
} from "./data"

export async function listCredentialsAction(): Promise<SafeCredential[]> {
  const { orgId } = await auth()
  if (!orgId) return []

  return listOrgCredentials(orgId)
}

export async function createCredentialAction(
  input: CreateCredentialInput
): Promise<SafeCredential> {
  const { orgId } = await auth()
  if (!orgId) {
    throw new Error("Unauthorized: No active organization found")
  }

  const credential = await createOrgCredential(orgId, input)
  revalidatePath("/workflows", "layout")
  return credential
}

export async function deleteCredentialAction(
  credentialId: string
): Promise<boolean> {
  const { orgId } = await auth()
  if (!orgId) {
    throw new Error("Unauthorized: No active organization found")
  }

  const success = await deleteOrgCredential(orgId, credentialId)
  revalidatePath("/workflows", "layout")
  return success
}
