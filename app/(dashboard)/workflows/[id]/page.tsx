import { notFound } from "next/navigation"
import { ReactFlowProvider } from "@xyflow/react"
import { getWorkflowAction } from "@/features/workflows/actions"
import { WorkflowShell } from "@/features/workflows/components/workflow-shell"
import { Room } from "@/features/workflows/components/room"
import { liveblocks } from "@/lib/liveblocks"

interface PageProps {
  params: Promise<{
    id: string
  }>
}

export default async function Page({ params }: PageProps) {
  const { id } = await params
  const workflow = await getWorkflowAction(id)

  if (!workflow) {
    notFound()
  }

  await liveblocks.getOrCreateRoom(workflow.id, {
    organizationId: workflow.orgId,
    defaultAccesses: [],
    groupsAccesses: {
      [workflow.orgId]: ["room:write"],
    },
    metadata: {
      title: workflow.name,
    },
  })

  return (
    <Room roomId={workflow.id}>
      <ReactFlowProvider>
        <WorkflowShell workflowId={workflow.id} />
      </ReactFlowProvider>
    </Room>
  )
}
