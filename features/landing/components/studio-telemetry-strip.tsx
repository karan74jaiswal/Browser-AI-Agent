import * as React from "react"
import {
  CheckCircle2,
  Cpu,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react"

import { cn } from "@/lib/utils"

interface MetricItem {
  value: string
  label: string
  detail: string
  icon: React.ComponentType<{ className?: string }>
  badge: string
  accent: string
}

const METRICS: MetricItem[] = [
  {
    value: "99.8%",
    label: "AI Task Success Rate",
    detail: "Stagehand v4 vision-driven DOM interactions",
    icon: Sparkles,
    badge: "Stagehand AI",
    accent: "text-pink-500 bg-pink-500/10 border-pink-500/20",
  },
  {
    value: "< 28ms",
    label: "Real-Time Sync Latency",
    detail: "Liveblocks CRDT conflict-free presence",
    icon: Zap,
    badge: "Multiplayer",
    accent: "text-blue-500 bg-blue-500/10 border-blue-500/20",
  },
  {
    value: "0 Timeouts",
    label: "Durable Worker Execution",
    detail: "Trigger.dev distributed background tasks",
    icon: Cpu,
    badge: "Trigger.dev",
    accent: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
  },
  {
    value: "100% Stealth",
    label: "Anti-Bot Masking",
    detail: "Browserbase residential proxies & replays",
    icon: ShieldCheck,
    badge: "Browserbase",
    accent: "text-amber-500 bg-amber-500/10 border-amber-500/20",
  },
]

export function StudioTelemetryStrip() {
  return (
    <div className="w-full">
      {/* Container with ambient dot border */}
      <div className="rounded-2xl border border-border bg-card/70 backdrop-blur-md shadow-lg overflow-hidden dark:bg-[#121214]/80 select-none">
        {/* Top Status Header */}
        <div className="h-9 border-b border-border/80 bg-muted/30 px-4 flex items-center justify-between text-xs font-mono text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold text-foreground">Global Cluster Telemetry</span>
            <span className="hidden sm:inline">· US-East &middot; EU-Central &middot; AP-South</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-blue-500" />
            <span className="text-[11px] text-foreground font-medium">All Workers Operational</span>
          </div>
        </div>

        {/* 4 Metric Columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-border/80">
          {METRICS.map((metric, idx) => {
            const Icon = metric.icon
            return (
              <div
                key={idx}
                className="p-5 flex flex-col justify-between transition-colors hover:bg-muted/30 group"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className={cn(
                        "text-[10px] font-mono px-2 py-0.5 rounded-md border font-semibold flex items-center gap-1",
                        metric.accent
                      )}
                    >
                      <Icon className="size-3" />
                      <span>{metric.badge}</span>
                    </span>
                    <CheckCircle2 className="size-3.5 text-emerald-500/60 group-hover:text-emerald-500 transition-colors" />
                  </div>

                  <div className="text-2xl sm:text-3xl font-extrabold font-mono tracking-tight text-foreground">
                    {metric.value}
                  </div>

                  <div className="text-xs font-semibold text-foreground mt-1">
                    {metric.label}
                  </div>
                </div>

                <div className="text-[11px] text-muted-foreground font-mono mt-3 line-clamp-1">
                  {metric.detail}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
