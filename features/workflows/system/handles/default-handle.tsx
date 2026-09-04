import { Handle, Position } from "@xyflow/react"
import { systemNodeRegistry } from "../registry"
import type { NodeField } from "../types/runtime"
import type { NodeHandlesProps, NodeHandleComponent } from "../types/handles"
import { getSourceHandleClassName } from "./helpers"

export const DefaultNodeHandles: NodeHandleComponent = function DefaultNodeHandles({

  data,
  isLeafNode,
  isRunning,
  isDone,
  isFailed,
  isStepCanceling,
  isLive,
}: NodeHandlesProps) {
  const { type, values } = data
  const def = systemNodeRegistry[type]
  const rawFields = def?.fields as NodeField[] | undefined

  const fields = (rawFields || [])
    .filter((field) => !field.language && field.key !== "code")
    .map((field) => {
      const rawValue = values[field.key] || field.defaultValue || ""
      if (!rawValue) return null
      let displayValue = rawValue
      if (field.options && field.options.length > 0) {
        const option = field.options.find((opt) => opt.value === rawValue)
        if (option) {
          displayValue = option.label
        }
      }
      return {
        field,
        displayValue,
      }
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)

  return (
    <>
      {fields.length > 0 && (
        <>
          <div className="border-t border-border" />
          <div className="flex flex-col gap-1.5 px-3 py-2.5">
            {fields.map(({ field, displayValue }) => (
              <div
                key={field.key}
                className="flex items-center justify-between gap-4 text-xs"
              >
                <span className="shrink-0 text-muted-foreground">
                  {field.label}
                </span>
                <span className="truncate font-medium">{displayValue}</span>
              </div>
            ))}
          </div>
        </>
      )}
      <Handle
        type="source"
        position={Position.Right}
        style={{ transform: "translate(100%, -50%)" }}
        className={getSourceHandleClassName({
          isLive,
          hasEdge: !isLeafNode,
          isFailed,
          isStepCanceling,
          isRunning,
          isWinning: isDone,
        })}
      />
    </>
  )
}
