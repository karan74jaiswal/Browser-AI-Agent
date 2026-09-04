import { sendEmailNodeModule } from "./nodes/send-email"
import type { WorkflowNodeModule } from "../../../../types/module"

export const resendNodes: readonly WorkflowNodeModule[] = [sendEmailNodeModule]

export { sendEmailNodeModule }

