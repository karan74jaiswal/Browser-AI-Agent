import { TaskChooseOrganization } from "@clerk/nextjs"

export default function ChooseOrganizationPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <TaskChooseOrganization redirectUrlComplete="/" />
    </div>
  )
}
