import { startNodeModule } from "./nodes/start"
import { ifNodeModule } from "./nodes/if"
import { switchNodeModule } from "./nodes/switch"
import { mergeNodeModule } from "./nodes/merge"
import { loopNodeModule } from "./nodes/loop"
import { waitNodeModule } from "./nodes/wait"
import { throwErrorNodeModule } from "./nodes/throw-error"
import type { WorkflowNodeModule } from "../../types/module"

export const flowNodes: readonly WorkflowNodeModule[] = [
  startNodeModule,
  ifNodeModule,
  switchNodeModule,
  mergeNodeModule,
  loopNodeModule,
  waitNodeModule,
  throwErrorNodeModule,
]

export * from "./nodes/start"
export * from "./nodes/if"
export * from "./nodes/switch"
export * from "./nodes/merge"
export * from "./nodes/loop"
export * from "./nodes/wait"
export * from "./nodes/throw-error"
export * from "./handles/if-handle"
export * from "./handles/loop-handle"
export * from "./handles/switch-handle"

