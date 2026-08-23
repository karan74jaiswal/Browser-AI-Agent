import type { Stagehand } from "@browserbasehq/stagehand"

import type { NodeType, ActionNodeType } from "./node-registry"
import { openUrl } from "./open-url"

export type NodeContext = {
  values: Record<string, string>
  getStagehand(): Promise<Stagehand>
}

export type NodeExecutor = (ctx: NodeContext) => Promise<unknown>

export const nodeExecutors: Partial<Record<NodeType, NodeExecutor>> = {
  "open-url": async ({ values, getStagehand }) =>
    openUrl({ stagehand: await getStagehand(), url: values.url }),
} satisfies Record<ActionNodeType, NodeExecutor>
