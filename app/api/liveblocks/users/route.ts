import { auth, clerkClient } from "@clerk/nextjs/server"

interface UserRequestBody {
  userIds: string[]
}

type UserInfo = Liveblocks["UserMeta"]["info"]

export async function POST(request: Request) {
  const { userId, orgId } = await auth()

  if (!userId || !orgId) {
    return new Response("Unauthorized", { status: 401 })
  }

  const body = (await request
    .json()
    .catch(() => ({}))) as Partial<UserRequestBody>
  const { userIds } = body

  if (!userIds || !Array.isArray(userIds)) {
    return new Response("Invalid request: userIds array is required", {
      status: 400,
    })
  }

  if (userIds.length === 0) {
    return Response.json([])
  }

  const client = await clerkClient()
  const response = await client.users.getUserList({
    userId: userIds,
    organizationId: [orgId],
    limit: userIds.length,
  })

  const userMap = new Map(response.data.map((user) => [user.id, user]))

  const users: (UserInfo | null)[] = userIds.map((id) => {
    const user = userMap.get(id)
    if (!user) {
      return null
    }

    const name =
      user.fullName ??
      user.firstName ??
      user.emailAddresses[0]?.emailAddress ??
      "Anonymous"

    return {
      name,
      avatar: user.imageUrl,
    }
  })

  return Response.json(users)
}
