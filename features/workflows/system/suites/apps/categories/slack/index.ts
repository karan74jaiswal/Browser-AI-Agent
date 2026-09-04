import { slackNodeModule } from "./nodes/slack"
import type { WorkflowNodeModule } from "../../../../types/module"

export const slackNodes: readonly WorkflowNodeModule[] = [slackNodeModule]

export { slackNodeModule }
