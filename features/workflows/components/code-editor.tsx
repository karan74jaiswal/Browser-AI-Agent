"use client"

import React, {
  forwardRef,
  useImperativeHandle,
  useMemo,
  useRef,
} from "react"
import CodeMirror, {
  type ReactCodeMirrorRef,
  EditorView,
} from "@uiw/react-codemirror"
import { javascript } from "@codemirror/lang-javascript"
import { python } from "@codemirror/lang-python"
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language"
import { tags } from "@lezer/highlight"
import { useTheme } from "next-themes"
import { AlertTriangle } from "lucide-react"
import type { TokenInputHandle } from "./token-input"
import { detectPotentialInfiniteLoops } from "../lib/loop-detector"
import { cn } from "@/lib/utils"

export interface CodeEditorProps {
  id?: string
  value: string
  onChange: (value: string) => void
  language?: "javascript" | "python"
  placeholder?: string
  className?: string
  disabled?: boolean
  onFocus?: () => void
  onBlur?: () => void
}

export const CodeEditor = forwardRef<TokenInputHandle, CodeEditorProps>(
  function CodeEditor(
    {
      id,
      value,
      onChange,
      language = "javascript",
      placeholder,
      className,
      disabled = false,
      onFocus,
      onBlur,
    },
    ref
  ) {
    const editorRef = useRef<ReactCodeMirrorRef>(null)
    const { resolvedTheme } = useTheme()
    const isDark = resolvedTheme === "dark"

    useImperativeHandle(
      ref,
      () => ({
        insertToken: (token: string) => {
          const view = editorRef.current?.view
          if (view) {
            const selection = view.state.selection.main
            view.dispatch({
              changes: {
                from: selection.from,
                to: selection.to,
                insert: token,
              },
              selection: { anchor: selection.from + token.length },
            })
            view.focus()
          } else {
            onChange(value ? `${value} ${token}` : token)
          }
        },
        focus: () => {
          editorRef.current?.view?.focus()
        },
      }),
      [value, onChange]
    )

    const extensions = useMemo(() => {
      // 1. Editor UI Theme inheriting exact app styles, popovers, selections, and cursors
      const editorTheme = EditorView.theme({
        "&": {
          fontSize: "12px",
          fontFamily:
            'var(--font-mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace)',
          backgroundColor: "transparent",
          color: "var(--foreground)",
        },
        ".cm-scroller": {
          fontFamily: "inherit",
          lineHeight: "1.6",
          padding: "2px 0",
        },
        ".cm-content": {
          padding: "8px 10px",
          caretColor: isDark ? "#fafafa" : "#18181b",
        },
        ".cm-cursor, .cm-dropCursor": {
          borderLeft: isDark
            ? "1.5px solid #fafafa !important"
            : "1.5px solid #18181b !important",
        },
        ".cm-line": {
          padding: "0",
        },
        "&.cm-focused": {
          outline: "none",
        },
        // Selected text background & foreground when dragging mouse
        ".cm-selectionBackground, &.cm-focused .cm-selectionBackground, ::selection, .cm-content ::selection, .cm-line ::selection": {
          backgroundColor: isDark
            ? "rgba(255, 255, 255, 0.22) !important"
            : "rgba(0, 0, 0, 0.14) !important",
          color: "inherit !important",
        },
        ".cm-selectionMatch": {
          backgroundColor: isDark
            ? "rgba(255, 255, 255, 0.1) !important"
            : "rgba(0, 0, 0, 0.07) !important",
        },
        ".cm-matchingBracket": {
          backgroundColor: isDark
            ? "rgba(255, 255, 255, 0.12)"
            : "rgba(0, 0, 0, 0.08)",
          outline: "1px solid var(--ring)",
          color: "inherit !important",
        },
        ".cm-placeholder": {
          color: "var(--muted-foreground)",
          opacity: 0.6,
          fontStyle: "italic",
        },
        // Code Suggestion / Autocomplete Tooltip matching shadcn Popover & Command dropdowns
        ".cm-tooltip": {
          backgroundColor: "var(--popover) !important",
          border: "1px solid var(--border) !important",
          borderRadius: "calc(var(--radius) * 1.5) !important",
          boxShadow:
            "0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.2) !important",
          color: "var(--popover-foreground) !important",
          overflow: "hidden !important",
          zIndex: "9999 !important",
        },
        ".cm-tooltip.cm-tooltip-autocomplete": {
          padding: "4px !important",
          backgroundColor: "var(--popover) !important",
          border: "1px solid var(--border) !important",
        },
        ".cm-tooltip.cm-tooltip-autocomplete > ul": {
          fontFamily:
            'var(--font-mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace) !important',
          fontSize: "11.5px !important",
          maxHeight: "220px !important",
          padding: "0 !important",
          margin: "0 !important",
          listStyle: "none !important",
        },
        ".cm-tooltip.cm-tooltip-autocomplete > ul > li": {
          padding: "4px 8px !important",
          borderRadius: "calc(var(--radius) * 0.8) !important",
          color: "var(--popover-foreground) !important",
          cursor: "pointer !important",
          display: "flex !important",
          alignItems: "center !important",
          gap: "6px !important",
          lineHeight: "1.5 !important",
          transition: "background-color 0.12s ease",
        },
        ".cm-tooltip.cm-tooltip-autocomplete > ul > li[aria-selected]": {
          backgroundColor: "var(--accent) !important",
          color: "var(--accent-foreground) !important",
        },
        ".cm-tooltip.cm-tooltip-autocomplete > ul > li:hover:not([aria-selected])": {
          backgroundColor: "var(--muted) !important",
        },
        ".cm-completionMatchedText": {
          color: isDark ? "#60a5fa !important" : "#2563eb !important",
          textDecoration: "none !important",
          fontWeight: "600 !important",
        },
        ".cm-completionLabel": {
          color: "inherit !important",
          fontWeight: "500 !important",
        },
        ".cm-completionDetail": {
          color: "var(--muted-foreground) !important",
          fontStyle: "italic !important",
          fontSize: "10.5px !important",
          marginLeft: "auto !important",
          paddingLeft: "12px !important",
          opacity: "0.8 !important",
        },
        ".cm-completionIcon": {
          opacity: "0.7 !important",
          marginRight: "4px !important",
        },
      })

      // 2. Syntax Highlighting Style matching console panel & shadcn theme
      const highlightStyle = HighlightStyle.define(
        isDark
          ? [
              { tag: tags.keyword, color: "#c084fc", fontWeight: "600" }, // purple-400
              { tag: tags.controlKeyword, color: "#c084fc", fontWeight: "600" },
              { tag: tags.definitionKeyword, color: "#c084fc", fontWeight: "600" },
              { tag: tags.moduleKeyword, color: "#c084fc", fontWeight: "600" },
              { tag: tags.function(tags.variableName), color: "#60a5fa" }, // blue-400
              { tag: tags.function(tags.propertyName), color: "#60a5fa" },
              { tag: tags.string, color: "#4ade80" }, // emerald-400
              { tag: tags.special(tags.string), color: "#86efac" },
              { tag: tags.number, color: "#fbbf24" }, // amber-400
              { tag: tags.integer, color: "#fbbf24" },
              { tag: tags.float, color: "#fbbf24" },
              { tag: tags.bool, color: "#f472b6", fontWeight: "600" }, // pink-400
              { tag: tags.null, color: "#f472b6", fontWeight: "600" },
              { tag: tags.comment, color: "var(--muted-foreground)", fontStyle: "italic", opacity: 0.75 },
              { tag: tags.lineComment, color: "var(--muted-foreground)", fontStyle: "italic", opacity: 0.75 },
              { tag: tags.blockComment, color: "var(--muted-foreground)", fontStyle: "italic", opacity: 0.75 },
              { tag: tags.operator, color: "var(--muted-foreground)" },
              { tag: tags.punctuation, color: "var(--muted-foreground)" },
              { tag: tags.bracket, color: "var(--muted-foreground)" },
              { tag: tags.variableName, color: "var(--foreground)" },
              { tag: tags.propertyName, color: "#93c5fd" }, // blue-300
              { tag: tags.className, color: "#38bdf8" }, // sky-400
              { tag: tags.typeName, color: "#38bdf8" },
            ]
          : [
              { tag: tags.keyword, color: "#7c3aed", fontWeight: "600" }, // violet-600
              { tag: tags.controlKeyword, color: "#7c3aed", fontWeight: "600" },
              { tag: tags.definitionKeyword, color: "#7c3aed", fontWeight: "600" },
              { tag: tags.moduleKeyword, color: "#7c3aed", fontWeight: "600" },
              { tag: tags.function(tags.variableName), color: "#2563eb" }, // blue-600
              { tag: tags.function(tags.propertyName), color: "#2563eb" },
              { tag: tags.string, color: "#16a34a" }, // green-600
              { tag: tags.special(tags.string), color: "#15803d" },
              { tag: tags.number, color: "#d97706" }, // amber-600
              { tag: tags.integer, color: "#d97706" },
              { tag: tags.float, color: "#d97706" },
              { tag: tags.bool, color: "#db2777", fontWeight: "600" }, // pink-600
              { tag: tags.null, color: "#db2777", fontWeight: "600" },
              { tag: tags.comment, color: "var(--muted-foreground)", fontStyle: "italic", opacity: 0.8 },
              { tag: tags.lineComment, color: "var(--muted-foreground)", fontStyle: "italic", opacity: 0.8 },
              { tag: tags.blockComment, color: "var(--muted-foreground)", fontStyle: "italic", opacity: 0.8 },
              { tag: tags.operator, color: "#52525b" }, // zinc-600
              { tag: tags.punctuation, color: "#71717a" }, // zinc-500
              { tag: tags.bracket, color: "#71717a" },
              { tag: tags.variableName, color: "var(--foreground)" },
              { tag: tags.propertyName, color: "#1d4ed8" }, // blue-700
              { tag: tags.className, color: "#0284c7" }, // sky-600
              { tag: tags.typeName, color: "#0284c7" },
            ]
      )

      const ext = [
        EditorView.lineWrapping,
        editorTheme,
        syntaxHighlighting(highlightStyle),
      ]

      if (language === "python") {
        ext.push(python())
      } else {
        ext.push(javascript({ jsx: true, typescript: true }))
      }

      return ext
    }, [language, isDark])

    const loopWarnings = useMemo(
      () => detectPotentialInfiniteLoops(value, language),
      [value, language]
    )

    return (
      <div className="flex flex-col gap-1.5 w-full">
        <div
          id={id}
          className={cn(
            "group relative w-full overflow-hidden rounded-lg border border-input bg-transparent transition-colors",
            "dark:bg-input/30 focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50",
            loopWarnings.length > 0 &&
              "border-amber-500/50 focus-within:border-amber-500 focus-within:ring-amber-500/30",
            disabled && "pointer-events-none cursor-not-allowed opacity-50 bg-input/50",
            className
          )}
        >
          <CodeMirror
            ref={editorRef}
            value={value}
            height="auto"
            minHeight="140px"
            maxHeight="320px"
            theme="none"
            extensions={extensions}
            placeholder={placeholder}
            editable={!disabled}
            onChange={onChange}
            onFocus={onFocus}
            onBlur={onBlur}
            basicSetup={{
              lineNumbers: false,
              foldGutter: false,
              highlightActiveLineGutter: false,
              highlightActiveLine: false,
              bracketMatching: true,
              closeBrackets: true,
              autocompletion: true,
              indentOnInput: true,
              tabSize: 2,
            }}
          />
        </div>

        {loopWarnings.length > 0 && (
          <div className="flex flex-col gap-1 rounded-md border border-amber-500/30 bg-amber-500/10 p-2.5 text-xs text-amber-700 dark:text-amber-400 animate-in fade-in-50 duration-200">
            <div className="flex items-center gap-1.5 font-medium">
              <AlertTriangle className="size-3.5 shrink-0" />
              <span>Potential infinite loop detected</span>
            </div>
            <div className="flex flex-col gap-1 pl-5">
              {loopWarnings.map((w, idx) => (
                <p key={idx} className="text-[11px] leading-relaxed text-muted-foreground">
                  {w.line ? `Line ${w.line}: ` : ""}
                  {w.message}
                </p>
              ))}
              <span className="text-[10px] text-muted-foreground/80 pt-0.5">
                Tip: Ensure your loop has a working exit condition, <code>break</code>, <code>return</code>, or updates the loop variable.
              </span>
            </div>
          </div>
        )}
      </div>
    )
  }
)
