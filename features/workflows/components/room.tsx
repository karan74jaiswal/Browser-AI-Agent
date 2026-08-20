"use client"

import { PropsWithChildren } from "react"
import {
  LiveblocksProvider,
  RoomProvider,
  ClientSideSuspense,
} from "@liveblocks/react/suspense"
import { Spinner } from "@/components/ui/spinner"

interface RoomProps extends PropsWithChildren {
  roomId: string
}

export function Room({ roomId, children }: RoomProps) {
  return (
    <LiveblocksProvider
      authEndpoint="/api/liveblocks/auth"
      resolveUsers={async ({ userIds }) => {
        const response = await fetch("/api/liveblocks/users", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userIds }),
        })

        if (!response.ok) {
          return undefined
        }

        return await response.json()
      }}
      throttle={16}
    >
      <RoomProvider key={roomId} id={roomId}>
        <ClientSideSuspense
          fallback={
            <div className="flex min-h-svh items-center justify-center p-6">
              <Spinner className="size-6 text-muted-foreground" />
            </div>
          }
        >
          {children}
        </ClientSideSuspense>
      </RoomProvider>
    </LiveblocksProvider>
  )
}
