export interface PasswordChecks {
  length: boolean
  uppercase: boolean
  number: boolean
  special: boolean
}

export interface PasswordStrengthResult {
  score: number
  checks: PasswordChecks
  label: string
  color: string
}

/**
 * Sanitizes a redirect URL to prevent open redirect vulnerabilities.
 * Ensures the destination is strictly a relative same-origin path within the app.
 */
export function sanitizeRedirectUrl(
  url: string | null | undefined,
  fallback = "/workflows"
): string {
  if (!url) return fallback

  const trimmed = url.trim()
  if (!trimmed) return fallback

  // Block protocol-relative (//evil.com) and backslash escapes (/\evil.com)
  if (!trimmed.startsWith("/") || trimmed.startsWith("//") || trimmed.startsWith("/\\")) {
    return fallback
  }

  // Block dangerous pseudo-protocols
  const lower = trimmed.toLowerCase()
  if (
    lower.includes("javascript:") ||
    lower.includes("data:") ||
    lower.includes("vbscript:")
  ) {
    return fallback
  }

  try {
    const parsed = new URL(trimmed, "http://localhost")
    if (parsed.origin !== "http://localhost") {
      return fallback
    }
    return `${parsed.pathname}${parsed.search}${parsed.hash}`
  } catch {
    return fallback
  }
}

export interface ResolveDestinationParams {
  currentTaskKey?: string | null
  redirectUrl?: string | null
  mode?: "sign-in" | "sign-up"
}

/**
 * Resolves post-auth destination in Clerk Core 3 based on pending session tasks
 * and user redirect destination.
 */
export function resolvePostAuthDestination({
  currentTaskKey,
  redirectUrl,
  mode = "sign-in",
}: ResolveDestinationParams): string {
  if (currentTaskKey === "choose-organization") {
    return "/choose-organization"
  }

  if (currentTaskKey) {
    return `/${mode}/tasks/${currentTaskKey}`
  }

  return sanitizeRedirectUrl(redirectUrl, "/workflows")
}

/**
 * Evaluates password strength and returns structured criteria checks, score (0-4),
 * and human-friendly status label/styling.
 */
export function evaluatePasswordStrength(password: string): PasswordStrengthResult {
  const checks: PasswordChecks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  }

  const score = password
    ? Object.values(checks).filter(Boolean).length
    : 0

  const label = ["Too short", "Weak", "Fair", "Good", "Strong"][score] || "Too short"
  const color = [
    "bg-destructive",
    "bg-orange-500",
    "bg-amber-500",
    "bg-blue-500",
    "bg-emerald-500",
  ][score] || "bg-destructive"

  return {
    score,
    checks,
    label,
    color,
  }
}
