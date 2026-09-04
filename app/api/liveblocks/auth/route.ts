import { auth, clerkClient } from "@clerk/nextjs/server"
import { liveblocks } from "@/lib/liveblocks"

export async function POST(request: Request) {
  const { userId, orgId } = await auth()

  if (!userId || !orgId) {
    return new Response("Unauthorized", { status: 401 })
  }

  const body = (await request.json().catch(() => ({}))) as {
    userInfo?: {
      name?: string
      avatar?: string
    }
  }

  let name =
    typeof body.userInfo?.name === "string" &&
    body.userInfo.name.trim().length > 0
      ? body.userInfo.name.trim()
      : ""

  let avatar =
    typeof body.userInfo?.avatar === "string" &&
    body.userInfo.avatar.trim().length > 0
      ? body.userInfo.avatar.trim()
      : undefined

  // Safety fallback for cold direct URL loads: if client couldn't resolve name before auth,
  // fetch from Clerk backend so the user is never mistakenly labeled "Anonymous"
  if (!name || name === "Anonymous") {
    try {
      const client = await clerkClient()
      const user = await client.users.getUser(userId)
      name =
        user.fullName ??
        user.firstName ??
        user.emailAddresses[0]?.emailAddress ??
        "Anonymous"
      if (!avatar && user.imageUrl) {
        avatar = user.imageUrl
      }
    } catch {
      name = "Anonymous"
    }
  }

  const groupIds = [orgId]

  const { status, body: liveblocksBody } = await liveblocks.identifyUser(
    {
      userId,
      groupIds,
      organizationId: orgId,
    },
    {
      userInfo: {
        name,
        avatar,
      },
    }
  )

  return new Response(liveblocksBody, { status })
}
