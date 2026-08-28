import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { NodeField } from "../../nodes/node-registry"
import { type TokenInputHandle, TokenInput } from "../token-input"

// A single editor field for a node property.
export default function FieldInput({
  field,
  value,
  nodeId,
  onChange,
  onFocus,
  inputRef,
}: {
  field: NodeField
  value: string
  nodeId?: string
  onChange: (value: string) => void
  onFocus?: () => void
  inputRef?: (handle: TokenInputHandle | null) => void
}) {
  if (field.options && field.options.length > 0) {
    const currentValue =
      value || field.defaultValue || field.options[0]?.value || ""
    return (
      <Select value={currentValue} onValueChange={onChange}>
        <SelectTrigger
          id={field.key}
          className="h-8 w-full bg-background text-xs"
        >
          <SelectValue placeholder={field.placeholder || "Select option..."} />
        </SelectTrigger>
        <SelectContent
          position="popper"
          className="max-h-64 min-w-[var(--radix-select-trigger-width)]"
        >
          {field.options.map((opt) => (
            <SelectItem
              key={opt.value}
              value={opt.value}
              className="cursor-pointer text-xs"
            >
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    )
  }

  return (
    <TokenInput
      id={field.key}
      ref={inputRef}
      value={value}
      placeholder={field.placeholder}
      multiline={field.multiline}
      onChange={onChange}
      onFocus={onFocus}
      currentNodeId={nodeId}
    />
  )
}
