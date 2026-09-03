"use client"

import * as React from "react"
import {
  Check,
  CheckCircle2,
  GitBranch,
  MessageSquare,
  Sparkles,
  Users,
  Zap,
} from "lucide-react"
import { motion } from "motion/react"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export function MultiplayerCollaborationShowcase() {
  return (
    <div className="w-full">
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground mb-4 shadow-xs">
          <Users className="size-3.5 text-pink-500" />
          <span>Liveblocks CRDT Multiplayer</span>
        </div>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
          Co-Author Pipelines Live with Sub-30ms Presence
        </h2>
        <p className="mt-3 text-sm sm:text-base text-muted-foreground leading-relaxed">
          Never overwrite a teammate&apos;s workflow. Nodus brings Google Docs-style real-time multiplayer
          to DAG pipelines with visual presence locks, multi-cursor tracking, and handle-anchored comments.
        </p>
      </div>

      {/* Interactive Collaboration Canvas Showcase */}
      <div className="relative rounded-2xl border border-border bg-card shadow-2xl overflow-hidden dark:bg-[#111113]">
        {/* Collaboration Canvas Header */}
        <div className="h-11 border-b border-border bg-muted/40 px-4 flex items-center justify-between text-xs select-none">
          <div className="flex items-center gap-2 font-mono">
            <span className="size-2 rounded-full bg-pink-500 animate-ping" />
            <span className="font-semibold text-foreground">Multiplayer Canvas Room</span>
            <span className="text-muted-foreground">· liveblocks:room_acq_global</span>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="h-6 font-mono text-[10px] bg-background gap-1">
              <Zap className="size-3 text-emerald-500" />
              <span>24ms Sync Latency</span>
            </Badge>
          </div>
        </div>

        {/* Canvas Body with Dot Grid & Collaborative Flow */}
        <div
          className="p-8 sm:p-12 relative overflow-hidden min-h-[460px] flex flex-col justify-center"
          style={{
            backgroundImage:
              "radial-gradient(hsl(var(--foreground) / 0.12) 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }}
        >
          {/* Visual SVG Connecting Wire */}
          <svg className="absolute inset-0 size-full pointer-events-none overflow-visible">
            {/* Smooth orthogonal wire connecting Node 1 to Node 2 */}
            <path
              d="M 280 230 C 340 230, 360 230, 420 230"
              fill="none"
              stroke="#3b82f6"
              strokeWidth="2"
              className="opacity-80"
            />
            {/* Branching wire to Node 3 */}
            <path
              d="M 680 230 C 740 230, 750 310, 810 310"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-border dark:text-[#2e2e32]"
            />
          </svg>

          {/* Collaborative Nodes Grid */}
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-8 items-center max-w-5xl mx-auto w-full">
            {/* Node 1: Inspected by Priya Sharma */}
            <div className="relative rounded-xl border-2 border-pink-500 bg-card p-4 shadow-lg dark:bg-[#1c1c1e] select-none">
              {/* Priya Presence Tag */}
              <div className="absolute -top-3 left-3 rounded-full bg-pink-500 text-white text-[10px] font-semibold px-2 py-0.5 shadow-xs flex items-center gap-1">
                <span className="size-1 rounded-full bg-white animate-pulse" />
                <span>Priya Sharma (Editing)</span>
              </div>

              {/* Handles */}
              <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full w-2 h-4 rounded-r-xs bg-pink-500" />

              <div className="flex items-center gap-2.5 pb-2 border-b border-border/80">
                <div className="size-7 rounded-md bg-pink-500 text-white flex items-center justify-center font-bold text-xs">
                  AI
                </div>
                <div>
                  <div className="text-xs font-semibold text-foreground">Extract Decision Makers</div>
                  <div className="text-[10px] text-muted-foreground">Stagehand v4 Action</div>
                </div>
              </div>

              <div className="mt-2 text-[11px] font-mono text-muted-foreground space-y-1">
                <div className="text-foreground dark:text-zinc-200 truncate">
                  schema: &#123; verifiedEmail: z.email() &#125;
                </div>
                <div className="text-emerald-500 text-[10px] flex items-center gap-1">
                  <Check className="size-3" />
                  <span>Validation Passed</span>
                </div>
              </div>

              {/* Animated Floating Cursor */}
              <div className="absolute -bottom-4 right-4 pointer-events-none flex items-center gap-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 32 32"
                  width="18"
                  height="18"
                  className="text-pink-500 drop-shadow-md"
                >
                  <path
                    fill="currentColor"
                    d="m.088 1.75 11.25 29.422c.409 1.07 1.908 1.113 2.377.067l5.223-11.653c.13-.288.36-.518.648-.648l11.653-5.223c1.046-.47 1.004-1.968-.067-2.377L1.75.088C.71-.31-.31.71.088 1.75Z"
                  />
                </svg>
                <span className="rounded-full bg-pink-500 text-white text-[10px] font-medium px-2 py-0.5 shadow-md">
                  Priya Sharma
                </span>
              </div>
            </div>

            {/* Node 2: Tuned by Rohan Mehta with Live Anchored Comment */}
            <div className="relative rounded-xl border-2 border-amber-500 bg-card p-4 shadow-lg dark:bg-[#1c1c1e] select-none">
              {/* Rohan Presence Tag */}
              <div className="absolute -top-3 left-3 rounded-full bg-amber-500 text-white text-[10px] font-semibold px-2 py-0.5 shadow-xs flex items-center gap-1">
                <span className="size-1 rounded-full bg-white animate-pulse" />
                <span>Rohan Mehta (Reviewing)</span>
              </div>

              {/* Handles */}
              <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full w-2 h-4 rounded-l-xs bg-blue-500" />
              <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full w-2 h-4 rounded-r-xs bg-amber-500" />

              <div className="flex items-center gap-2.5 pb-2 border-b border-border/80">
                <div className="size-7 rounded-md bg-amber-500 text-white flex items-center justify-center font-bold text-xs">
                  PY
                </div>
                <div>
                  <div className="text-xs font-semibold text-foreground">Enrichment Sandbox</div>
                  <div className="text-[10px] text-muted-foreground">E2B Python Execution</div>
                </div>
              </div>

              <div className="mt-2 text-[11px] font-mono text-muted-foreground space-y-1">
                <div className="text-foreground dark:text-zinc-200 truncate">
                  def enrich_lead(email, domain):
                </div>
                <div className="text-amber-500 text-[10px]">
                  Vault Token: &#123;&#123; secrets.CLEARBIT_KEY &#125;&#125;
                </div>
              </div>

              {/* Anchored Multiplayer Comment Thread */}
              <div className="absolute -top-16 -right-6 sm:-right-10 w-64 rounded-xl border border-border bg-card p-2.5 shadow-xl text-xs space-y-1.5 dark:bg-[#202024] z-20">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-pink-500 flex items-center gap-1">
                    <MessageSquare className="size-3" />
                    <span>Priya Sharma</span>
                  </span>
                  <span className="text-[10px] text-muted-foreground">2m ago</span>
                </div>
                <p className="text-[11px] text-foreground leading-snug">
                  &quot;Let&apos;s filter out disposable domains before passing to the mailer.&quot;
                </p>
                <div className="pt-1 border-t border-border flex items-center gap-1 text-[10px] text-emerald-500 font-medium">
                  <CheckCircle2 className="size-3" />
                  <span>Rohan resolved: regex applied</span>
                </div>
              </div>
            </div>

            {/* Node 3: Dispatched by Aditya Patel */}
            <div className="relative rounded-xl border border-border bg-card p-4 shadow-md dark:bg-[#1c1c1e] select-none">
              {/* Handles */}
              <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full w-2 h-4 rounded-l-xs bg-border" />
              <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full w-2 h-4 rounded-r-xs bg-border" />

              <div className="flex items-center gap-2.5 pb-2 border-b border-border/80">
                <div className="size-7 rounded-md bg-[#f97316] text-white flex items-center justify-center font-bold text-xs">
                  TX
                </div>
                <div>
                  <div className="text-xs font-semibold text-foreground">Omnichannel Dispatch</div>
                  <div className="text-[10px] text-muted-foreground">Resend + Slack API</div>
                </div>
              </div>

              <div className="mt-2 text-[11px] font-mono text-muted-foreground space-y-1">
                <div className="text-foreground dark:text-zinc-200 truncate">
                  to: &#123;&#123; Enrich · email &#125;&#125;
                </div>
                <div className="text-blue-500 text-[10px]">
                  Subject: 3x pipeline with AI agents
                </div>
              </div>

              {/* Aditya Cursor Floating */}
              <div className="absolute -bottom-4 left-4 pointer-events-none flex items-center gap-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 32 32"
                  width="18"
                  height="18"
                  className="text-blue-500 drop-shadow-md"
                >
                  <path
                    fill="currentColor"
                    d="m.088 1.75 11.25 29.422c.409 1.07 1.908 1.113 2.377.067l5.223-11.653c.13-.288.36-.518.648-.648l11.653-5.223c1.046-.47 1.004-1.968-.067-2.377L1.75.088C.71-.31-.31.71.088 1.75Z"
                  />
                </svg>
                <span className="rounded-full bg-blue-500 text-white text-[10px] font-medium px-2 py-0.5 shadow-md">
                  Aditya Patel
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
