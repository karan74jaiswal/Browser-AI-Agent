"use client"

import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react"
import { useEdges, useNodes } from "@xyflow/react"
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
  currentNodeId?: string
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
  "google-form-trigger": `<rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/>`,
  "stripe-trigger": `<rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/>`,
  "open-url": `<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>`,
  act: `<path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/>`,
  extract: `<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/>`,
  observe: `<path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/>`,
  agent: `<path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/>`,
  "send-email": `<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>`,
  "http-request": `<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>`,
  discord: `<path fill="currentColor" d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>`,
  slack: `<path d="M8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834z" fill="#36C5F0"/><path d="M8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312z" fill="#36C5F0"/><path d="M18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834z" fill="#2EB67D"/><path d="M17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312z" fill="#2EB67D"/><path d="M15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52z" fill="#ECB22E"/><path d="M15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z" fill="#ECB22E"/><path d="M5.042 15.165a2.528 2.528 0 0 1-2.52-2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52z" fill="#E01E5A"/><path d="M6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313z" fill="#E01E5A"/>`,
  if: `<line x1="6" x2="6" y1="3" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/>`,
  switch: `<circle cx="12" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><circle cx="18" cy="6" r="3"/><path d="M18 9v2c0 .6-.4 1-1 1H7c-.6 0-1-.4-1-1V9"/><path d="M12 12v3"/>`,
  wait: `<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>`,
  "throw-error": `<polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>`,
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
      currentNodeId,
    },
    ref
  ) {
    const containerRef = useRef<HTMLDivElement>(null)
    const nodes = useNodes<StepNodeType>()
    const edges = useEdges()
    const lastSerializedValueRef = useRef<string | null>(null)
    const isComposingRef = useRef(false)
    const onChangeRef = useRef(onChange)
    onChangeRef.current = onChange

    const getNodeInfo = useCallback(
      (nodeId: string, path: string) => {
        const sourceNode = nodes.find((n) => n.id === nodeId)
        if (!sourceNode) {
          return {
            label: `Deleted Step · ${path || "output"}`,
            accent: "bg-destructive text-destructive-foreground",
            nodeType: undefined,
            status: "deleted" as const,
            tooltip: "This step was deleted. Remove this token.",
          }
        }

        const sourceDef = nodeRegistry[sourceNode.data.type]
        const outputDef = sourceDef?.outputs?.find((o) => o.path === path)
        const nodeTitle =
          sourceNode?.data?.title || sourceDef?.label || "Node"
        const outputLabel = outputDef?.label || path || "output"

        // Check whether sourceNode is a connected upstream ancestor of currentNodeId
        let isConnected = true
        if (currentNodeId) {
          const targetToSources = new Map<string, string[]>()
          for (const edge of edges) {
            if (!edge.source || !edge.target) continue
            const sources = targetToSources.get(edge.target)
            if (sources) {
              sources.push(edge.source)
            } else {
              targetToSources.set(edge.target, [edge.source])
            }
          }

          const ancestors = new Set<string>()
          const queue = [...(targetToSources.get(currentNodeId) || [])]
          while (queue.length > 0) {
            const curr = queue.shift()!
            if (!ancestors.has(curr)) {
              ancestors.add(curr)
              const parents = targetToSources.get(curr) || []
              for (const p of parents) {
                if (!ancestors.has(p)) queue.push(p)
              }
            }
          }

          isConnected = ancestors.has(nodeId)
        }

        if (!isConnected) {
          return {
            label: `${nodeTitle} · ${outputLabel} (Disconnected)`,
            accent: "bg-amber-500 text-white",
            nodeType: sourceDef?.type as NodeType | undefined,
            status: "disconnected" as const,
            tooltip:
              "This step is not connected to this node. Connect an edge to use this value.",
          }
        }

        const label = `${nodeTitle} · ${outputLabel}`
        const accent = sourceDef?.accent || "bg-primary text-primary-foreground"
        const nodeType = sourceDef?.type as NodeType | undefined

        return {
          label,
          accent,
          nodeType,
          status: "connected" as const,
          tooltip: "",
        }
      },
      [nodes, edges, currentNodeId]
    )

    const buildTokenElement = useCallback(
      (rawToken: string, nodeId: string, path: string) => {
        const info = getNodeInfo(nodeId, path)
        const span = document.createElement("span")
        span.contentEditable = "false"
        span.setAttribute("data-token", rawToken)

        if (info.status === "deleted" || info.status === "disconnected") {
          span.className =
            "inline-flex items-center gap-1.5 align-middle mx-1 my-0.5 px-1.5 py-0.5 rounded-md bg-destructive/10 text-destructive border border-destructive/40 text-xs font-medium select-none shadow-2xs group/chip ring-1 ring-destructive/20"
          if (info.tooltip) span.title = info.tooltip
        } else {
          span.className =
            "inline-flex items-center gap-1.5 align-middle mx-1 my-0.5 px-1.5 py-0.5 rounded-md bg-secondary/80 text-secondary-foreground border border-border text-xs font-medium select-none shadow-2xs group/chip"
        }

        // Icon chip
        const iconWrapper = document.createElement("span")
        iconWrapper.className = `flex size-3.5 shrink-0 items-center justify-center rounded-xs ${info.accent}`
        const warningSvg = `<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/>`
        const normalSvg =
          (info.nodeType && nodeIconSvgPaths[info.nodeType]) ||
          `<circle cx="12" cy="12" r="10"/>`
        const svgPath =
          info.status === "deleted" || info.status === "disconnected"
            ? warningSvg
            : normalSvg

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
          const parent = span.parentNode
          const nextSibling = span.nextSibling
          span.remove()
          if (containerRef.current) {
            const nextVal = serializeDom(containerRef.current)
            lastSerializedValueRef.current = nextVal
            onChangeRef.current(nextVal)

            // Focus and maintain cursor at deletion point
            containerRef.current.focus()
            const sel = window.getSelection()
            if (sel) {
              const range = document.createRange()
              if (nextSibling && parent?.contains(nextSibling)) {
                range.setStartBefore(nextSibling)
                range.setEndBefore(nextSibling)
              } else if (parent) {
                range.selectNodeContents(parent)
                range.collapse(false)
              }
              sel.removeAllRanges()
              sel.addRange(range)
            }
          }
        }
        span.appendChild(removeBtn)

        return span
      },
      [getNodeInfo]
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

    // Sync only when external value has changed to prevent wiping cursor position
    useEffect(() => {
      if (value !== lastSerializedValueRef.current) {
        syncDomFromValue(value)
      }
    }, [value, syncDomFromValue])

    // Update styling of existing token elements in-place when graph topology changes
    useEffect(() => {
      if (!containerRef.current) return
      const tokenSpans =
        containerRef.current.querySelectorAll<HTMLElement>("span[data-token]")
      for (const span of Array.from(tokenSpans)) {
        const rawToken = span.getAttribute("data-token")
        if (!rawToken) continue
        const segments = parseSegments(rawToken)
        const tokenSeg = segments.find((s) => s.type === "token")
        if (!tokenSeg || tokenSeg.type !== "token") continue

        const info = getNodeInfo(tokenSeg.nodeId, tokenSeg.path)
        if (info.status === "deleted" || info.status === "disconnected") {
          span.className =
            "inline-flex items-center gap-1.5 align-middle mx-1 my-0.5 px-1.5 py-0.5 rounded-md bg-destructive/10 text-destructive border border-destructive/40 text-xs font-medium select-none shadow-2xs group/chip ring-1 ring-destructive/20"
          if (info.tooltip) span.title = info.tooltip
        } else {
          span.className =
            "inline-flex items-center gap-1.5 align-middle mx-1 my-0.5 px-1.5 py-0.5 rounded-md bg-secondary/80 text-secondary-foreground border border-border text-xs font-medium select-none shadow-2xs group/chip"
          span.title = ""
        }

        // Update icon wrapper
        const iconWrapper = span.querySelector<HTMLElement>("span:first-child")
        if (iconWrapper) {
          iconWrapper.className = `flex size-3.5 shrink-0 items-center justify-center rounded-xs ${info.accent}`
          const warningSvg = `<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/>`
          const normalSvg =
            (info.nodeType && nodeIconSvgPaths[info.nodeType]) ||
            `<circle cx="12" cy="12" r="10"/>`
          const svgPath =
            info.status === "deleted" || info.status === "disconnected"
              ? warningSvg
              : normalSvg
          iconWrapper.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">${svgPath}</svg>`
        }

        // Update label
        const labelSpan = span.querySelector<HTMLElement>("span:nth-child(2)")
        if (labelSpan) {
          labelSpan.textContent = info.label
        }
      }
    }, [nodes, edges, getNodeInfo])

    const handleInput = () => {
      if (!containerRef.current || isComposingRef.current) return
      const nextVal = serializeDom(containerRef.current)
      lastSerializedValueRef.current = nextVal
      onChangeRef.current(nextVal)
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
        onChangeRef.current(nextVal)
      },
      [buildTokenElement]
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
          <span className="pointer-events-none absolute top-2.5 left-2.5 max-w-[calc(100%-20px)] truncate text-xs text-muted-foreground select-none">
            {placeholder}
          </span>
        )}
      </div>
    )
  }
)
