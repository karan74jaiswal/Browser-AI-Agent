import { jsCodeNodeModule } from "./nodes/js-code"
import { pythonCodeNodeModule } from "./nodes/python-code"
import { httpRequestNodeModule } from "./nodes/http-request"
import type { WorkflowNodeModule } from "../../types/module"

export const coreNodes: readonly WorkflowNodeModule[] = [
  jsCodeNodeModule,
  pythonCodeNodeModule,
  httpRequestNodeModule,
]

export {
  jsCodeNodeModule,
  pythonCodeNodeModule,
  httpRequestNodeModule,
}

