"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import { Building2, Lock, Settings } from "lucide-react"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useCredentials } from "@/features/credentials/components/credentials-provider"
import { CustomUserButton } from "@/components/custom-user-button"

export function SidebarNavFooter() {
  const pathname = usePathname()
  const { user } = useUser()
  const { state } = useSidebar()
  const { openVault } = useCredentials()

  const isWorkspaceActive = pathname === "/organization"
  const isSettingsActive = pathname === "/settings"

  const userDisplayName =
    user?.fullName ||
    user?.firstName ||
    user?.primaryEmailAddress?.emailAddress?.split("@")[0] ||
    "Account"

  return (
    <div className="flex w-full flex-col gap-1">
      <SidebarMenu className="gap-0.5">
        <SidebarMenuItem>
          <SidebarMenuButton
            onClick={() => openVault()}
            tooltip="Credential Vault"
            className="gap-2.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <Lock className="size-4 shrink-0 text-amber-500/80" />
            <span className="font-medium">Credential Vault</span>
          </SidebarMenuButton>
        </SidebarMenuItem>

        <SidebarMenuItem>
          <SidebarMenuButton
            asChild
            tooltip="Workspace Settings"
            isActive={isWorkspaceActive}
            className="gap-2.5 text-xs text-muted-foreground hover:text-foreground data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground"
          >
            <Link href="/organization">
              <Building2 className="size-4 shrink-0" />
              <span className="font-medium">Workspace</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>

        <SidebarMenuItem>
          <SidebarMenuButton
            asChild
            tooltip="Account Settings"
            isActive={isSettingsActive}
            className="gap-2.5 text-xs text-muted-foreground hover:text-foreground data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground"
          >
            <Link href="/settings">
              <Settings className="size-4 shrink-0" />
              <span className="font-medium">Settings</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>

      <div className="pt-1">
        {state === "collapsed" ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="w-full">
                <CustomUserButton />
              </div>
            </TooltipTrigger>
            <TooltipContent side="right" align="center" className="text-xs font-medium">
              <span>{userDisplayName}</span>
            </TooltipContent>
          </Tooltip>
        ) : (
          <CustomUserButton />
        )}
      </div>
    </div>
  )
}
