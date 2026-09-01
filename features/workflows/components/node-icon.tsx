import { Spinner } from "@/components/ui/spinner"
import {
  nodeRegistry,
  type NodeType,
} from "@/features/workflows/nodes/node-registry"
import { cn } from "@/lib/utils"

export interface NodeIconProps {
  type: NodeType
  className?: string
  running?: boolean
}

// The accent-colored icon chip, mirroring the node on the canvas.
export function NodeIcon({ type, className, running = false }: NodeIconProps) {
  const def = nodeRegistry[type]
  if (!def) return null
  const Icon = def.icon

  return (
    <span
      className={cn(
        "flex size-6 shrink-0 items-center justify-center rounded-md",
        def.accent,
        className
      )}
    >
      {running ? (
        <Spinner className="size-3.5" />
      ) : (
        <Icon className="size-3.5" />
      )}
    </span>
  )
}
