import crypto from "node:crypto"

const ALGORITHM = "aes-256-gcm"
const IV_LENGTH = 12 // Standard 96-bit nonce for AES-GCM
const KDF_SALT = "nodus-credential-vault-salt-v1"
const KDF_INFO = "nodus-vault-aes-256-gcm-master-key"

/**
 * Derives a cryptographically strong 32-byte (256-bit) key using HKDF (RFC 5869).
 * Requires VAULT_MASTER_KEY to be set in environment variables with no insecure fallbacks.
 */
function getVaultKey(): Buffer {
  const secret = process.env.VAULT_MASTER_KEY?.trim()
  if (!secret) {
    throw new Error(
      "VAULT_MASTER_KEY environment variable is not configured. Please set a secure key in your environment variables."
    )
  }

  // Derive 32-byte key using HKDF-SHA256
  const derived = crypto.hkdfSync(
    "sha256",
    secret,
    KDF_SALT,
    KDF_INFO,
    32
  )

  return Buffer.from(derived)
}

export interface EncryptedPayload {
  encryptedValue: string
  iv: string
  authTag: string
  lastFour: string
}

/**
 * Encrypts a plaintext secret using AES-256-GCM authenticated encryption.
 * Cryptographically binds the ciphertext to the organization ID (AAD) when provided.
 */
export function encryptSecret(
  plainText: string,
  orgId?: string
): EncryptedPayload {
  if (!plainText) {
    throw new Error("Cannot encrypt empty or null secret")
  }

  const key = getVaultKey()
  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)

  if (orgId) {
    cipher.setAAD(Buffer.from(orgId, "utf8"))
  }

  let encrypted = cipher.update(plainText, "utf8", "base64")
  encrypted += cipher.final("base64")

  const authTag = cipher.getAuthTag().toString("base64")
  const lastFour = plainText.length > 4 ? plainText.slice(-4) : plainText

  return {
    encryptedValue: encrypted,
    iv: iv.toString("base64"),
    authTag,
    lastFour,
  }
}

/**
 * Decrypts an AES-256-GCM ciphertext and validates the authentication tag and tenant binding.
 * Throws an error if ciphertext, auth tag, or tenant ID has been tampered with or mismatched.
 */
export function decryptSecret(
  encryptedValue: string,
  iv: string,
  authTag: string,
  orgId?: string
): string {
  if (!encryptedValue || !iv || !authTag) {
    throw new Error("Missing required encryption payload parameters")
  }

  const key = getVaultKey()
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    key,
    Buffer.from(iv, "base64")
  )

  decipher.setAuthTag(Buffer.from(authTag, "base64"))

  if (orgId) {
    decipher.setAAD(Buffer.from(orgId, "utf8"))
  }

  let decrypted = decipher.update(encryptedValue, "base64", "utf8")
  decrypted += decipher.final("utf8")

  return decrypted
}
