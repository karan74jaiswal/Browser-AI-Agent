import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { ReactFlowProvider } from "@xyflow/react"
import { auth } from "@trigger.dev/sdk"
import { getWorkflowAction } from "@/features/workflows/actions"
import { WorkflowShell } from "@/features/workflows/components/workflow-shell"
import { WorkflowRunsProvider } from "@/features/workflows/components/workflow-runs-provider"
import { Room } from "@/features/workflows/components/room"
import { liveblocks } from "@/lib/liveblocks"

interface PageProps {
  params: Promise<{
    id: string
  }>
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params
  const workflow = await getWorkflowAction(id)
  if (!workflow) {
    return { title: "Workflow Editor" }
  }
  return {
    title: workflow.name,
    description: `Edit and orchestrate the ${workflow.name} workflow on Nodus.`,
  }
}

export default async function Page({ params }: PageProps) {
  const { id } = await params
  const workflow = await getWorkflowAction(id)

  if (!workflow) {
    notFound()
  }

  const [publicAccessToken] = await Promise.all([
    auth.createPublicToken({
      scopes: {
        read: {
          tags: [`workflow:${workflow.id}`],
        },
      },
      expirationTime: "1h",
    }),
    liveblocks.getOrCreateRoom(workflow.id, {
      organizationId: workflow.orgId,
      defaultAccesses: [],
      groupsAccesses: {
        [workflow.orgId]: ["room:write"],
      },
      metadata: {
        title: workflow.name,
      },
    }),
  ])

  return (
    <Room roomId={workflow.id}>
      <ReactFlowProvider>
        <WorkflowRunsProvider
          workflowId={workflow.id}
          publicAccessToken={publicAccessToken}
        >
          <WorkflowShell
            workflowId={workflow.id}
            workflowName={workflow.name}
            initialGraph={workflow.graph}
          />
        </WorkflowRunsProvider>
      </ReactFlowProvider>
    </Room>
  )
}
