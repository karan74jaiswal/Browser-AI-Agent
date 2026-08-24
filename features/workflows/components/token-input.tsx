"use client"

import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react"
import { useNodes } from "@xyflow/react"
import {
  nodeRegistry,
  type NodeType,
  type StepNodeType,
} from "@/features/workflows/nodes/node-registry"
import { cn } from "@/lib/utils"

export type TokenInputHandle = {
  insertToken: (token: string) => void
  focus: () => void
}

type TokenInputProps = {
  id?: string
  value: string
  onChange: (value: string) => void
  onFocus?: () => void
  onBlur?: () => void
  placeholder?: string
  multiline?: boolean
  className?: string
  disabled?: boolean
}

type Segment =
  | { type: "text"; text: string }
  | { type: "token"; raw: string; nodeId: string; path: string }

function parseSegments(template: string): Segment[] {
  if (!template) return []
  const regex = /\{\{\s*([\s\S]*?)\s*\}\}/g
  const segments: Segment[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = regex.exec(template)) !== null) {
    if (match.index > lastIndex) {
      segments.push({
        type: "text",
        text: template.slice(lastIndex, match.index),
      })
    }

    const raw = match[0]
    const inner = match[1].trim()
    const dotIndex = inner.indexOf(".")
    const nodeId = dotIndex === -1 ? inner : inner.slice(0, dotIndex).trim()
    const path = dotIndex === -1 ? "" : inner.slice(dotIndex + 1).trim()

    segments.push({
      type: "token",
      raw,
      nodeId,
      path,
    })

    lastIndex = regex.lastIndex
  }

  if (lastIndex < template.length) {
    segments.push({
      type: "text",
      text: template.slice(lastIndex),
    })
  }

  return segments
}

function serializeDom(container: Node): string {
  let result = ""
  for (let i = 0; i < container.childNodes.length; i++) {
    const child = container.childNodes[i]
    if (child.nodeType === Node.TEXT_NODE) {
      const text = (child.textContent ?? "")
        .replace(/[\u200B\uFEFF]/g, "")
        .replace(/\u00A0/g, " ")
      result += text
    } else if (child.nodeType === Node.ELEMENT_NODE) {
      const el = child as HTMLElement
      const token = el.getAttribute("data-token")
      if (token) {
        result += token
      } else if (el.tagName.toLowerCase() === "br") {
        result += "\n"
      } else if (
        el.tagName.toLowerCase() === "div" ||
        el.tagName.toLowerCase() === "p"
      ) {
        const inner = serializeDom(el)
        if (i > 0 && !result.endsWith("\n")) {
          result += "\n"
        }
        result += inner
      } else {
        result += serializeDom(el)
      }
    }
  }
  return result
}

const nodeIconSvgPaths: Record<string, string> = {
  start: `<path d="m9 9 5 12 1.8-5.2L21 14Z"/><path d="M7.2 2.2 8 5.1"/><path d="m5.1 8-2.9-.8"/><path d="M14 4.1 12 6"/><path d="m6 12-1.9 2"/>`,
  "open-url": `<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>`,
  act: `<path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/>`,
  extract: `<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/>`,
  observe: `<path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/>`,
  agent: `<path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/>`,
  "send-email": `<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>`,
}

export const TokenInput = forwardRef<TokenInputHandle, TokenInputProps>(
  function TokenInput(
    {
      id,
      value,
      onChange,
      onFocus,
      onBlur,
      placeholder,
      multiline = false,
      className,
      disabled = false,
    },
    ref
  ) {
    const containerRef = useRef<HTMLDivElement>(null)
    const nodes = useNodes<StepNodeType>()
    const lastSerializedValueRef = useRef<string | null>(null)
    const isComposingRef = useRef(false)

    const getNodeInfo = useCallback(
      (nodeId: string, path: string) => {
        const sourceNode = nodes.find((n) => n.id === nodeId)
        const sourceDef = sourceNode ? nodeRegistry[sourceNode.data.type] : null
        const outputDef = sourceDef?.outputs?.find((o) => o.path === path)
        const nodeTitle =
          sourceNode?.data?.title || sourceDef?.label || "Node"
        const outputLabel = outputDef?.label || path || "output"
        const label = `${nodeTitle} · ${outputLabel}`
        const accent = sourceDef?.accent || "bg-primary text-primary-foreground"
        const nodeType = sourceDef?.type as NodeType | undefined

        return { label, accent, nodeType }
      },
      [nodes]
    )

    const buildTokenElement = useCallback(
      (rawToken: string, nodeId: string, path: string) => {
        const info = getNodeInfo(nodeId, path)
        const span = document.createElement("span")
        span.contentEditable = "false"
        span.setAttribute("data-token", rawToken)
        span.className =
          "inline-flex items-center gap-1.5 align-middle mx-1 my-0.5 px-1.5 py-0.5 rounded-md bg-secondary/80 text-secondary-foreground border border-border text-xs font-medium select-none shadow-2xs group/chip"

        // Icon chip
        const iconWrapper = document.createElement("span")
        iconWrapper.className = `flex size-3.5 shrink-0 items-center justify-center rounded-xs ${info.accent}`
        const svgPath = (info.nodeType && nodeIconSvgPaths[info.nodeType]) || `<circle cx="12" cy="12" r="10"/>`
        iconWrapper.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">${svgPath}</svg>`
        span.appendChild(iconWrapper)

        // Label
        const labelSpan = document.createElement("span")
        labelSpan.className = "truncate max-w-44 font-medium"
        labelSpan.textContent = info.label
        span.appendChild(labelSpan)

        // Remove button
        const removeBtn = document.createElement("button")
        removeBtn.type = "button"
        removeBtn.className =
          "ml-0.5 rounded-xs p-0.5 text-muted-foreground hover:bg-accent hover:text-foreground cursor-pointer transition-colors"
        removeBtn.title = "Remove connection"
        removeBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>`

        removeBtn.onmousedown = (e) => {
          e.preventDefault()
          e.stopPropagation()
        }

        removeBtn.onclick = (e) => {
          e.preventDefault()
          e.stopPropagation()
          span.remove()
          if (containerRef.current) {
            const nextVal = serializeDom(containerRef.current)
            lastSerializedValueRef.current = nextVal
            onChange(nextVal)
          }
        }
        span.appendChild(removeBtn)

        return span
      },
      [getNodeInfo, onChange]
    )

    const syncDomFromValue = useCallback(
      (textVal: string) => {
        if (!containerRef.current) return
        const container = containerRef.current
        container.innerHTML = ""

        if (!textVal) {
          lastSerializedValueRef.current = ""
          return
        }

        const segments = parseSegments(textVal)
        for (const seg of segments) {
          if (seg.type === "text") {
            const lines = seg.text.split("\n")
            for (let i = 0; i < lines.length; i++) {
              if (i > 0) {
                container.appendChild(document.createElement("br"))
              }
              if (lines[i].length > 0) {
                container.appendChild(document.createTextNode(lines[i]))
              }
            }
          } else {
            const tokenEl = buildTokenElement(seg.raw, seg.nodeId, seg.path)
            container.appendChild(tokenEl)
          }
        }

        lastSerializedValueRef.current = textVal
      },
      [buildTokenElement]
    )

    // Sync from external value when it changes outside this component
    useEffect(() => {
      if (value !== lastSerializedValueRef.current) {
        syncDomFromValue(value)
      }
    }, [value, syncDomFromValue])

    const handleInput = () => {
      if (!containerRef.current || isComposingRef.current) return
      const nextVal = serializeDom(containerRef.current)
      lastSerializedValueRef.current = nextVal
      onChange(nextVal)
    }

    const insertToken = useCallback(
      (token: string) => {
        if (!containerRef.current) return
        const container = containerRef.current
        container.focus()

        const segments = parseSegments(token)
        const tokenSeg = segments.find((s) => s.type === "token")
        if (!tokenSeg || tokenSeg.type !== "token") return

        const tokenEl = buildTokenElement(
          tokenSeg.raw,
          tokenSeg.nodeId,
          tokenSeg.path
        )

        const sel = window.getSelection()
        if (sel && sel.rangeCount > 0 && container.contains(sel.anchorNode)) {
          const range = sel.getRangeAt(0)
          range.deleteContents()
          range.insertNode(tokenEl)

          // Place cursor after inserted token
          const space = document.createTextNode("\u200B")
          tokenEl.after(space)
          range.setStartAfter(space)
          range.setEndAfter(space)
          sel.removeAllRanges()
          sel.addRange(range)
        } else {
          // Append to container
          container.appendChild(tokenEl)
          const space = document.createTextNode("\u200B")
          container.appendChild(space)

          // Move cursor to end
          const range = document.createRange()
          range.setStartAfter(space)
          range.setEndAfter(space)
          if (sel) {
            sel.removeAllRanges()
            sel.addRange(range)
          }
        }

        const nextVal = serializeDom(container)
        lastSerializedValueRef.current = nextVal
        onChange(nextVal)
      },
      [buildTokenElement, onChange]
    )

    useImperativeHandle(
      ref,
      () => ({
        insertToken,
        focus: () => {
          containerRef.current?.focus()
        },
      }),
      [insertToken]
    )

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (!multiline && e.key === "Enter") {
        e.preventDefault()
      }
    }

    const isEmpty = !value || value.trim() === ""

    return (
      <div className="relative w-full">
        <div
          id={id}
          ref={containerRef}
          contentEditable={!disabled}
          suppressContentEditableWarning
          onInput={handleInput}
          onFocus={onFocus}
          onBlur={onBlur}
          onKeyDown={handleKeyDown}
          onCompositionStart={() => {
            isComposingRef.current = true
          }}
          onCompositionEnd={() => {
            isComposingRef.current = false
            handleInput()
          }}
          className={cn(
            "relative w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-xs transition-colors outline-none",
            "focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 dark:bg-input/30",
            multiline
              ? "min-h-24 max-h-60 overflow-y-auto whitespace-pre-wrap break-words"
              : "min-h-10 overflow-x-auto whitespace-nowrap leading-7 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
            disabled &&
              "pointer-events-none cursor-not-allowed opacity-50 bg-input/50",
            className
          )}
        />
        {isEmpty && placeholder && (
          <span className="pointer-events-none absolute top-2.5 left-2.5 text-xs text-muted-foreground select-none">
            {placeholder}
          </span>
        )}
      </div>
    )
  }
)
