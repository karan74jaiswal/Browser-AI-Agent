"use client"

import * as React from "react"
import { OrganizationSwitcher, UserButton } from "@clerk/nextjs"
import { PlusIcon, WorkflowIcon } from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar"

const workflows = [
  { id: "1", name: "dominant-wasp" },
  { id: "2", name: "honest-reindeer" },
  { id: "3", name: "expected-llama" },
  { id: "4", name: "essential-ocelot" },
  { id: "5", name: "creepy-echidna" },
  { id: "6", name: "eastern-silkworm" },
  { id: "7", name: "cultural-lion" },
  { id: "8", name: "proud-weasel" },
  { id: "9", name: "regional-bonobo" },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [activeWorkflowId, setActiveWorkflowId] = React.useState("1")

  return (
    <Sidebar variant="inset" collapsible="icon" {...props}>
      <SidebarHeader className="p-2">
        <div className="flex items-center justify-between gap-2 group-data-[collapsible=icon]:justify-center">
          <div className="flex-1 overflow-hidden group-data-[collapsible=icon]:hidden">
            <OrganizationSwitcher
              hidePersonal
              afterCreateOrganizationUrl="/"
              afterSelectOrganizationUrl="/"
              afterLeaveOrganizationUrl="/choose-organization"
              afterSelectPersonalUrl="/"
              appearance={{
                elements: {
                  rootBox: "w-full",
                  organizationSwitcherTrigger: "w-full justify-between",
                },
              }}
            />
          </div>
          <SidebarTrigger className="h-8 w-8 shrink-0" />
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup className="p-2">
          <SidebarGroupLabel className="text-sm font-medium text-foreground">
            Workflows
          </SidebarGroupLabel>
          <SidebarGroupAction title="Create workflow">
            <PlusIcon className="size-4" />
            <span className="sr-only">Create workflow</span>
          </SidebarGroupAction>
          <SidebarGroupContent className="mt-1">
            <SidebarMenu className="gap-y-0.5">
              {workflows.map((workflow) => (
                <SidebarMenuItem key={workflow.id}>
                  <SidebarMenuButton
                    isActive={activeWorkflowId === workflow.id}
                    onClick={() => setActiveWorkflowId(workflow.id)}
                    tooltip={workflow.name}
                    className="h-9 px-3 text-sm font-normal data-[active=true]:bg-accent data-[active=true]:font-medium data-[active=true]:text-accent-foreground"
                  >
                    <WorkflowIcon className="size-4 shrink-0" />
                    <span>{workflow.name}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-2">
        <div className="flex items-center group-data-[collapsible=icon]:justify-center">
          <UserButton
            appearance={{
              elements: {
                rootBox:
                  "w-full group-data-[collapsible=icon]:w-auto flex group-data-[collapsible=icon]:justify-center",
              },
            }}
          />
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
