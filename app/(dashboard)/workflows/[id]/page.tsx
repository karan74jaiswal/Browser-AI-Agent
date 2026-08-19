import { WorkflowShell } from "@/features/workflows/components/workflow-shell"

interface PageProps {
  params: Promise<{
    id: string
  }>
}

export default async function Page({ params }: PageProps) {
  const { id } = await params

  return <WorkflowShell workflowId={id} />
}
