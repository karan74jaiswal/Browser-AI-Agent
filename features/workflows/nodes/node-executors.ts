import type { Stagehand } from "@browserbasehq/stagehand"

import type { NodeType, ActionNodeType } from "./node-registry"
import { openUrl } from "./open-url"
import { act } from "./act"
import { extract } from "./extract"
import { observe } from "./observe"
import { agent } from "./agent"

export type NodeContext = {
  values: Record<string, string>
  getStagehand(): Promise<Stagehand>
}

export type NodeExecutor = (ctx: NodeContext) => Promise<unknown>

export const nodeExecutors: Partial<Record<NodeType, NodeExecutor>> = {
  "open-url": async ({ values, getStagehand }) =>
    openUrl({ stagehand: await getStagehand(), url: values.url }),
  act: async ({ values, getStagehand }) =>
    act({ stagehand: await getStagehand(), instruction: values.instruction }),
  extract: async ({ values, getStagehand }) =>
    extract({ stagehand: await getStagehand(), instruction: values.instruction }),
  observe: async ({ values, getStagehand }) =>
    observe({ stagehand: await getStagehand(), instruction: values.instruction }),
  agent: async ({ values, getStagehand }) => {
    const rawSteps = values.maxSteps ? parseInt(values.maxSteps, 10) : 10
    const allowedSteps = [10, 15, 20, 25, 30]
    const maxSteps = allowedSteps.includes(rawSteps) ? rawSteps : 10
    return agent({
      stagehand: await getStagehand(),
      instruction: values.instruction,
      maxSteps,
    })
  },
} satisfies Record<ActionNodeType, NodeExecutor>
