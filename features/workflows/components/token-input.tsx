"use client"

import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from "react"
import { useEdges, useNodes } from "@xyflow/react"

import {
  systemNodeRegistry as nodeRegistry,
  systemNodeIconSvgPaths,
  type NodeType,
  type StepNodeType,
} from "@/features/workflows/system"

import { useOptionalCredentials } from "@/features/credentials/components/credentials-provider"
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
  ...systemNodeIconSvgPaths,
  secrets: `<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>`,
  vault: `<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>`,
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
    const credentialsCtx = useOptionalCredentials()
    const availableSecretKeys = useMemo(() => {
      return credentialsCtx?.availableSecretKeys ?? []
    }, [credentialsCtx])
    const lastSerializedValueRef = useRef<string | null>(null)
    const isComposingRef = useRef(false)
    const onChangeRef = useRef(onChange)
    onChangeRef.current = onChange

    const getNodeInfo = useCallback(
      (nodeId: string, path: string) => {
        const lowerNodeId = (nodeId || "").toLowerCase().trim()
        if (
          lowerNodeId === "secrets" ||
          lowerNodeId === "vault" ||
          lowerNodeId === "secret"
        ) {
          const upperSecretKeys = new Set(
            availableSecretKeys.map((k) => k.toUpperCase())
          )
          const isConfigured =
            availableSecretKeys.length === 0 ||
            upperSecretKeys.has((path || "").toUpperCase())

          if (isConfigured) {
            return {
              label: `Vault · ${path || "secret"}`,
              accent:
                "bg-amber-600 text-white dark:bg-amber-500 dark:text-zinc-950",
              nodeType: "secrets",
              status: "connected" as const,
              tooltip: `Organization Secret: ${path}`,
            }
          }

          return {
            label: `Missing Secret · ${path || "secret"}`,
            accent: "bg-destructive text-destructive-foreground",
            nodeType: "secrets",
            status: "deleted" as const,
            tooltip: `Secret "${path}" is missing from your Credential Vault.`,
          }
        }

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
        const nodeTitle = sourceNode?.data?.title || sourceDef?.label || "Node"
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
      [nodes, edges, currentNodeId, availableSecretKeys]
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
        const lowerNodeId = (nodeId || "").toLowerCase().trim()
        const isVault =
          lowerNodeId === "secrets" ||
          lowerNodeId === "vault" ||
          lowerNodeId === "secret" ||
          info.nodeType === "secrets"
        const normalSvg = isVault
          ? nodeIconSvgPaths.secrets
          : (info.nodeType && nodeIconSvgPaths[info.nodeType]) ||
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
              ? "max-h-60 min-h-24 overflow-y-auto wrap-break-word whitespace-pre-wrap"
              : "min-h-10 scrollbar-none overflow-x-auto leading-7 whitespace-nowrap [&::-webkit-scrollbar]:hidden",
            disabled &&
              "pointer-events-none cursor-not-allowed bg-input/50 opacity-50",
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
