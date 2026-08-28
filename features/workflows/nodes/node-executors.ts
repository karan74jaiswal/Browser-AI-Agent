import type { Stagehand } from "@browserbasehq/stagehand"

import type { NodeType, ActionNodeType } from "./node-registry"
import { openUrl } from "./open-url"
import { act } from "./act"
import { extract } from "./extract"
import { observe } from "./observe"
import { agent } from "./agent"
import { sendEmail } from "./send-email"
import { httpRequest } from "./http-request"
import { sendDiscordMessage } from "./discord"
import { sendSlackMessage } from "./slack"
import { waitNode } from "./wait"
import {
  evaluateIfConditions,
  type ConditionCriterion,
  type LogicalCombinator,
} from "../lib/evaluate-condition"

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
  "send-email": async ({ values }) =>
    sendEmail({
      to: values.to,
      subject: values.subject,
      body: values.body,
    }),
  "http-request": async ({ values }) =>
    httpRequest({
      endpoint: values.endpoint,
      method: values.method || "GET",
      headers: values.headers,
      body: values.body,
    }),
  discord: async ({ values }) =>
    sendDiscordMessage({
      webhookUrl: values.webhookUrl,
      content: values.content,
      username: values.username,
    }),
  slack: async ({ values }) =>
    sendSlackMessage({
      webhookUrl: values.webhookUrl,
      content: values.content,
      username: values.username,
    }),
  if: async ({ values }) => {
    const combinator = (values.combinator as LogicalCombinator) || "and"
    let conditions: ConditionCriterion[] = []
    try {
      if (values.conditions) {
        conditions = JSON.parse(values.conditions)
      }
    } catch {}
    const result = evaluateIfConditions(conditions, combinator, {})
    return {
      result,
      branch: result ? "true" : "false",
      reason: `Evaluated ${result ? "TRUE" : "FALSE"} via ${combinator.toUpperCase()} combinator`,
    }
  },
  wait: async ({ values }) =>
    waitNode({ seconds: values.seconds }),
} satisfies Record<ActionNodeType, NodeExecutor>
