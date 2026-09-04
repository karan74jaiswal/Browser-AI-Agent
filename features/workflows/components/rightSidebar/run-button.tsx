"use client"

import { Spinner } from "@/components/ui/spinner"
import { Button } from "@/components/ui/button"
import { useReactFlow } from "@xyflow/react"
import { Play } from "lucide-react"
import { useTransition } from "react"
import { toast } from "sonner"
import { runWorkflowAction } from "../../actions"
import { validateGraph } from "../../lib"
import { StepNodeType } from "../../nodes/node-registry"
import { useWorkflowRuns } from "../workflow-runs-provider"
import { useCredentials } from "@/features/credentials/components/credentials-provider"
import { useStatus } from "@liveblocks/react"

export default function RunButton({ workflowId }: { workflowId: string }) {
  const status = useStatus()
  const isConnected = status === "connected"
  const { getNodes, getEdges } = useReactFlow<StepNodeType>()
  const { latestRun, isLive, cancelingRunId, cancelRun } = useWorkflowRuns()
  const { availableSecretKeys } = useCredentials()
  const [isTriggering, startTriggerTransition] = useTransition()

  const isCanceling = Boolean(
    cancelingRunId && latestRun?.id === cancelingRunId && isLive
  )

  const handleRun = () => {
    const graph = { nodes: getNodes(), edges: getEdges() }

    // Instant in-memory validation using the organization's cached credentials (0ms delay)
    const problems = validateGraph(graph, availableSecretKeys)
    if (problems.length > 0) {
      toast.error(problems[0])
      return
    }

    startTriggerTransition(async () => {
      try {
        await runWorkflowAction(workflowId, graph)
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Failed to start workflow"
        )
      }
    })
  }

  const handleCancel = async () => {
    if (!latestRun?.id || isCanceling) return
    try {
      await cancelRun(latestRun.id)
      toast.success("Workflow cancellation requested")
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to cancel workflow"
      )
    }
  }

  if (isLive || isTriggering) {
    return (
      <Button
        size="sm"
        variant="destructive"
        disabled={isCanceling}
        onClick={handleCancel}
        className="gap-1.5"
      >
        {isCanceling ? (
          <>
            <Spinner className="size-3.5" />
            <span>Canceling...</span>
          </>
        ) : (
          <>
            <div className="relative flex size-3.5 shrink-0 items-center justify-center">
              <Spinner className="size-3.5 text-current" />
              <div className="absolute size-1 rounded-[0.5px] bg-current" />
            </div>
            <span>Stop</span>
          </>
        )}
      </Button>
    )
  }

  return (
    <Button
      size="sm"
      variant="secondary"
      onClick={handleRun}
      disabled={!isConnected}
      className="gap-1.5"
      title={!isConnected ? "Connecting to canvas..." : undefined}
    >
      <Play className="size-3.5 fill-primary" />
      <span>Run</span>
    </Button>
  )
}
