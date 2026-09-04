import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import dynamic from "next/dynamic"
import { NodeField } from "../../nodes/node-registry"
import { type TokenInputHandle, TokenInput } from "../token-input"

const CodeEditor = dynamic(
  () => import("../code-editor").then((mod) => mod.CodeEditor),
  {
    ssr: false,
    loading: () => (
      <div className="h-32 w-full animate-pulse rounded-md border border-border bg-muted/40" />
    ),
  }
)

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
          className="max-h-64 min-w-(--radix-select-trigger-width)"
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

  if (field.language) {
    return (
      <CodeEditor
        id={field.key}
        ref={inputRef}
        value={value}
        language={field.language}
        placeholder={field.placeholder}
        onChange={onChange}
        onFocus={onFocus}
      />
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
