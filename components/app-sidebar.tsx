import { auth } from "@clerk/nextjs/server"
import { CustomOrgSwitcher } from "@/components/custom-org-switcher"
import { CustomUserButton } from "@/components/custom-user-button"

import Link from "next/link"
import { LayoutTemplate } from "lucide-react"

import { SidebarWorkflows } from "@/features/workflows/components/sidebar-workflows"
import { createWorkflowAction } from "@/features/workflows/actions"
import { listWorkflows } from "@/features/workflows/data"
import { VaultSidebarButton } from "@/features/credentials/components/vault-sidebar-button"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from "@/components/ui/sidebar"

export async function AppSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const { orgId } = await auth()
  const workflows = orgId ? await listWorkflows(orgId) : []

  return (
    <Sidebar variant="inset" collapsible="icon" {...props}>
      <SidebarHeader className="flex-row items-center justify-between gap-2 p-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0">
        <CustomOrgSwitcher />

        <SidebarTrigger className="h-8 w-8 shrink-0" />
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup className="p-2 pb-0">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                tooltip="Templates"
                className="h-9 px-3 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
              >
                <Link href="/templates">
                  <LayoutTemplate className="size-4 text-primary" />
                  <span>Templates</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
        <SidebarWorkflows
          workflows={workflows}
          createWorkflowAction={createWorkflowAction}
        />
      </SidebarContent>

      <SidebarFooter className="gap-2 p-2 group-data-[collapsible=icon]:items-center">
        <VaultSidebarButton />
        <CustomUserButton />
      </SidebarFooter>
    </Sidebar>
  )
}
