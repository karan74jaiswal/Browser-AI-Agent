export async function httpRequest({
  endpoint,
  method = "GET",
  headers: rawHeaders,
  body,
}: {
  endpoint: string
  method?: string
  headers?: string
  body?: string
}) {
  if (!endpoint || !endpoint.trim()) {
    throw new Error("HTTP Request node: Endpoint URL is required")
  }

  const cleanUrl = endpoint.trim().replace(/[\u200B\uFEFF\u00A0]/g, "")
  const upperMethod = (method || "GET").toUpperCase()

  // Parse custom headers (support both JSON object string and key: value lines)
  const parsedHeaders: Record<string, string> = {}
  if (rawHeaders && rawHeaders.trim()) {
    try {
      const parsed = JSON.parse(rawHeaders.trim())
      if (
        typeof parsed === "object" &&
        parsed !== null &&
        !Array.isArray(parsed)
      ) {
        for (const [k, v] of Object.entries(parsed)) {
          parsedHeaders[k] = String(v)
        }
      }
    } catch {
      const lines = rawHeaders.split("\n")
      for (const line of lines) {
        const colonIdx = line.indexOf(":")
        if (colonIdx > 0) {
          const k = line.slice(0, colonIdx).trim()
          const v = line.slice(colonIdx + 1).trim()
          if (k) parsedHeaders[k] = v
        }
      }
    }
  }

  const fetchOptions: RequestInit = {
    method: upperMethod,
    headers: { ...parsedHeaders },
  }

  // Handle request body for methods that support payloads
  if (
    ["POST", "PUT", "PATCH", "DELETE"].includes(upperMethod) &&
    body &&
    body.trim()
  ) {
    const trimmedBody = body.trim()
    const hasContentType = Object.keys(parsedHeaders).some(
      (h) => h.toLowerCase() === "content-type"
    )

    if (!hasContentType) {
      if (
        (trimmedBody.startsWith("{") && trimmedBody.endsWith("}")) ||
        (trimmedBody.startsWith("[") && trimmedBody.endsWith("]"))
      ) {
        ;(fetchOptions.headers as Record<string, string>)["Content-Type"] =
          "application/json"
      }
    }
    fetchOptions.body = trimmedBody
  }

  const response = await fetch(cleanUrl, fetchOptions)

  // Extract response headers as a key-value record
  const responseHeaders: Record<string, string> = {}
  response.headers.forEach((val, key) => {
    responseHeaders[key] = val
  })

  const contentType = response.headers.get("content-type") || ""
  let responseData: unknown
  if (contentType.includes("application/json")) {
    try {
      responseData = await response.json()
    } catch {
      responseData = await response.text()
    }
  } else {
    responseData = await response.text()
  }

  if (!response.ok) {
    const errorDetails =
      typeof responseData === "string"
        ? responseData
        : JSON.stringify(responseData)
    throw new Error(
      `HTTP ${response.status} ${response.statusText}: ${errorDetails.slice(0, 300)}`
    )
  }

  return {
    status: response.status,
    statusText: response.statusText,
    data: responseData,
    headers: responseHeaders,
  }
}
