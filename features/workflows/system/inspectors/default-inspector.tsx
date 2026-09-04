"use client"

import { useReactFlow } from "@xyflow/react"
import { Label } from "@/components/ui/label"
import FieldInput from "@/features/workflows/components/rightSidebar/field-input"
import { systemNodeRegistry, type StepNodeType } from "@/features/workflows/system"
import type { NodeInspectorProps } from "../types/inspectors"

export function DefaultNodeInspector({
  node,
  onFocusField,
  registerInputRef,
}: NodeInspectorProps) {
  const { updateNodeData } = useReactFlow<StepNodeType>()
  const def = systemNodeRegistry[node.data.type]
  if (!def) return null

  if (def.fields.length === 0) {
    return <p className="text-xs text-muted-foreground">No properties</p>
  }

  const values = node.data.values || {}

  return (
    <div className="flex flex-col gap-3">
      {def.fields.map((field) => {
        const isInsertable = !field.options || field.options.length === 0
        return (
          <div key={field.key} className="flex flex-col gap-1.5">
            <Label htmlFor={field.key} className="text-xs">
              {field.label}
              {field.required && <span className="text-destructive">*</span>}
            </Label>
            <FieldInput
              field={field}
              value={values[field.key] ?? ""}
              nodeId={node.id}
              inputRef={
                isInsertable
                  ? (handle) => registerInputRef?.(field.key, handle)
                  : undefined
              }
              onFocus={
                isInsertable ? () => onFocusField?.(field.key) : undefined
              }
              onChange={(value) => {
                if (isInsertable) {
                  onFocusField?.(field.key)
                }
                updateNodeData(node.id, {
                  values: { ...values, [field.key]: value },
                })
              }}
            />
          </div>
        )
      })}
    </div>
  )
}
