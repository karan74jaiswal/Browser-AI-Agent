import * as React from "react"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function SidebarWorkflowsSkeleton() {
  return (
    <>
      {/* Expanded mode skeleton */}
      <div className="flex flex-col gap-2 p-2 group-data-[collapsible=icon]:hidden">
        <SidebarMenu className="gap-y-0.5">
          <SidebarMenuItem>
            <div className="h-9 w-full rounded-md bg-muted/50 animate-pulse" />
          </SidebarMenuItem>
        </SidebarMenu>

        <SidebarGroup className="p-0 pt-2">
          <div className="flex items-center justify-between px-2 pb-2">
            <div className="h-3.5 w-16 rounded bg-muted/70 animate-pulse" />
            <div className="size-4 rounded bg-muted/60 animate-pulse" />
          </div>
          <SidebarGroupContent>
            <div className="flex flex-col gap-1">
              <div className="h-9 w-full rounded-md bg-muted/40 animate-pulse" />
              <div className="h-9 w-4/5 rounded-md bg-muted/40 animate-pulse" />
              <div className="h-9 w-3/4 rounded-md bg-muted/40 animate-pulse" />
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </div>

      {/* Collapsed mode skeleton */}
      <div className="hidden flex-col items-center gap-1.5 p-2 pt-0.5 group-data-[collapsible=icon]:flex">
        <div className="size-8 rounded-lg bg-muted/50 animate-pulse" />
        <div className="size-8 rounded-lg bg-muted/50 animate-pulse" />
      </div>
    </>
  )
}
