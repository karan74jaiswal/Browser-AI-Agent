import { Resend } from "resend"

export interface SendEmailParams {
  to: string
  subject: string
  body: string
  apiKey?: string
}

export interface SendEmailOutput {
  id: string
}

/**
 * Executes the Send Email node using the organization's Resend API Key from the Credential Vault.
 * Strictly requires the organization's own API key — never falls back to server env.
 */
export async function sendEmail({
  to,
  subject,
  body,
  apiKey,
}: SendEmailParams): Promise<SendEmailOutput> {
  const effectiveKey = apiKey?.trim()
  if (!effectiveKey) {
    throw new Error(
      "Send Email node failed: RESEND_API_KEY is not configured in your organization's Credential Vault."
    )
  }

  const cleanTo = (to || "").trim().replace(/[\u200B\uFEFF\u00A0]/g, "")
  const cleanSubject = (subject || "")
    .trim()
    .replace(/[\u200B\uFEFF\u00A0]/g, "")
  const cleanBody = (body || "").trim().replace(/[\u200B\uFEFF\u00A0]/g, "")

  if (!cleanTo) {
    throw new Error("Send Email node: 'To' address is required")
  }

  const client = new Resend(effectiveKey)
  const { data, error } = await client.emails.send({
    from: "onboarding@resend.dev",
    to: [cleanTo],
    subject: cleanSubject,
    text: cleanBody,
  })

  if (error) {
    throw new Error(`Resend Error: ${error.message}`)
  }

  return { id: data?.id || "" }
}
