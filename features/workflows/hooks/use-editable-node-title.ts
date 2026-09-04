import { useState, useRef, useEffect, useCallback } from "react"
import { useReactFlow } from "@xyflow/react"
import {
  nodeRegistry,
  type NodeType,
  type StepNodeType,
} from "@/features/workflows/system"

export interface UseEditableNodeTitleParams {
  nodeId?: string
  title: string
  type: NodeType
}

export function useEditableNodeTitle({
  nodeId,
  title,
  type,
}: UseEditableNodeTitleParams) {
  const { updateNodeData } = useReactFlow<StepNodeType>()
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(title)
  const inputRef = useRef<HTMLInputElement>(null)

  const defaultLabel = nodeRegistry[type]?.label || "Step"

  useEffect(() => {
    setDraft(title)
  }, [title])

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [isEditing])

  const commit = useCallback(() => {
    if (!nodeId) return
    const trimmed = draft.trim()
    const finalTitle = trimmed.length > 0 ? trimmed : defaultLabel
    updateNodeData(nodeId, { title: finalTitle })
    setDraft(finalTitle)
    setIsEditing(false)
  }, [nodeId, draft, defaultLabel, updateNodeData])

  const cancel = useCallback(() => {
    setDraft(title)
    setIsEditing(false)
  }, [title])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault()
        e.stopPropagation()
        commit()
      } else if (e.key === "Escape") {
        e.preventDefault()
        e.stopPropagation()
        cancel()
      }
    },
    [commit, cancel]
  )

  const startEditing = useCallback(() => {
    setIsEditing(true)
  }, [])

  return {
    isEditing,
    draft,
    setDraft,
    inputRef,
    startEditing,
    commit,
    cancel,
    handleKeyDown,
  }
}
