import type { Metadata } from "next"
import { OrganizationSettingsView } from "@/features/settings/components/organization-settings-view"

export const metadata: Metadata = {
  title: "Organization Settings",
  description: "Manage your workspace details, collaborate with team members, and configure access permissions.",
}

export default function OrganizationSettingsPage() {
  return <OrganizationSettingsView />
}
