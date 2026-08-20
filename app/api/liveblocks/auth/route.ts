import { auth, currentUser } from "@clerk/nextjs/server"
import { liveblocks } from "@/lib/liveblocks"

export async function POST(_request: Request) {
  const { userId, orgId } = await auth()
  const user = await currentUser()

  if (!userId || !user || !orgId) {
    return new Response("Unauthorized", { status: 401 })
  }

  const groupIds = [orgId]

  const { status, body } = await liveblocks.identifyUser(
    {
      userId,
      groupIds,
      organizationId: orgId,
    },
    {
      userInfo: {
        name:
          user.fullName ??
          user.firstName ??
          user.emailAddresses[0]?.emailAddress ??
          "Anonymous",
        avatar: user.imageUrl,
      },
    }
  )

  return new Response(body, { status })
}
