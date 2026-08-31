import type { Metadata } from "next"
import { TaskChooseOrganization } from "@clerk/nextjs"

export const metadata: Metadata = {
  title: "Select Organization",
  description: "Select or create an organization to access your team workflows.",
}

export default function ChooseOrganizationPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <TaskChooseOrganization redirectUrlComplete="/" />
    </div>
  )
}
