import { and, desc, eq } from "drizzle-orm"
import { db, credentials, type Credential, type NewCredential } from "@/lib/db"
import { encryptSecret, decryptSecret } from "@/lib/crypto"

export interface SafeCredential {
  id: string
  orgId: string
  name: string
  type: string
  description: string | null
  lastFour: string
  createdAt: Date
  updatedAt: Date
}

export interface CreateCredentialInput {
  name: string
  type?: string
  value: string
  description?: string
}

/**
 * Normalizes credential names to uppercase screaming snake case.
 * e.g. "openai-api-key" -> "OPENAI_API_KEY", "stripe key" -> "STRIPE_KEY"
 */
export function normalizeCredentialName(raw: string): string {
  return raw
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_]/g, "_")
    .replace(/_{2,}/g, "_")
}

/**
 * Lists safe credential metadata for an organization (no secrets exposed).
 */
export async function listOrgCredentials(
  orgId: string
): Promise<SafeCredential[]> {
  if (!orgId) return []

  const rows = await db
    .select({
      id: credentials.id,
      orgId: credentials.orgId,
      name: credentials.name,
      type: credentials.type,
      description: credentials.description,
      lastFour: credentials.lastFour,
      createdAt: credentials.createdAt,
      updatedAt: credentials.updatedAt,
    })
    .from(credentials)
    .where(eq(credentials.orgId, orgId))
    .orderBy(desc(credentials.createdAt))

  return rows
}

/**
 * Encrypts and stores a new credential scoped to an organization.
 */
export async function createOrgCredential(
  orgId: string,
  input: CreateCredentialInput
): Promise<SafeCredential> {
  if (!orgId) {
    throw new Error("Organization ID is required")
  }

  const name = normalizeCredentialName(input.name)
  if (!name || name.length === 0) {
    throw new Error("Credential name is required and must contain alphanumeric characters")
  }

  if (!input.value || input.value.trim().length === 0) {
    throw new Error("Credential secret value cannot be empty")
  }

  // Check for duplicate name in the same organization
  const existing = await db
    .select({ id: credentials.id })
    .from(credentials)
    .where(and(eq(credentials.orgId, orgId), eq(credentials.name, name)))
    .limit(1)

  if (existing.length > 0) {
    throw new Error(`A credential named "${name}" already exists in this organization`)
  }

  const encrypted = encryptSecret(input.value.trim())

  const [created] = await db
    .insert(credentials)
    .values({
      orgId,
      name,
      type: input.type || "generic",
      description: input.description?.trim() || null,
      encryptedValue: encrypted.encryptedValue,
      iv: encrypted.iv,
      authTag: encrypted.authTag,
      lastFour: encrypted.lastFour,
    })
    .returning({
      id: credentials.id,
      orgId: credentials.orgId,
      name: credentials.name,
      type: credentials.type,
      description: credentials.description,
      lastFour: credentials.lastFour,
      createdAt: credentials.createdAt,
      updatedAt: credentials.updatedAt,
    })

  return created
}

/**
 * Deletes a credential scoped to an organization.
 */
export async function deleteOrgCredential(
  orgId: string,
  credentialId: string
): Promise<boolean> {
  if (!orgId || !credentialId) return false

  const deleted = await db
    .delete(credentials)
    .where(
      and(eq(credentials.orgId, orgId), eq(credentials.id, credentialId))
    )
    .returning({ id: credentials.id })

  return deleted.length > 0
}

/**
 * Worker / Server-only helper: Decrypts all credentials for an organization into an in-memory dictionary.
 * Used exclusively inside Trigger.dev execution workers and server-side runners.
 */
export async function getDecryptedOrgSecrets(
  orgId: string
): Promise<Record<string, string>> {
  if (!orgId) return {}

  const rows = await db
    .select()
    .from(credentials)
    .where(eq(credentials.orgId, orgId))

  const secrets: Record<string, string> = {}

  for (const row of rows) {
    try {
      const decrypted = decryptSecret(row.encryptedValue, row.iv, row.authTag)
      secrets[row.name] = decrypted
    } catch (err) {
      console.error(
        `Failed to decrypt credential "${row.name}" for org "${orgId}":`,
        err
      )
    }
  }

  return secrets
}
