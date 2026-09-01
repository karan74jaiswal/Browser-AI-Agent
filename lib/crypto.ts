import crypto from "node:crypto"

const ALGORITHM = "aes-256-gcm"
const IV_LENGTH = 12 // Standard 96-bit nonce for AES-GCM

/**
 * Derives a 32-byte cryptographic key from the environment.
 * Uses SHA-256 to ensure a consistent 256-bit key length.
 */
function getVaultKey(): Buffer {
  const secret =
    process.env.VAULT_MASTER_KEY ||
    process.env.CLERK_SECRET_KEY ||
    process.env.TRIGGER_SECRET_KEY ||
    "nodus-default-development-vault-secret-key-32-bytes"

  return crypto.createHash("sha256").update(secret).digest()
}

export interface EncryptedPayload {
  encryptedValue: string
  iv: string
  authTag: string
  lastFour: string
}

/**
 * Encrypts a plaintext secret using AES-256-GCM authenticated encryption.
 */
export function encryptSecret(plainText: string): EncryptedPayload {
  if (!plainText) {
    throw new Error("Cannot encrypt empty or null secret")
  }

  const key = getVaultKey()
  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)

  let encrypted = cipher.update(plainText, "utf8", "base64")
  encrypted += cipher.final("base64")

  const authTag = cipher.getAuthTag().toString("base64")
  const lastFour =
    plainText.length > 4 ? plainText.slice(-4) : plainText

  return {
    encryptedValue: encrypted,
    iv: iv.toString("base64"),
    authTag,
    lastFour,
  }
}

/**
 * Decrypts an AES-256-GCM ciphertext. Throws an error if ciphertext or auth tag has been tampered with.
 */
export function decryptSecret(
  encryptedValue: string,
  iv: string,
  authTag: string
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

  let decrypted = decipher.update(encryptedValue, "base64", "utf8")
  decrypted += decipher.final("utf8")

  return decrypted
}
