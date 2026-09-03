import * as React from "react"
import { auth } from "@clerk/nextjs/server"
import { CustomOrgSwitcher } from "@/components/custom-org-switcher"
import { SidebarNavFooter } from "@/components/sidebar-nav-footer"

import { SidebarWorkflows } from "@/features/workflows/components/sidebar-workflows"
import { SidebarWorkflowsSkeleton } from "@/features/workflows/components/sidebar-workflows-skeleton"
import { createWorkflowAction } from "@/features/workflows/actions"
import { listWorkflows } from "@/features/workflows/data"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarTrigger,
} from "@/components/ui/sidebar"

async function SidebarWorkflowsContent() {
  const { orgId } = await auth()
  const workflows = orgId ? await listWorkflows(orgId) : []

  return (
    <SidebarWorkflows
      workflows={workflows}
      createWorkflowAction={createWorkflowAction}
    />
  )
}

export function AppSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar variant="inset" collapsible="icon" {...props}>
      <SidebarHeader className="flex-row items-center justify-between gap-2 p-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-2">
        <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
          <CustomOrgSwitcher />
        </div>
        <SidebarTrigger className="h-8 w-8 shrink-0 group-data-[collapsible=icon]:mx-auto" />
      </SidebarHeader>

      <SidebarContent>
        <React.Suspense fallback={<SidebarWorkflowsSkeleton />}>
          <SidebarWorkflowsContent />
        </React.Suspense>
      </SidebarContent>

      <SidebarFooter className="p-2 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:p-1.5">
        <SidebarNavFooter />
      </SidebarFooter>
    </Sidebar>
  )
}
