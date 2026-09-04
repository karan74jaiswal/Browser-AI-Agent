import { openUrlNodeModule } from "./nodes/open-url"
import { actNodeModule } from "./nodes/act"
import { extractNodeModule } from "./nodes/extract"
import { observeNodeModule } from "./nodes/observe"
import { agentNodeModule } from "./nodes/agent"
import type { WorkflowNodeModule } from "../../../../types/module"

export const browserbaseNodes: readonly WorkflowNodeModule[] = [
  openUrlNodeModule,
  actNodeModule,
  extractNodeModule,
  observeNodeModule,
  agentNodeModule,
]

export {
  openUrlNodeModule,
  actNodeModule,
  extractNodeModule,
  observeNodeModule,
  agentNodeModule,
}
