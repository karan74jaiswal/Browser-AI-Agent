import { auth, currentUser } from "@clerk/nextjs/server"
import { APIError } from "@browserbasehq/sdk"
import { browserbase } from "@/lib/browserbase"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { userId, orgId } = await auth()
  const user = await currentUser()

  if (!userId || !user || !orgId) {
    return new Response("Unauthorized", { status: 401 })
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
      return new Response(err.message, {
        status: err.status ?? 500,
        headers: {
          "Content-Type": "text/plain",
        },
      })
    }
    const message = err instanceof Error ? err.message : "Internal Server Error"
    return new Response(message, {
      status: 500,
      headers: {
        "Content-Type": "text/plain",
      },
    })
  }
}
