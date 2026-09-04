import type {
  NodeDefinition,
  NodeField,
  NodeOutput,
  NodeSecretRequirement,
} from "./types"
import type { RegisteredNodeId } from "./types/taxonomy"
import type {
  WorkflowNodeModule,
  TriggerNodeModule,
} from "./types/module"
import { flowNodes } from "./suites/flow"
import { coreNodes } from "./suites/core"
import { appsNodes } from "./suites/apps"

export const allSystemNodeModulesList: readonly WorkflowNodeModule[] = [
  ...flowNodes,
  ...coreNodes,
  ...appsNodes,
]

export const allSystemNodeModulesMap: Record<
  RegisteredNodeId,
  WorkflowNodeModule
> = Object.fromEntries(
  allSystemNodeModulesList.map((mod) => [mod.manifest.id, mod])
) as Record<RegisteredNodeId, WorkflowNodeModule>

/**
 * Registry of Node Definitions compatible with legacy `nodeRegistry`.
 * Can be exported as JSON or consumed directly by canvas and inspectors.
 */
export const systemNodeRegistry: Record<RegisteredNodeId, NodeDefinition> =
  Object.fromEntries(
    allSystemNodeModulesList.map((mod) => {
      const { manifest, icon } = mod
      const def: NodeDefinition = {
        type: manifest.id,
        kind: manifest.kind,
        label: manifest.label,
        icon,
        accent: manifest.accent,
        fields: manifest.fields as NodeField[],
        outputs: manifest.outputs as NodeOutput[],
        requiredSecrets: manifest.requiredSecrets as NodeSecretRequirement[],
        requiredPlan: manifest.requiredPlan,
        requiredFeature: manifest.requiredFeature,
        maxInstances: manifest.maxInstances,
      }
      return [manifest.id, def]
    })
  ) as Record<RegisteredNodeId, NodeDefinition>


/**
 * Dynamic SVG paths map for token pills in TokenInput.
 */
export const systemNodeIconSvgPaths: Record<string, string> =
  Object.fromEntries(
    allSystemNodeModulesList.map((mod) => [mod.manifest.id, mod.iconSvgPath])
  )

/**
 * Initial values factory map for Palette instantation.
 */
export const systemNodeInitialValues: Record<
  RegisteredNodeId,
  () => Record<string, string>
> = Object.fromEntries(
  allSystemNodeModulesList.map((mod) => [mod.manifest.id, mod.getInitialValues])
) as Record<RegisteredNodeId, () => Record<string, string>>

/**
 * Trigger fallback data generator map for Trigger.dev runner.
 */
export const systemNodeTriggerFallbacks: Record<
  string,
  (values: Record<string, string>) => Record<string, unknown>
> = Object.fromEntries(
  allSystemNodeModulesList
    .filter(
      (mod): mod is TriggerNodeModule<RegisteredNodeId> =>
        mod.manifest.kind === "trigger"
    )
    .map((mod) => [mod.manifest.id, mod.getTriggerFallback])
)

/**
 * Helper to safely retrieve a node module by type string.
 */
export function getSystemNodeModule(
  type?: string
): WorkflowNodeModule | undefined {
  if (!type) return undefined
  return (allSystemNodeModulesMap as Record<string, WorkflowNodeModule>)[type]
}

/**
 * Safely retrieve a node's definition manifest by node type.
 */
export function getNodeDefinition(type?: string): NodeDefinition | undefined {
  if (!type) return undefined
  return (systemNodeRegistry as Record<string, NodeDefinition>)[type]
}

/**
 * Standard registry alias for seamless component migration.
 */
export const nodeRegistry = systemNodeRegistry


