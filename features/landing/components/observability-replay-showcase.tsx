"use client"

import * as React from "react"
import {
  Activity,
  Bot,
  CheckCircle2,
  Clock,
  Eye,
  FileText,
  Globe,
  Maximize2,
  MousePointerClick,
  Pause,
  Play,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Terminal,
  Video,
} from "lucide-react"
import { motion } from "motion/react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const DOM_ACTIONS = [
  {
    step: "01",
    action: "open-url",
    target: "https://linkedin.com/search/leads",
    status: "success",
    duration: "1.4s",
    selector: "context.newPage()",
  },
  {
    step: "02",
    action: "observe",
    target: "Locate search filter bar & verified leads list",
    status: "success",
    duration: "420ms",
    selector: "xpath=//div[@role='region']//button",
  },
  {
    step: "03",
    action: "act",
    target: "Click 'Connect' and open personalized message box",
    status: "success",
    duration: "310ms",
    selector: "xpath=//button[contains(@aria-label, 'Connect')]",
  },
  {
    step: "04",
    action: "extract",
    target: "Extract profile headline, company, & verified email",
    status: "success",
    duration: "890ms",
    selector: "z.object({ headline, email, company })",
  },
]

export function ObservabilityReplayShowcase() {
  const [isPlaying, setIsPlaying] = React.useState(true)
  const [progress, setProgress] = React.useState(42)

  React.useEffect(() => {
    if (!isPlaying) return
    const interval = setInterval(() => {
      setProgress((prev) => (prev >= 100 ? 0 : prev + 1))
    }, 120)
    return () => clearInterval(interval)
  }, [isPlaying])

  return (
    <div className="w-full">
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground mb-4 shadow-xs">
          <Activity className="size-3.5 text-emerald-500" />
          <span>Zero Black-Box Execution</span>
        </div>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
          Browserbase Live View &amp; Full Session Replays
        </h2>
        <p className="mt-3 text-sm sm:text-base text-muted-foreground leading-relaxed">
          Never wonder what an AI agent did on a webpage. Inspect every DOM event, visual vision
          target, network request, and video replay scrubbing down to the millisecond.
        </p>
      </div>

      {/* Observability Studio Window */}
      <div className="rounded-2xl border border-border bg-card shadow-2xl overflow-hidden dark:bg-[#111113]">
        {/* Studio Window Chrome Topbar */}
        <div className="h-11 border-b border-border bg-muted/40 px-4 flex items-center justify-between text-xs select-none">
          <div className="flex items-center gap-2 font-mono">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold text-foreground">Session Observability</span>
            <span className="text-muted-foreground">· bb_sess_902a481c</span>
          </div>

          <div className="flex items-center gap-3">
            <Badge variant="outline" className="h-6 font-mono text-[10px] bg-background gap-1">
              <ShieldCheck className="size-3 text-emerald-500" />
              <span>Anti-Bot Passed</span>
            </Badge>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Clock className="size-3.5" />
              <span className="font-mono text-xs">Total: 3.02s</span>
            </div>
          </div>
        </div>

        {/* Two-Panel Body: Left Step Logs, Right Browserbase Replay Screen */}
        <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-border">
          {/* Left Column: Real Execution Logs & Step Trace */}
          <div className="lg:col-span-5 p-5 sm:p-6 flex flex-col justify-between bg-card/60 dark:bg-[#141416]">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
                <div className="flex items-center gap-2">
                  <Terminal className="size-4 text-blue-500" />
                  <span className="text-xs font-semibold font-mono uppercase tracking-wider text-foreground">
                    DAG Step Traces
                  </span>
                </div>
                <span className="text-xs font-mono text-muted-foreground">4/4 Completed</span>
              </div>

              <div className="space-y-3">
                {DOM_ACTIONS.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg border border-border bg-card/80 dark:bg-[#1c1c1e] text-xs font-mono space-y-1.5 transition-all hover:border-primary/40"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-blue-500 font-bold">{item.step}</span>
                        <span className="font-semibold uppercase tracking-wider text-foreground text-[11px]">
                          {item.action}
                        </span>
                      </div>
                      <span className="text-muted-foreground text-[11px] flex items-center gap-1">
                        <CheckCircle2 className="size-3 text-emerald-500" />
                        {item.duration}
                      </span>
                    </div>

                    <div className="text-foreground dark:text-zinc-200 text-xs font-sans">
                      {item.target}
                    </div>

                    <div className="text-[10px] text-muted-foreground font-mono truncate bg-muted/50 rounded px-2 py-0.5">
                      {item.selector}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-border flex items-center justify-between text-xs font-mono text-muted-foreground">
              <span>Memory: 182 MB</span>
              <span>Tokens: 412 prompt / 89 comp</span>
            </div>
          </div>

          {/* Right Column: Simulated Browserbase Live View & HLS Player */}
          <div className="lg:col-span-7 flex flex-col bg-muted/20 dark:bg-[#0c0c0e]">
            {/* Simulated Browser URL Header */}
            <div className="h-10 border-b border-border bg-card/80 dark:bg-[#18181b] px-4 flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-full bg-rose-500/80" />
                <span className="size-2.5 rounded-full bg-amber-500/80" />
                <span className="size-2.5 rounded-full bg-emerald-500/80" />
              </div>

              <div className="flex-1 max-w-md mx-auto rounded-md bg-muted/60 dark:bg-[#27272a] px-3 py-1 text-xs font-mono text-muted-foreground flex items-center gap-2 truncate">
                <Globe className="size-3 shrink-0 text-emerald-500" />
                <span className="truncate text-foreground dark:text-zinc-200">
                  https://linkedin.com/search/leads?q=founder
                </span>
              </div>
            </div>

            {/* Browser Viewport with Stagehand Vision Overlay */}
            <div className="relative flex-1 min-h-[300px] sm:min-h-[360px] p-6 flex flex-col justify-center items-center overflow-hidden select-none">
              {/* Fake web page layout preview */}
              <div className="w-full max-w-md rounded-xl border border-border bg-card p-5 shadow-lg space-y-4 dark:bg-[#1a1a1c]">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-full bg-blue-600/20 text-blue-600 dark:text-blue-400 font-bold flex items-center justify-center text-sm">
                    AT
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-foreground">
                      Alex Turner · VP of Growth
                    </div>
                    <div className="text-xs text-muted-foreground">
                      ScalePoint AI · 50-200 employees
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="h-2 w-3/4 rounded bg-muted" />
                  <div className="h-2 w-full rounded bg-muted/60" />
                </div>

                {/* The Stagehand Target Element with Vision Bounding Box */}
                <div className="relative pt-2">
                  <div className="relative inline-flex">
                    {/* Simulated Connect Button */}
                    <div className="px-4 py-1.5 rounded-md bg-blue-600 text-white text-xs font-medium shadow-sm flex items-center gap-1.5">
                      <MousePointerClick className="size-3.5" />
                      <span>Connect with Note</span>
                    </div>

                    {/* Stagehand AI Vision Overlay Box */}
                    <div className="absolute -inset-1.5 rounded-lg border-2 border-pink-500 pointer-events-none animate-pulse">
                      <span className="absolute -top-3.5 left-1 rounded bg-pink-500 text-white text-[9px] font-mono px-1.5 py-0.2 font-bold uppercase shadow-xs">
                        Stagehand Action · Confidence 0.99
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Live View Watermark */}
              <div className="absolute top-4 right-4 flex items-center gap-2 bg-background/90 dark:bg-black/80 backdrop-blur-md px-2.5 py-1 rounded-md border border-border text-[11px] font-mono">
                <span className="size-2 rounded-full bg-rose-500 animate-ping" />
                <span className="font-semibold text-foreground">LIVE VIEW</span>
                <span className="text-muted-foreground">1080p @ 60fps</span>
              </div>
            </div>

            {/* HLS Video Scrubber & Playback Controls */}
            <div className="h-12 border-t border-border bg-card px-4 flex items-center justify-between text-xs select-none dark:bg-[#141416]">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsPlaying((p) => !p)}
                  className="size-7 flex items-center justify-center rounded-md hover:bg-muted text-foreground transition-colors cursor-pointer"
                  title={isPlaying ? "Pause" : "Play"}
                >
                  {isPlaying ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={() => setProgress(0)}
                  className="size-7 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  title="Restart replay"
                >
                  <RotateCcw className="size-3.5" />
                </button>
                <span className="font-mono text-xs text-muted-foreground ml-1">
                  00:{progress.toString().padStart(2, "0")} / 01:42
                </span>
              </div>

              {/* Scrubber Progress Bar */}
              <div className="flex-1 max-w-xs mx-4">
                <div
                  className="h-1.5 w-full bg-muted rounded-full overflow-hidden cursor-pointer"
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect()
                    const clickX = e.clientX - rect.left
                    setProgress(Math.round((clickX / rect.width) * 100))
                  }}
                >
                  <div
                    style={{ width: `${progress}%` }}
                    className="h-full bg-blue-500 rounded-full transition-all duration-100"
                  />
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-muted-foreground font-mono text-[11px]">
                <Video className="size-3.5 text-blue-500" />
                <span>HLS Replay</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
