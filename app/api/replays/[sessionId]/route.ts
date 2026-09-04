import { auth } from "@clerk/nextjs/server"
import { APIError } from "@browserbasehq/sdk"
import * as Sentry from "@sentry/nextjs"
import { browserbase } from "@/lib/browserbase"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { userId, orgId, has } = await auth()

  if (!userId || !orgId) {
    return new Response("Unauthorized", { status: 401 })
  }

  const isPro = has({ plan: "pro" }) || has({ plan: "org:pro" })
  if (!isPro) {
    return new Response(
      "Forbidden: Pro plan required to view session recordings",
      {
        status: 403,
        headers: {
          "Content-Type": "text/plain",
        },
      }
    )
  }

  const { sessionId } = await params
  if (!sessionId) {
    return new Response("Session ID is required", { status: 400 })
  }

  const url = new URL(request.url)
  const pageId = url.searchParams.get("pageId")

  try {
    let targetPageId = pageId
    if (!targetPageId) {
      const meta = await browserbase.sessions.replays.retrieve(sessionId)
      const firstPage = meta.pages?.[0]
      if (!firstPage) {
        Sentry.logger.info("Session replay not ready", {
          "session.id": sessionId,
          "org.id": orgId,
        })
        return new Response("Replay not ready or no pages found", {
          status: 404,
          headers: {
            "Content-Type": "text/plain",
          },
        })
      }
      targetPageId = firstPage.pageId
    }

    const playlist = await browserbase.sessions.replays.retrievePage(
      sessionId,
      targetPageId
    )
    const m3u8 = await playlist.text()

    return new Response(m3u8, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.apple.mpegurl",
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    })
  } catch (err: unknown) {
    if (err instanceof APIError) {
      Sentry.logger.error("Browserbase replay API error", {
        "session.id": sessionId,
        "org.id": orgId,
        status: err.status ?? 500,
        reason: err.message,
      })
      return new Response(err.message, {
        status: err.status ?? 500,
        headers: {
          "Content-Type": "text/plain",
        },
      })
    }
    const message = err instanceof Error ? err.message : "Internal Server Error"
    Sentry.logger.error("Session replay fetch failed", {
      "session.id": sessionId,
      "org.id": orgId,
      reason: message,
    })
    Sentry.captureException(err)
    return new Response(message, {
      status: 500,
      headers: {
        "Content-Type": "text/plain",
      },
    })
  }
}
