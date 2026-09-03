import type { Metadata } from "next"
import { AccountSettingsView } from "@/features/settings/components/account-settings-view"

export const metadata: Metadata = {
  title: "Account Settings",
  description: "Manage your personal profile, credentials, and active sessions.",
}

export default function AccountSettingsPage() {
  return <AccountSettingsView />
}
