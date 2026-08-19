"use client"

import * as React from "react"
import {
  CheckCircle2Icon,
  ClockIcon,
  Loader2Icon,
  PlayIcon,
  XCircleIcon,
} from "lucide-react"
import { toast } from "sonner"
import { useRealtimeRun } from "@trigger.dev/react-hooks"
import type { helloWorldTask } from "@/trigger/example"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { runWorkflowAction as defaultRunWorkflowAction } from "@/features/workflows/actions"

interface RightSidebarProps {
  runWorkflowAction?: () => Promise<{
    runId: string
    publicAccessToken: string
  }>
}

export function RightSidebar({
  runWorkflowAction = defaultRunWorkflowAction,
}: RightSidebarProps = {}) {
  const [isPending, startTransition] = React.useTransition()
  const [runState, setRunState] = React.useState<{
    runId: string
    publicAccessToken: string
  } | null>(null)

  const { run, error: realtimeError } = useRealtimeRun<typeof helloWorldTask>(
    runState?.runId,
    {
      accessToken: runState?.publicAccessToken,
      enabled: Boolean(runState?.runId && runState?.publicAccessToken),
    }
  )

  const handleRun = () => {
    startTransition(async () => {
      try {
        const result = await runWorkflowAction()
        setRunState(result)
        toast.success("Workflow triggered successfully")
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to trigger workflow"
        )
      }
    })
  }

  const isExecuting =
    isPending ||
    run?.status === "QUEUED" ||
    run?.status === "DEQUEUED" ||
    run?.status === "EXECUTING" ||
    run?.status === "WAITING" ||
    run?.status === "DELAYED" ||
    run?.status === "PENDING_VERSION"

  const renderStatusBadge = () => {
    if (!run) return null

    switch (run.status) {
      case "COMPLETED":
        return (
          <Badge className="bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/25 dark:text-emerald-400">
            <CheckCircle2Icon className="size-3" />
            Completed
          </Badge>
        )
      case "FAILED":
      case "CRASHED":
      case "SYSTEM_FAILURE":
      case "TIMED_OUT":
      case "EXPIRED":
        return (
          <Badge variant="destructive">
            <XCircleIcon className="size-3" />
            {run.status}
          </Badge>
        )
      case "CANCELED":
        return (
          <Badge variant="secondary">
            <XCircleIcon className="size-3" />
            Canceled
          </Badge>
        )
      default:
        return (
          <Badge
            variant="outline"
            className="border-amber-500/30 text-amber-600 dark:text-amber-400"
          >
            <Loader2Icon className="size-3 animate-spin" />
            {run.status}
          </Badge>
        )
    }
  }

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Workflow Actions</h3>
        <Button onClick={handleRun} disabled={isExecuting} size="sm">
          {isExecuting ? (
            <Loader2Icon className="size-3.5 animate-spin" />
          ) : (
            <PlayIcon className="size-3.5" />
          )}
          Run
        </Button>
      </div>

      {runState && (
        <Card size="sm" className="w-full">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-xs font-semibold">
                Task Feedback
              </CardTitle>
              {renderStatusBadge()}
            </div>
            <CardDescription className="truncate font-mono text-xs">
              ID: {runState.runId}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            {realtimeError && (
              <div className="rounded-md bg-destructive/10 p-2 text-destructive">
                Realtime error: {realtimeError.message}
              </div>
            )}

            {run && (
              <>
                {typeof run.durationMs === "number" && (
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <ClockIcon className="size-3.5" />
                    <span>Duration: {(run.durationMs / 1000).toFixed(2)}s</span>
                  </div>
                )}

                {run.output ? (
                  <div className="space-y-1">
                    <span className="font-medium text-foreground">Output:</span>
                    <pre className="overflow-x-auto rounded bg-muted p-2 font-mono text-[11px]">
                      {JSON.stringify(run.output, null, 2)}
                    </pre>
                  </div>
                ) : null}

                {run.error ? (
                  <div className="space-y-1">
                    <span className="font-medium text-destructive">Error:</span>
                    <pre className="overflow-x-auto rounded bg-destructive/10 p-2 font-mono text-[11px] text-destructive">
                      {JSON.stringify(run.error, null, 2)}
                    </pre>
                  </div>
                ) : null}
              </>
            )}

            {!run && !realtimeError && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2Icon className="size-3.5 animate-spin" />
                <span>Connecting to run stream...</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
