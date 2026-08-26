import toposort from "toposort"
import { logger, metadata, task, wait } from "@trigger.dev/sdk"
import { getWorkflow } from "@/features/workflows/data"
import {
  browserbase,
  localBrowser,
  Stagehand,
  type StagehandBrowser,
} from "@browserbasehq/stagehand"
import { nodeExecutors } from "../nodes/node-executors"
import { interpolate } from "../lib"
import type { DeserializedJson } from "@trigger.dev/core"
import {
  nodeRegistry,
  type NodeType,
  type StepNodeKind,
} from "../nodes/node-registry"

export type RunStep = {
  id: string
  nodeId?: string
  type: NodeType
  title: string
  kind?: StepNodeKind
  status: "pending" | "running" | "done" | "failed" | "skipped" | "canceled"
  startedAt?: number
  completedAt?: number
  duration?: number
  durationMs?: number
  output?: DeserializedJson
  error?: string
}

export const runWorkflowTask = task({
  id: "run-workflow",
  queue: {
    concurrencyLimit: 3, // Matches your Browserbase plan limit
  },
  retry: {
    maxAttempts: 1,
  },
  run: async (
    {
      workflowId,
      orgId,
      triggerData,
    }: {
      workflowId: string
      orgId: string
      triggerData?: Record<string, unknown>
    },
    { signal }
  ) => {
    const workflow = await getWorkflow(orgId, workflowId)

    if (!workflow?.graph) throw new Error(`Workflow ${workflowId} has no graph`)

    const { nodes, edges } = workflow.graph
    const byId = new Map(nodes.map((n) => [n.id, n]))

    const connected = new Set(
      edges.flatMap((edge) => [edge.source, edge.target])
    )

    const order = toposort
      .array(
        nodes.map((n) => n.id),
        edges.map((e) => [e.source, e.target])
      )
      .filter((id) => connected.has(id))
    logger.log(`Running Workflow ${workflow.name}`, { steps: order.length })

    const steps: RunStep[] = order.map((id) => {
      const node = byId.get(id)
      const type = (node?.data.type ?? "start") as NodeType
      const title =
        node?.data.title ??
        nodeRegistry[type]?.label ??
        (node?.data.type || "Step")
      const kind = node?.data.kind ?? nodeRegistry[type]?.kind ?? "action"
      return {
        id,
        nodeId: id,
        type,
        title,
        kind,
        status: "pending" as const,
      }
    })
    metadata.set("steps", steps)
    await metadata.flush()

    let stagehand: Stagehand | undefined
    let browser: StagehandBrowser | undefined
    let sessionId: string | undefined

    const getStagehand = async (): Promise<Stagehand> => {
      if (stagehand) return stagehand
      try {
        browser = process.env.BROWSERBASE_API_KEY
          ? await browserbase.launch({
              apiKey: process.env.BROWSERBASE_API_KEY,
              userMetadata: { stagehand: "true" },
            })
          : await localBrowser.launch({ headless: true })

        sessionId = browser.sessionId

        stagehand = await Stagehand.create({
          browser,
          model: {
            ...(process.env.BROWSERBASE_API_KEY
              ? {
                  modelName: "google/gemini-2.5-flash",
                }
              : {
                  modelName: "google/gemini-3.6-flash",
                  apiKey: process.env.GEMINI_API_KEY!,
                }),
          },
          logging: {
            level: "off",
          },
        })

        return stagehand
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err))
        logger.error("Failed to initialize browser session", {
          error: error.message,
        })
        throw error
      }
    }

    const results: Record<string, unknown> = {}

    try {
      for (const id of order) {
        if (signal?.aborted) {
          const currentIndex = order.indexOf(id)
          if (currentIndex !== -1) {
            for (let i = currentIndex; i < order.length; i++) {
              const remainingStep = steps.find((s) => s.id === order[i])
              if (remainingStep && (remainingStep.status === "pending" || remainingStep.status === "running")) {
                remainingStep.status = remainingStep.status === "running" ? "canceled" : "skipped"
              }
            }
          }
          metadata.set("steps", steps)
          await metadata.flush()
          throw new Error("Workflow run was canceled")
        }

        const node = byId.get(id)
        if (!node) continue

        logger.log(`Running step: ${node.data.title}`)

        const step = steps.find((s) => s.id === id)
        const startedAt = Date.now()
        if (step) {
          step.status = "running"
          step.startedAt = startedAt
          metadata.set("steps", steps)
          await metadata.flush()
        }

        try {
          const interpolatedValues = Object.fromEntries(
            Object.entries(node.data.values ?? {}).map(([key, value]) => [
              key,
              interpolate(value, results),
            ])
          )

          const executor = nodeExecutors[node.data.type]
          let result: unknown = undefined
          if (executor) {
            result = await executor({
              values: interpolatedValues,
              getStagehand,
            })
            results[id] = result
          } else if (node.data.type === "google-form-trigger") {
            result = triggerData ?? {
              formId: "sample-form-id",
              formTitle: "Sample Form",
              responseId: "sample-response-id",
              respondentEmail: "test@example.com",
              timestamp: new Date().toISOString(),
              responses: {
                "Sample Question": "Sample Answer",
              },
            }
            results[id] = result
            await wait.for({ seconds: 1 })
          } else {
            // Brief visual pacing for instant trigger nodes (e.g. 'start')
            // using Trigger.dev's durable wait mechanism.
            await wait.for({ seconds: 1 })
          }

          if (step) {
            const completedAt = Date.now()
            step.status = "done"
            step.completedAt = completedAt
            step.duration = completedAt - startedAt
            step.durationMs = completedAt - startedAt
            step.output = result as DeserializedJson
            metadata.set("steps", steps)
            await metadata.flush()
          }
        } catch (error) {
          const isAbort =
            signal?.aborted ||
            (error instanceof Error && error.message.includes("canceled"))
          if (step) {
            const completedAt = Date.now()
            step.status = isAbort ? "canceled" : "failed"
            step.completedAt = completedAt
            step.duration = completedAt - startedAt
            step.durationMs = completedAt - startedAt
            step.error = isAbort
              ? "Workflow run was canceled"
              : error instanceof Error
                ? error.message
                : String(error)
          }

          // Mark any remaining steps that never executed as skipped
          const currentIndex = order.indexOf(id)
          if (currentIndex !== -1) {
            for (let i = currentIndex + 1; i < order.length; i++) {
              const remainingStep = steps.find((s) => s.id === order[i])
              if (remainingStep && remainingStep.status === "pending") {
                remainingStep.status = "skipped"
              }
            }
          }

          metadata.set("steps", steps)
          await metadata.flush()
          throw error
        }
      }
    } finally {
      try {
        if (stagehand) {
          await stagehand.close()
        }
      } catch (err) {
        logger.warn("Stagehand session cleanup notice", {
          error: err instanceof Error ? err.message : String(err),
        })
      } finally {
        try {
          if (browser) {
            await browser.close()
          }
        } catch (err) {
          logger.warn("Browser session cleanup notice", {
            error: err instanceof Error ? err.message : String(err),
          })
        }
      }
    }

    return { steps, sessionId }
  },
})
