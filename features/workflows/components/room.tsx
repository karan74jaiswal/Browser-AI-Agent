"use client"

import { PropsWithChildren, useCallback } from "react"
import { useUser } from "@clerk/nextjs"
import {
  LiveblocksProvider,
  RoomProvider,
} from "@liveblocks/react/suspense"

interface RoomProps extends PropsWithChildren {
  roomId: string
}

export function Room({ roomId, children }: RoomProps) {
  const { user } = useUser()

  const authEndpoint = useCallback(
    async (room?: string) => {
      let currentUser = user
      if (!currentUser && typeof window !== "undefined") {
        const clerk = (
          window as unknown as {
            Clerk?: { loaded?: boolean; user?: typeof user }
          }
        ).Clerk
        if (clerk && !clerk.loaded) {
          await new Promise<void>((resolve) => {
            const start = Date.now()
            const check = () => {
              if (clerk.loaded || Date.now() - start > 1500) {
                resolve()
              } else {
                setTimeout(check, 20)
              }
            }
            check()
          })
        }
        if (clerk?.user) {
          currentUser = clerk.user
        }
      }

      const response = await fetch("/api/liveblocks/auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          room,
          userInfo: {
            name:
              currentUser?.fullName ??
              currentUser?.firstName ??
              currentUser?.emailAddresses[0]?.emailAddress ??
              "Anonymous",
            avatar: currentUser?.imageUrl,
          },
        }),
      })

      if (!response.ok) {
        return undefined
      }

      return await response.json()
    },
    [user]
  )

  const resolveUsers = useCallback(
    async ({ userIds }: { userIds: string[] }) => {
      const currentUserId = user?.id
      const currentUserInfo = {
        name:
          user?.fullName ??
          user?.firstName ??
          user?.emailAddresses[0]?.emailAddress ??
          "Anonymous",
        avatar: user?.imageUrl,
      }

      const otherUserIds = userIds.filter((id) => id !== currentUserId)
      const otherUsersMap = new Map<
        string,
        { name: string; avatar?: string } | undefined
      >()

      if (otherUserIds.length > 0) {
        const response = await fetch("/api/liveblocks/users", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userIds: otherUserIds }),
        })

        if (response.ok) {
          const remoteUsers: ({ name: string; avatar?: string } | null)[] =
            await response.json()
          otherUserIds.forEach((id, idx) => {
            const u = remoteUsers[idx]
            otherUsersMap.set(id, u ? { name: u.name, avatar: u.avatar } : undefined)
          })
        }
      }

      return userIds.map((id) => {
        if (id === currentUserId) return currentUserInfo
        return otherUsersMap.get(id)
      })
    },
    [user]
  )

  return (
    <LiveblocksProvider
      authEndpoint={authEndpoint}
      resolveUsers={resolveUsers}
      throttle={16}
    >
      <RoomProvider key={roomId} id={roomId}>
        {children}
      </RoomProvider>
    </LiveblocksProvider>
  )
}
