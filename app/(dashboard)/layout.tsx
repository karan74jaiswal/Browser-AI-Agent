import { auth } from "@clerk/nextjs/server"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { CredentialsProvider } from "@/features/credentials/components/credentials-provider"
import { listOrgCredentials } from "@/features/credentials/data"

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const { orgId } = await auth()
  const initialCredentials = orgId ? await listOrgCredentials(orgId) : []

  return (
    <CredentialsProvider
      key={orgId ?? "personal"}
      initialCredentials={initialCredentials}
    >
      <SidebarProvider className="h-svh">
        <AppSidebar />
        <SidebarInset className="min-h-0 overflow-hidden border shadow-none!">
          {children}
        </SidebarInset>
      </SidebarProvider>
    </CredentialsProvider>
  )
}
