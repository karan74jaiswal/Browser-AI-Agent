import { stripeTriggerNodeModule } from "./nodes/stripe-trigger"
import type { WorkflowNodeModule } from "../../../../types/module"

export const stripeNodes: readonly WorkflowNodeModule[] = [
  stripeTriggerNodeModule,
]

export { stripeTriggerNodeModule }
