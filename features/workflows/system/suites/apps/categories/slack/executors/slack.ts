export async function sendSlackMessage({
  webhookUrl,
  content,
  username,
}: {
  webhookUrl: string
  content: string
  username?: string
}) {
  if (!webhookUrl || !webhookUrl.trim()) {
    throw new Error("Slack node: Webhook URL is required")
  }

  if (!content || !content.trim()) {
    throw new Error("Slack node: Message content is required")
  }

  const cleanUrl = webhookUrl.trim().replace(/[\u200B\uFEFF\u00A0]/g, "")
  const cleanContent = content.trim()
  const cleanUsername = username?.trim().replace(/[\u200B\uFEFF\u00A0]/g, "")

  const payload: { text: string; content: string; username?: string } = {
    text: cleanContent,
    content: cleanContent,
  }

  if (cleanUsername) {
    payload.username = cleanUsername
  }

  const response = await fetch(cleanUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => "")
    throw new Error(
      `Slack webhook failed with status ${response.status} (${response.statusText}): ${errorText.slice(0, 300)}`
    )
  }

  return {
    success: true,
    messageContent: cleanContent,
  }
}
