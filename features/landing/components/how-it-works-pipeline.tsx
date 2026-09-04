import * as React from "react"
import {
  MousePointerClick,
  Users,
  Workflow,
  Zap,
} from "lucide-react"

import { cn } from "@/lib/utils"

const PIPELINE_STEPS = [
  {
    step: "01",
    title: "Compose Nodes on Canvas",
    subtitle: "Triggers, Browser Agents & Sandboxes",
    description:
      "Drag and drop event-driven triggers (Stripe, Google Forms, Webhooks) and autonomous Stagehand browser agents onto the infinite canvas.",
    icon: MousePointerClick,
    iconBg: "bg-[#2563eb] text-white",
    accent: "border-blue-500/30",
    handleColor: "bg-blue-500",
    parameters: [
      { label: "Trigger", value: "Stripe Webhook / Lead Ingestion" },
      { label: "Engine", value: "Stagehand v4 + Browserbase" },
    ],
    output: "{{ Step 1 · targetUrl }}",
  },
  {
    step: "02",
    title: "Co-Author with Team",
    subtitle: "Real-Time CRDT Multiplayer",
    description:
      "Collaborate synchronously with your team. Watch teammates' cursors glide across the canvas, inspect active presence rings, and attach comments to handles.",
    icon: Users,
    iconBg: "bg-[#ec4899] text-white",
    accent: "border-pink-500/30",
    handleColor: "bg-pink-500",
    parameters: [
      { label: "Latency", value: "< 28ms CRDT Sync" },
      { label: "Presence", value: "Priya, Rohan, Aditya, Neha active" },
    ],
    output: "{{ Step 2 · teamApproved }}",
  },
  {
    step: "03",
    title: "Deploy & Observe Replays",
    subtitle: "Zero-Timeout Trigger.dev Tasks",
    description:
      "Execute runs in durable background workers. Stream millisecond execution logs directly to the studio and scrub full Browserbase video replays.",
    icon: Zap,
    iconBg: "bg-[#10b981] text-white",
    accent: "border-emerald-500/30",
    handleColor: "bg-emerald-500",
    parameters: [
      { label: "Workers", value: "Distributed Trigger.dev DAG" },
      { label: "Replay", value: "Browserbase HLS Video Stream" },
    ],
    output: "{{ Step 3 · executionResult }}",
  },
]

export function HowItWorksPipeline() {
  return (
    <div className="w-full">
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground mb-4 shadow-xs">
          <Workflow className="size-3.5 text-blue-500" />
          <span>The 3-Step Lifecycle</span>
        </div>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
          How Workflows Run from Idea to Production
        </h2>
        <p className="mt-3 text-sm sm:text-base text-muted-foreground leading-relaxed">
          From first drag-and-drop to distributed multi-tenant background execution — here is how your
          pipeline flows seamlessly through the Nodus studio.
        </p>
      </div>

      {/* 3 Connected Pipeline Nodes */}
      <div className="relative">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch relative z-10">
          {PIPELINE_STEPS.map((step, idx) => {
            const Icon = step.icon
            return (
              <div
                key={idx}
                className={cn(
                  "relative rounded-2xl border bg-card p-6 shadow-md flex flex-col justify-between transition-all duration-200 hover:shadow-xl dark:bg-[#141417] select-none",
                  step.accent
                )}
              >
                {/* Left Target Handle Notch (except first node) */}
                {idx > 0 && (
                  <div
                    style={{
                      position: "absolute",
                      left: 0,
                      top: "42px",
                      transform: "translate(-100%, -50%)",
                    }}
                    className={cn(
                      "hidden lg:block w-2 h-4 rounded-l-xs shadow-xs",
                      step.handleColor
                    )}
                  />
                )}

                {/* Right Source Handle Notch (except last node) */}
                {idx < PIPELINE_STEPS.length - 1 && (
                  <div
                    style={{
                      position: "absolute",
                      right: 0,
                      top: "42px",
                      transform: "translate(100%, -50%)",
                    }}
                    className={cn(
                      "hidden lg:block w-2 h-4 rounded-r-xs shadow-xs",
                      step.handleColor
                    )}
                  />
                )}

                <div>
                  {/* Step Header */}
                  <div className="flex items-center justify-between pb-4 border-b border-border/80 mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "flex size-9 shrink-0 items-center justify-center rounded-lg shadow-xs",
                          step.iconBg
                        )}
                      >
                        <Icon className="size-4.5" />
                      </div>
                      <div>
                        <div className="text-xs font-mono font-bold text-muted-foreground">
                          NODE {step.step}
                        </div>
                        <div className="text-sm font-semibold text-foreground">{step.title}</div>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>

                  {/* Node Parameters Box */}
                  <div className="mt-5 p-3 rounded-lg border border-border/80 bg-muted/30 text-xs font-mono space-y-1.5 dark:bg-[#1c1c1f]">
                    {step.parameters.map((param, i) => (
                      <div key={i} className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground text-[11px]">{param.label}:</span>
                        <span className="text-foreground dark:text-zinc-200 text-[11px] truncate max-w-[170px]">
                          {param.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Output Token Pill */}
                <div className="mt-5 pt-3 border-t border-border/80 flex items-center justify-between text-xs">
                  <span className="text-[10px] uppercase font-mono text-muted-foreground">
                    Output Token
                  </span>
                  <span className="inline-flex items-center gap-1 font-mono text-[10px] px-2 py-0.5 rounded bg-muted text-foreground border border-border/60">
                    <span className="size-1 rounded-full bg-emerald-500" />
                    <span>{step.output}</span>
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
