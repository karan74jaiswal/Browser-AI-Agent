import { googleFormTriggerNodeModule } from "./nodes/google-form-trigger"
import type { WorkflowNodeModule } from "../../../../types/module"

export const googleFormNodes: readonly WorkflowNodeModule[] = [
  googleFormTriggerNodeModule,
]

export { googleFormTriggerNodeModule }
