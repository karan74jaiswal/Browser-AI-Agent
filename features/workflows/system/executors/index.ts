import type { ActionNodeType, NodeExecutor } from "../types"

// Core executors
import {
  executeJsCode,
  prepareJsCode,
  formatJsExecutionError,
  type CodeExecutionOutput,
} from "../suites/core/executors/js-code"
import {
  executePythonCode,
  preparePythonCode,
  formatPythonExecutionError,
} from "../suites/core/executors/python-code"
import { httpRequest } from "../suites/core/executors/http-request"

// Flow executors
import {
  evaluateIfConditions,
  type ConditionCriterion,
  type LogicalCombinator,
} from "@/features/workflows/lib/evaluate-condition"
import { switchNode } from "../suites/flow/executors/switch"
import { mergeNode } from "../suites/flow/executors/merge"
import {
  loopNode,
  parseLoopItems,
  parseMaxIterations,
  shouldContinueWhileLoop,
} from "../suites/flow/executors/loop"
import { waitNode } from "../suites/flow/executors/wait"
import { throwErrorNode } from "../suites/flow/executors/throw-error"

// Apps executors
import { openUrl } from "../suites/apps/categories/browserbase/executors/open-url"
import { act } from "../suites/apps/categories/browserbase/executors/act"
import { extract } from "../suites/apps/categories/browserbase/executors/extract"
import { observe } from "../suites/apps/categories/browserbase/executors/observe"
import { agent } from "../suites/apps/categories/browserbase/executors/agent"
import { sendEmail } from "../suites/apps/categories/resend/executors/send-email"
import { sendSlackMessage } from "../suites/apps/categories/slack/executors/slack"
import { sendDiscordMessage } from "../suites/apps/categories/discord/executors/discord"

/**
 * Server-only Action Node Executors.
 * Strictly isolated from client UI manifests to prevent bundling Node.js SDKs (e.g. E2B, Stagehand) in browser chunks.
 */
export const systemNodeExecutors: Record<ActionNodeType, NodeExecutor> = {
  // Core
  "js-code": async ({ values, secrets }) =>
    executeJsCode({
      code: values.code,
      envs: secrets,
    }),
  "python-code": async ({ values, secrets }) =>
    executePythonCode({
      code: values.code,
      envs: secrets,
    }),
  "http-request": async ({ values }) =>
    httpRequest({
      endpoint: values.endpoint,
      method: values.method || "GET",
      headers: values.headers,
      body: values.body,
    }),

  // Flow
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
  switch: async ({ values }) => switchNode({ values }),
  merge: async ({ values }) => mergeNode({ values }),
  loop: async ({ values }) => loopNode({ values }),
  wait: async ({ values }) => waitNode({ seconds: values.seconds }),
  "throw-error": async ({ values }) =>
    throwErrorNode({ message: values.message }),

  // Apps
  "open-url": async ({ values, getStagehand }) =>
    openUrl({ stagehand: await getStagehand(), url: values.url }),
  act: async ({ values, getStagehand }) =>
    act({ stagehand: await getStagehand(), instruction: values.instruction }),
  extract: async ({ values, getStagehand }) =>
    extract({
      stagehand: await getStagehand(),
      instruction: values.instruction,
    }),

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
  "send-email": async ({ values, secrets }) =>
    sendEmail({
      to: values.to,
      subject: values.subject,
      body: values.body,
      apiKey: secrets?.RESEND_API_KEY,
    }),
  slack: async ({ values }) =>
    sendSlackMessage({
      webhookUrl: values.webhookUrl,
      content: values.content,
      username: values.username,
    }),
  discord: async ({ values }) =>
    sendDiscordMessage({
      webhookUrl: values.webhookUrl,
      content: values.content,
      username: values.username,
    }),
} satisfies Record<ActionNodeType, NodeExecutor>

export const nodeExecutors = systemNodeExecutors

// Re-export utility functions and types for server tasks / test suites
export {
  executeJsCode,
  prepareJsCode,
  formatJsExecutionError,
  type CodeExecutionOutput,
}
export {
  executePythonCode,
  preparePythonCode,
  formatPythonExecutionError,
}
export { httpRequest }
export { switchNode }
export { mergeNode }
export { loopNode, parseLoopItems, parseMaxIterations, shouldContinueWhileLoop }

export { waitNode }
export { throwErrorNode }
export { openUrl, act, extract, observe, agent }
export { sendEmail }
export { sendSlackMessage }
export { sendDiscordMessage }
