"use client"

import * as React from "react"
import { Lock } from "lucide-react"
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar"
import { useCredentials } from "./credentials-provider"

export function VaultSidebarButton() {
  const { openVault } = useCredentials()

  return (
    <SidebarMenu>
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
    </SidebarMenu>
  )
}
