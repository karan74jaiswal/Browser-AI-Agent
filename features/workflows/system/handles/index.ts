import type { NodeHandleComponent } from "../types/handles"
import { getSystemNodeModule } from "../registry"
import { DefaultNodeHandles } from "./default-handle"

export * from "../types/handles"
export * from "./default-handle"
export * from "./helpers"

/**
 * Returns the specialized handle component for a node type if one exists,
 * or undefined so caller falls back to DefaultNodeHandles.
 */
export function getSystemNodeHandle(
  type?: string
): NodeHandleComponent | undefined {
  if (!type) return undefined
  const mod = getSystemNodeModule(type)
  return mod?.handleComponent
}
