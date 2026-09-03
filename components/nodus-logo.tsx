"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface NodusLogoProps {
  className?: string
  size?: number
  withText?: boolean
  textSize?: string
}

export function NodusLogo({
  className,
  size = 28,
  withText = false,
  textSize = "text-base",
}: NodusLogoProps) {
  return (
    <div className={cn("inline-flex items-center gap-2.5 select-none", className)}>
      {/* Node-and-Edge Workflow Glyph */}
      <div
        style={{ width: size, height: size }}
        className="relative flex shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 via-indigo-600 to-pink-600 p-[3px] shadow-xs ring-1 ring-white/20 dark:ring-white/10 transition-transform duration-200 group-hover:scale-105"
      >
        <svg
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="size-full overflow-visible"
        >
          {/* Subtle Ambient Background Flow Glow */}
          <circle cx="16" cy="16" r="14" fill="url(#nodus-bg-glow)" opacity="0.35" />

          <defs>
            <radialGradient
              id="nodus-bg-glow"
              cx="50%"
              cy="50%"
              r="50%"
              fx="50%"
              fy="50%"
            >
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </radialGradient>
            <linearGradient
              id="nodus-edge-grad"
              x1="8"
              y1="9"
              x2="24"
              y2="23"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0%" stopColor="#93c5fd" />
              <stop offset="50%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#f472b6" />
            </linearGradient>
          </defs>

          {/* Directed Bezier Edges (Connecting Workflow Wire Loop) */}
          {/* Wire 1: From Trigger Handle to Stagehand AI Agent */}
          <path
            d="M 8.5 9.5 C 15 9.5, 16.5 16, 23.5 16"
            stroke="url(#nodus-edge-grad)"
            strokeWidth="2.4"
            strokeLinecap="round"
          />

          {/* Wire 2: From Stagehand AI Agent to Execution / Output */}
          <path
            d="M 23.5 16 C 16.5 16, 15 22.5, 8.5 22.5"
            stroke="url(#nodus-edge-grad)"
            strokeWidth="2.4"
            strokeLinecap="round"
          />

          {/* Vertical Sync Rail (Multiplayer Canvas Loop) */}
          <path
            d="M 8.5 9.5 L 8.5 22.5"
            stroke="white"
            strokeWidth="1.2"
            strokeDasharray="2 2"
            opacity="0.4"
          />

          {/* Pulse Signal on Wire (Active Run Indicator) */}
          <circle cx="16" cy="16" r="1.5" fill="#ffffff" />

          {/* Node 1: Input Trigger Node (Top Left - Blue) */}
          <circle
            cx="8.5"
            cy="9.5"
            r="3.5"
            fill="#3b82f6"
            stroke="#ffffff"
            strokeWidth="1.8"
          />
          <circle cx="8.5" cy="9.5" r="1.2" fill="#ffffff" />

          {/* Node 2: Stagehand AI Web Agent Node (Center Right - Pink Hero Node) */}
          <circle
            cx="23.5"
            cy="16"
            r="4.2"
            fill="#ec4899"
            stroke="#ffffff"
            strokeWidth="2"
          />
          <circle cx="23.5" cy="16" r="1.6" fill="#ffffff" />

          {/* Node 3: Output Action / Browser Execution Node (Bottom Left - Emerald) */}
          <circle
            cx="8.5"
            cy="22.5"
            r="3.5"
            fill="#10b981"
            stroke="#ffffff"
            strokeWidth="1.8"
          />
          <circle cx="8.5" cy="22.5" r="1.2" fill="#ffffff" />
        </svg>
      </div>

      {withText && (
        <span className={cn("font-bold tracking-tight text-foreground", textSize)}>
          Nodus
        </span>
      )}
    </div>
  )
}
