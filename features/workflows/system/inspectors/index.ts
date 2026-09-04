import React from "react"
import type { NodeInspectorComponent } from "../types/inspectors"
import { getSystemNodeModule } from "../registry"
import { DefaultNodeInspector } from "./default-inspector"

export * from "../types/inspectors"
export * from "./default-inspector"

const inspectorCache = new Map<string, NodeInspectorComponent>()

/**
 * Returns the specialized inspector component for a node type if one exists,
 * or undefined so caller falls back to DefaultNodeInspector.
 * Supports both static inspectorComponent and lazy loadCustomInspector.
 */
export function getSystemNodeInspector(
  type?: string
): NodeInspectorComponent | undefined {
  if (!type) return undefined
  const mod = getSystemNodeModule(type)
  if (!mod) return undefined

  if (mod.inspectorComponent) {
    return mod.inspectorComponent
  }

  if (mod.loadCustomInspector) {
    let Component = inspectorCache.get(type)
    if (!Component) {
      Component = React.lazy(async () => {
        const loaded = await mod.loadCustomInspector!()
        return "default" in loaded ? loaded : { default: loaded }
      }) as unknown as NodeInspectorComponent
      inspectorCache.set(type, Component)
    }
    return Component
  }

  return undefined
}
