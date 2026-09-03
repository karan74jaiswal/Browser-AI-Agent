"use client"

import * as React from "react"
import {
  Bot,
  CheckCircle2,
  Cpu,
  CreditCard,
  Database,
  FileCode,
  Globe,
  Layers,
  Mail,
  MessageSquare,
  MousePointerClick,
  Network,
  Share2,
  Sparkles,
  Workflow,
  Zap,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface IntegrationItem {
  name: string
  category: "Triggers & Ingestion" | "AI & Cloud Browsers" | "Execution Sandboxes" | "Outreach & CRMs"
  role: string
  icon: React.ComponentType<{ className?: string }>
  iconBg: string
  handle: string
}

const INTEGRATIONS: IntegrationItem[] = [
  // Triggers
  {
    name: "Stripe",
    category: "Triggers & Ingestion",
    role: "Payments, Invoices & Churn Webhooks",
    icon: CreditCard,
    iconBg: "bg-[#635BFF] text-white",
    handle: "{{ stripe.event }}",
  },
  {
    name: "Google Forms",
    category: "Triggers & Ingestion",
    role: "Inbound Leads & Survey Submissions",
    icon: MousePointerClick,
    iconBg: "bg-purple-600 text-white",
    handle: "{{ form.responseId }}",
  },
  {
    name: "Custom Webhooks",
    category: "Triggers & Ingestion",
    role: "HMAC Signed HTTP Ingestion",
    icon: Network,
    iconBg: "bg-blue-600 text-white",
    handle: "{{ webhook.payload }}",
  },

  // AI & Browsers
  {
    name: "Stagehand v4",
    category: "AI & Cloud Browsers",
    role: "Visual Web Agents (Act, Extract, Observe)",
    icon: Bot,
    iconBg: "bg-[#ec4899] text-white",
    handle: "stagehand.observe()",
  },
  {
    name: "Browserbase",
    category: "AI & Cloud Browsers",
    role: "Stealth Cloud Browsers & Replays",
    icon: Globe,
    iconBg: "bg-[#10b981] text-white",
    handle: "browserbase.session",
  },
  {
    name: "OpenAI & Claude",
    category: "AI & Cloud Browsers",
    role: "Reasoning & Natural Language Planning",
    icon: Sparkles,
    iconBg: "bg-sky-600 text-white",
    handle: "model.plan()",
  },

  // Execution & Sandboxes
  {
    name: "Trigger.dev V3",
    category: "Execution Sandboxes",
    role: "Zero-Timeout Background Workers",
    icon: Zap,
    iconBg: "bg-[#f59e0b] text-white",
    handle: "tasks.trigger()",
  },
  {
    name: "E2B Sandboxes",
    category: "Execution Sandboxes",
    role: "Isolated Python & TypeScript Micro-VMs",
    icon: Cpu,
    iconBg: "bg-amber-600 text-white",
    handle: "sandbox.runCode()",
  },
  {
    name: "AES-256 Vault",
    category: "Execution Sandboxes",
    role: "Multi-Tenant Secret Store",
    icon: Database,
    iconBg: "bg-slate-700 text-white",
    handle: "{{ secrets.KEY }}",
  },

  // Outreach & CRMs
  {
    name: "Resend",
    category: "Outreach & CRMs",
    role: "Transactional & High-Deliverability Cold Mail",
    icon: Mail,
    iconBg: "bg-[#f97316] text-white",
    handle: "{{ email.delivered }}",
  },
  {
    name: "Slack & Discord",
    category: "Outreach & CRMs",
    role: "Instant Channel Alerts & Approvals",
    icon: MessageSquare,
    iconBg: "bg-indigo-600 text-white",
    handle: "{{ alert.channel }}",
  },
  {
    name: "Liveblocks CRDT",
    category: "Outreach & CRMs",
    role: "Sub-30ms Multiplayer State Engine",
    icon: Share2,
    iconBg: "bg-pink-600 text-white",
    handle: "liveblocks.room",
  },
]

export function IntegrationsHub() {
  const [activeCategory, setActiveCategory] = React.useState<string>("All")

  const categories = [
    "All",
    "Triggers & Ingestion",
    "AI & Cloud Browsers",
    "Execution Sandboxes",
    "Outreach & CRMs",
  ]

  const filtered =
    activeCategory === "All"
      ? INTEGRATIONS
      : INTEGRATIONS.filter((i) => i.category === activeCategory)

  return (
    <div className="w-full">
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground mb-4 shadow-xs">
          <Share2 className="size-3.5 text-blue-500" />
          <span>Unified Ecosystem</span>
        </div>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
          Connects Seamlessly into Your Existing Stack
        </h2>
        <p className="mt-3 text-sm sm:text-base text-muted-foreground leading-relaxed">
          Nodus does not replace your tools — it bridges them visually into autonomous pipelines.
          Trigger runs from any webhook, delegate visual tasks to cloud browsers, and dispatch results anywhere.
        </p>

        {/* Category Pill Filters */}
        <div className="mt-7 flex flex-wrap items-center justify-center gap-1.5 select-none">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "px-3 py-1 text-xs font-medium rounded-full border transition-all cursor-pointer shadow-2xs",
                activeCategory === cat
                  ? "bg-primary text-primary-foreground border-primary font-semibold"
                  : "bg-card hover:bg-muted text-muted-foreground hover:text-foreground border-border/80"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Studio Connected Integration Nodes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {filtered.map((item, idx) => {
          const Icon = item.icon
          return (
            <div
              key={idx}
              className="relative rounded-xl border border-border/80 bg-card p-4 shadow-xs transition-all duration-200 hover:border-primary/50 hover:shadow-md dark:bg-[#141417] flex flex-col justify-between group select-none"
            >
              {/* Node Handle Notches */}
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  top: "50%",
                  transform: "translate(-100%, -50%)",
                }}
                className="w-1.5 h-3 rounded-l-xs bg-border group-hover:bg-blue-500 transition-colors"
              />
              <div
                style={{
                  position: "absolute",
                  right: 0,
                  top: "50%",
                  transform: "translate(100%, -50%)",
                }}
                className="w-1.5 h-3 rounded-r-xs bg-border group-hover:bg-blue-500 transition-colors"
              />

              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-lg shadow-xs transition-transform group-hover:scale-105",
                    item.iconBg
                  )}
                >
                  <Icon className="size-4.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-foreground truncate">
                      {item.name}
                    </span>
                    <span className="text-[10px] font-mono text-muted-foreground/80">
                      Integrated
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                    {item.role}
                  </p>
                </div>
              </div>

              {/* Token Handle Row */}
              <div className="mt-3 pt-2.5 border-t border-border/60 flex items-center justify-between text-[11px] font-mono">
                <span className="text-muted-foreground text-[10px]">Token Reference</span>
                <span className="px-1.5 py-0.2 rounded bg-muted/60 text-foreground border border-border/50 text-[10px]">
                  {item.handle}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
