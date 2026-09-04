import { browserbaseNodes } from "./categories/browserbase"
import { stripeNodes } from "./categories/stripe"
import { resendNodes } from "./categories/resend"
import { googleFormNodes } from "./categories/google-form"
import { slackNodes } from "./categories/slack"
import { discordNodes } from "./categories/discord"
import type { WorkflowNodeModule } from "../../types/module"

export const appsNodes: readonly WorkflowNodeModule[] = [
  ...browserbaseNodes,
  ...stripeNodes,
  ...resendNodes,
  ...googleFormNodes,
  ...slackNodes,
  ...discordNodes,
]

export {
  browserbaseNodes,
  stripeNodes,
  resendNodes,
  googleFormNodes,
  slackNodes,
  discordNodes,
}

export * from "./categories/resend"
export * from "./categories/browserbase"
export * from "./categories/stripe"
export * from "./categories/google-form"
export * from "./categories/slack"
export * from "./categories/discord"
