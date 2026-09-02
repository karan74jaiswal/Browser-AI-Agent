"use client"

import * as React from "react"
import { Pencil } from "lucide-react"
import { cn } from "@/lib/utils"
import type { NodeType } from "../nodes/node-registry"
import { useEditableNodeTitle } from "../hooks/use-editable-node-title"

export interface EditableNodeTitleProps {
  nodeId?: string
  title: string
  type: NodeType
  className?: string
  inputClassName?: string
  textClassName?: string
  showPencil?: boolean
}

export function EditableNodeTitle({
  nodeId,
  title,
  type,
  className,
  inputClassName,
  textClassName,
  showPencil = true,
}: EditableNodeTitleProps) {
  const {
    isEditing,
    draft,
    setDraft,
    inputRef,
    startEditing,
    commit,
    handleKeyDown,
  } = useEditableNodeTitle({ nodeId, title, type })

  return (
    <div
      className={cn(
        "group/editable-title flex min-w-0 flex-1 items-center justify-between gap-2",
        className
      )}
    >
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={handleKeyDown}
          onClick={(e) => e.stopPropagation()}
          onDoubleClick={(e) => e.stopPropagation()}
          className={cn(
            "nodrag nopan w-full rounded border border-ring bg-background px-1.5 py-0.5 text-xs font-semibold text-foreground ring-1 ring-ring/50 outline-none",
            inputClassName
          )}
        />
      ) : (
        <span
          onDoubleClick={(e) => {
            e.stopPropagation()
            startEditing()
          }}
          title="Double-click to rename"
          className={cn(
            "truncate font-semibold select-none hover:text-foreground/80",
            textClassName
          )}
        >
          {title}
        </span>
      )}
      {!isEditing && showPencil && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            startEditing()
          }}
          title="Rename step"
          className="cursor-pointer rounded p-0.5 text-muted-foreground opacity-0 transition-opacity group-hover/editable-title:opacity-100 hover:bg-accent hover:text-foreground"
        >
          <Pencil className="size-3" />
        </button>
      )}
    </div>
  )
}
