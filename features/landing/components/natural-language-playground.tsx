"use client"

import * as React from "react"
import {
  Bot,
  CheckCircle2,
  Copy,
  Eye,
  FileCode,
  FileText,
  MousePointerClick,
  Sparkles,
  Terminal,
  Zap,
} from "lucide-react"
import { motion, AnimatePresence } from "motion/react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface PlaygroundPreset {
  id: string
  label: string
  instruction: string
  method: "extract" | "act" | "agent"
  generatedCode: string
  schemaSnippet?: string
  locator: string
  simulatedOutput: string
}

const PRESETS: PlaygroundPreset[] = [
  {
    id: "extract-leads",
    label: "Extract Verified Leads",
    instruction: "Extract all founder names, verified emails, and company size from this directory",
    method: "extract",
    generatedCode: `const { data } = await stagehand.extract(
  "extract all founder names, verified emails, and company size",
  z.object({
    founders: z.array(z.object({
      name: z.string(),
      email: z.string().email(),
      companySize: z.string()
    }))
  })
);`,
    schemaSnippet: "z.object({ founders: z.array(...) })",
    locator: "stagehand.extract() · Vision Model Scanned 14 Elements",
    simulatedOutput: JSON.stringify(
      {
        founders: [
          { name: "Alex Turner", email: "alex@saasgrowth.io", companySize: "45 employees" },
          { name: "Priya Rao", email: "priya@deepflow.ai", companySize: "120 employees" },
        ],
      },
      null,
      2
    ),
  },
  {
    id: "export-invoices",
    label: "Export Billing Invoices",
    instruction: "Click into the billing settings tab, select the latest monthly invoice and download CSV",
    method: "act",
    generatedCode: `// Atomic action planning with zero DOM selector fragility
const { data: actions } = await stagehand.observe("click the latest monthly invoice download link");
const [downloadAction] = actions;

if (downloadAction) {
  await stagehand.act(downloadAction);
}`,
    locator: "xpath=//table//tr[1]//button[contains(@aria-label, 'Download')]",
    simulatedOutput: JSON.stringify(
      {
        status: "download_triggered",
        filename: "invoice_2026_09.csv",
        contentLength: "48.2 KB",
        checksum: "sha256_90a1f8",
      },
      null,
      2
    ),
  },
  {
    id: "competitor-monitor",
    label: "Monitor Competitor Pricing",
    instruction: "Inspect the competitor pricing grid, detect any active discount banners and compare annual vs monthly",
    method: "agent",
    generatedCode: `// Autonomous visual planner for dynamic single-page apps
const { data } = await stagehand.agent({
  goal: "Locate pricing table, toggle to annual billing, and extract tier discounts",
  maxSteps: 8,
  model: "openai/gpt-5.4-mini"
});`,
    locator: "Autonomous Planner: 4 DOM actions executed, 1 toggle clicked",
    simulatedOutput: JSON.stringify(
      {
        annualDiscount: "20% off",
        proMonthly: "$29",
        proAnnualEquivalent: "$23",
        couponBannerDetected: false,
      },
      null,
      2
    ),
  },
]

export function NaturalLanguagePlayground() {
  const [activePresetId, setActivePresetId] = React.useState<string>("extract-leads")
  const [copied, setCopied] = React.useState(false)

  const active = PRESETS.find((p) => p.id === activePresetId) ?? PRESETS[0]

  const handleCopy = () => {
    navigator.clipboard.writeText(active.generatedCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="w-full">
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground mb-4 shadow-xs">
          <Bot className="size-3.5 text-pink-500" />
          <span>Stagehand v4 Natural Language Engine</span>
        </div>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
          Natural Language into Resilient Browser Code
        </h2>
        <p className="mt-3 text-sm sm:text-base text-muted-foreground leading-relaxed">
          Forget fragile CSS paths or XPath selectors that break on every frontend update.
          Describe what you want done in plain English, and Stagehand resolves it visually.
        </p>

        {/* Preset Chips */}
        <div className="mt-7 flex flex-wrap items-center justify-center gap-2 select-none">
          {PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => setActivePresetId(preset.id)}
              className={cn(
                "px-3.5 py-1.5 text-xs font-medium rounded-full border transition-all cursor-pointer shadow-2xs flex items-center gap-1.5",
                activePresetId === preset.id
                  ? "bg-primary text-primary-foreground border-primary font-semibold"
                  : "bg-card hover:bg-muted text-muted-foreground hover:text-foreground border-border/80"
              )}
            >
              <Sparkles className="size-3" />
              <span>{preset.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Code & Output Splitter */}
      <div className="rounded-2xl border border-border bg-card shadow-2xl overflow-hidden dark:bg-[#111113]">
        {/* Terminal Header */}
        <div className="h-11 border-b border-border bg-muted/40 px-4 flex items-center justify-between text-xs select-none">
          <div className="flex items-center gap-2 font-mono">
            <span className="size-2 rounded-full bg-emerald-500" />
            <span className="font-semibold text-foreground">Natural Language Prompt</span>
            <span className="text-muted-foreground">· method: {active.method}</span>
          </div>

          <Button
            size="sm"
            variant="ghost"
            onClick={handleCopy}
            className="h-7 px-2.5 text-xs font-mono gap-1 text-muted-foreground hover:text-foreground cursor-pointer"
          >
            {copied ? <CheckCircle2 className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
            <span>{copied ? "Copied" : "Copy Code"}</span>
          </Button>
        </div>

        {/* Natural Language Prompt Input Bar */}
        <div className="p-4 border-b border-border/80 bg-muted/15 flex items-center gap-3">
          <div className="size-7 rounded-md bg-pink-500/15 text-pink-500 flex items-center justify-center shrink-0">
            <Bot className="size-4" />
          </div>
          <div className="flex-1 font-mono text-xs sm:text-sm text-foreground font-medium truncate">
            &quot;{active.instruction}&quot;
          </div>
        </div>

        {/* Code & JSON Output Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-border">
          {/* Left: Generated Stagehand v4 Code (Light & Dark Compatible) */}
          <div className="lg:col-span-7 p-5 bg-muted/40 dark:bg-[#0c0c0e] text-foreground dark:text-[#f4f4f5] font-mono text-xs overflow-x-auto">
            <div className="flex items-center justify-between pb-2 border-b border-border dark:border-zinc-800 text-muted-foreground dark:text-zinc-400 text-[11px] mb-3">
              <span className="flex items-center gap-1.5 font-medium">
                <FileCode className="size-3.5 text-blue-500 dark:text-sky-400" />
                <span className="text-foreground dark:text-zinc-200">Generated Stagehand v4 Task</span>
              </span>
              <span className="text-muted-foreground dark:text-zinc-500 font-mono text-[10px]">TypeScript</span>
            </div>

            <pre className="text-[12px] leading-relaxed text-foreground dark:text-zinc-200 whitespace-pre-wrap font-mono">
              {active.generatedCode}
            </pre>

            <div className="mt-4 pt-3 border-t border-border dark:border-zinc-800 text-[11px] text-muted-foreground dark:text-zinc-400 flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              <span>{active.locator}</span>
            </div>
          </div>

          {/* Right: Resolved JSON Output (Light & Dark Compatible) */}
          <div className="lg:col-span-5 p-5 bg-card dark:bg-[#141416] font-mono text-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-border text-muted-foreground text-[11px] mb-3">
                <span className="flex items-center gap-1.5 text-foreground font-semibold">
                  <Terminal className="size-3.5 text-blue-500" />
                  <span>Validated Zod Output</span>
                </span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">200 OK</span>
              </div>

              <pre className="text-[11px] text-foreground dark:text-zinc-300 overflow-x-auto whitespace-pre-wrap bg-muted/50 dark:bg-[#1c1c1f] p-3 rounded-lg border border-border/80">
                {active.simulatedOutput}
              </pre>
            </div>

            <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground font-mono">
              <span>Cache: HIT (Browserbase)</span>
              <span>Inference: 310ms</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
