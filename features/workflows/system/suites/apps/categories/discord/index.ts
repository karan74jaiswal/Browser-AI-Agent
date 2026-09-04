import { discordNodeModule } from "./nodes/discord"
import type { WorkflowNodeModule } from "../../../../types/module"

export const discordNodes: readonly WorkflowNodeModule[] = [discordNodeModule]

export { discordNodeModule }
