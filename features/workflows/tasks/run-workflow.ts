import toposort from "toposort"
import { logger, task } from "@trigger.dev/sdk"
import { getWorkflow } from "@/features/workflows/data"
import { browserbase, localBrowser, Stagehand } from "@browserbasehq/stagehand"
import { nodeExecutors } from "../nodes/node-executors"

export const runWorkflowTask = task({
  id: "run-workflow",
  queue: {
    concurrencyLimit: 3, // Matches your Browserbase plan limit
  },
  retry: {
    maxAttempts: 2,
  },
  run: async ({ workflowId, orgId }: { workflowId: string; orgId: string }) => {
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

    let stagehand: Stagehand | undefined
    let browser:
      | Awaited<ReturnType<typeof browserbase.launch>>
      | Awaited<ReturnType<typeof localBrowser.launch>>
      | undefined

    const getStagehand = async (): Promise<Stagehand> => {
      if (stagehand) return stagehand
      try {
        browser = process.env.BROWSERBASE_API_KEY
          ? await browserbase.launch({
              apiKey: process.env.BROWSERBASE_API_KEY,
            })
          : await localBrowser.launch({ headless: true })

        stagehand = await Stagehand.create({
          browser,
          ...(process.env.OPENAI_API_KEY
            ? {
                model: {
                  modelName: "openai/gpt-5.4-mini",
                  apiKey: process.env.OPENAI_API_KEY,
                },
              }
            : {}),
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

    try {
      for (const id of order) {
        const node = byId.get(id)
        if (!node) continue

        logger.log(`Running step: ${node.data.title}`)

        const executor = nodeExecutors[node.data.type]
        if (executor)
          await executor({
            values: node.data.values,
            getStagehand,
          })
      }
    } finally {
      try {
        if (stagehand) {
          await stagehand.close()
        }
      } finally {
        if (browser) {
          await browser.close()
        }
      }
    }
  },
})
