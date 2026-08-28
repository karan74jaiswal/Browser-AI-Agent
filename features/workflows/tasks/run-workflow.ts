import { logger, metadata, task } from "@trigger.dev/sdk"
import { getWorkflow } from "@/features/workflows/data"
import {
  browserbase,
  localBrowser,
  Stagehand,
  type StagehandBrowser,
} from "@browserbasehq/stagehand"
import { nodeExecutors } from "../nodes/node-executors"
import {
  evaluateIfConditions,
  interpolate,
  type ConditionCriterion,
  type LogicalCombinator,
} from "../lib"
import type { DeserializedJson } from "@trigger.dev/core"
import {
  nodeRegistry,
  type NodeType,
  type StepNodeKind,
  type StepNodeType,
} from "../nodes/node-registry"
import type { Edge } from "@xyflow/react"

export type RunStep = {
  id: string
  nodeId?: string
  edgeId?: string
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

type QueueItem = {
  nodeId: string
  edgeId?: string
}

const pace = (ms: number = 600) =>
  new Promise((resolve) => setTimeout(resolve, ms))

export const runWorkflowTask = task({
  id: "run-workflow",
  maxDuration: 300, // 5-minute timeout cap to prevent runaway browser compute
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
    const byId = new Map<string, StepNodeType>(nodes.map((n) => [n.id, n]))

    // Map incoming and outgoing connections for dependency graph execution
    const incomingEdges = new Map<string, Edge[]>()
    const outgoingEdges = new Map<string, Edge[]>()

    for (const edge of edges) {
      if (!edge.source || !edge.target) continue

      const inList = incomingEdges.get(edge.target) || []
      inList.push(edge)
      incomingEdges.set(edge.target, inList)

      const outList = outgoingEdges.get(edge.source) || []
      outList.push(edge)
      outgoingEdges.set(edge.source, outList)
    }

    const activeEdges = new Set<string>()
    const disabledEdges = new Set<string>()

    // Determine entry point (trigger node)
    const triggerNode =
      nodes.find((n) => n.data?.kind === "trigger") || nodes[0]
    if (!triggerNode) {
      throw new Error("No start node found in workflow")
    }

    const readyQueue: QueueItem[] = [{ nodeId: triggerNode.id }]
    const results: Record<string, unknown> = {}
    const steps: RunStep[] = []

    logger.log(`Running Workflow: ${workflow.name}`)

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

    let hasFailedStep = false
    let firstFailureError: Error | null = null

    try {
      while (readyQueue.length > 0) {
        const item = readyQueue.shift()!
        const nodeId = typeof item === "string" ? item : item.nodeId
        const edgeId = typeof item === "string" ? undefined : item.edgeId

        if (signal?.aborted) {
          for (const s of steps) {
            if (s.status === "running") s.status = "canceled"
            else if (s.status === "pending") s.status = "skipped"
          }
          metadata.set("steps", steps)
          await metadata.flush()
          throw new Error("Workflow run was canceled")
        }

        const node = byId.get(nodeId)
        if (!node) continue

        const def = nodeRegistry[node.data.type]
        const type = node.data.type as NodeType
        const title = node.data.title || def?.label || node.data.type || "Step"
        const kind = node.data.kind || def?.kind || "action"

        let step = steps.find(
          (s) =>
            (edgeId ? s.edgeId === edgeId : (s.nodeId === nodeId || s.id === nodeId)) &&
            s.status === "pending"
        )
        const startedAt = Date.now()
        if (!step) {
          step = {
            id: crypto.randomUUID(),
            nodeId,
            edgeId,
            type,
            title,
            kind,
            status: "running",
            startedAt,
          }
          steps.push(step)
        } else {
          step.status = "running"
          step.startedAt = startedAt
        }

        metadata.set("steps", steps)
        await metadata.flush()

        logger.log(`Running step: ${title} (${type})`)

        try {
          const interpolatedValues = Object.fromEntries(
            Object.entries(node.data.values ?? {}).map(([key, value]) => [
              key,
              interpolate(value, results),
            ])
          )

          let result: unknown

          if (type === "if") {
            const combinator =
              (node.data.values?.combinator as LogicalCombinator) || "and"
            let conditions: ConditionCriterion[] = []
            try {
              if (node.data.values?.conditions) {
                conditions = JSON.parse(node.data.values.conditions)
              }
            } catch {}

            const evaluationResult = evaluateIfConditions(
              conditions,
              combinator,
              results
            )
            const activeBranch = evaluationResult ? "true" : "false"
            const winningHandle = activeBranch

            result = {
              result: evaluationResult,
              branch: activeBranch,
              reason: `Evaluated ${evaluationResult ? "TRUE" : "FALSE"} via ${combinator.toUpperCase()} combinator`,
            }
            results[nodeId] = result

            const outEdges = outgoingEdges.get(nodeId) || []
            for (const edge of outEdges) {
              const handle =
                (edge as { sourceHandleId?: string | null; sourceHandle?: string | null })
                  .sourceHandleId ||
                (edge as { sourceHandleId?: string | null; sourceHandle?: string | null })
                  .sourceHandle ||
                "true"

              if (handle === winningHandle) {
                activeEdges.add(edge.id)
              } else {
                disabledEdges.add(edge.id)
              }
            }
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
            results[nodeId] = result

            const outEdges = outgoingEdges.get(nodeId) || []
            for (const edge of outEdges) {
              activeEdges.add(edge.id)
            }
          } else if (node.data.type === "stripe-trigger") {
            result = triggerData ?? {
              amount: "49.00",
              currency: "USD",
              customerEmail: "customer@example.com",
              customerId: "cus_sample12345",
              eventType:
                node.data.values?.eventType || "payment_intent.succeeded",
              status: "succeeded",
              paymentIntentId: "pi_sample12345",
              rawEvent: {
                id: "evt_sample12345",
                type: node.data.values?.eventType || "payment_intent.succeeded",
              },
            }
            results[nodeId] = result

            const outEdges = outgoingEdges.get(nodeId) || []
            for (const edge of outEdges) {
              activeEdges.add(edge.id)
            }
          } else {
            const executor = nodeExecutors[node.data.type]
            if (executor) {
              result = await executor({
                values: interpolatedValues,
                getStagehand,
              })
            }
            results[nodeId] = result

            const outEdges = outgoingEdges.get(nodeId) || []
            for (const edge of outEdges) {
              activeEdges.add(edge.id)
            }
          }

          if (!triggerData) {
            await pace(400)
          }

          const completedAt = Date.now()
          step.status = "done"
          step.completedAt = completedAt
          step.duration = completedAt - startedAt
          step.durationMs = completedAt - startedAt
          step.output = (result as DeserializedJson) ?? { completed: true }

          // Discover ready downstream child nodes
          const outEdges = outgoingEdges.get(nodeId) || []
          const newReadyChildren: QueueItem[] = []

          for (const edge of outEdges) {
            if (!activeEdges.has(edge.id)) continue

            const targetId = edge.target
            if (!targetId) continue

            newReadyChildren.push({ nodeId: targetId, edgeId: edge.id })

            // Register child node as "pending" for canvas handoff animation
            const childNode = byId.get(targetId)
            if (childNode) {
              const childDef = nodeRegistry[childNode.data.type]
              steps.push({
                id: crypto.randomUUID(),
                nodeId: targetId,
                edgeId: edge.id,
                type: childNode.data.type as NodeType,
                title:
                  childNode.data.title ||
                  childDef?.label ||
                  childNode.data.type ||
                  "Step",
                kind: childNode.data.kind || childDef?.kind || "action",
                status: "pending",
              })
            }
          }

          // Top-to-Bottom Canvas Priority: Sort sibling branches by canvas Y-coordinate
          newReadyChildren.sort((a, b) => {
            const nodeA = byId.get(a.nodeId)
            const nodeB = byId.get(b.nodeId)
            const yA = nodeA?.position?.y ?? 0
            const yB = nodeB?.position?.y ?? 0
            if (yA !== yB) return yA - yB

            const xA = nodeA?.position?.x ?? 0
            const xB = nodeB?.position?.x ?? 0
            return xA - xB
          })

          // Depth-First (DFS): Prepend direct child branch nodes to the front of readyQueue
          readyQueue.unshift(...newReadyChildren)

          metadata.set("steps", steps)
          await metadata.flush()
        } catch (error) {
          const isAbort =
            signal?.aborted ||
            (error instanceof Error && error.message.includes("canceled"))

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

          metadata.set("steps", steps)
          await metadata.flush()

          if (isAbort) {
            for (const s of steps) {
              if (s.status === "pending") s.status = "skipped"
            }
            metadata.set("steps", steps)
            await metadata.flush()
            throw error
          }

          // Branch-isolated failure: record failure and allow parallel sibling branches to continue
          hasFailedStep = true
          if (!firstFailureError) {
            firstFailureError =
              error instanceof Error ? error : new Error(String(error))
          }
          logger.error(`Step "${title}" failed: ${step.error}. Sibling branches will continue.`)
        }
      }

      // Sweep any remaining unreached pending steps
      for (const s of steps) {
        if (s.status === "pending") {
          s.status = "skipped"
        }
      }
      metadata.set("steps", steps)
      await metadata.flush()

      // If any step failed, throw after all sibling branches have finished
      if (hasFailedStep) {
        throw firstFailureError || new Error("Workflow finished with failed steps")
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
