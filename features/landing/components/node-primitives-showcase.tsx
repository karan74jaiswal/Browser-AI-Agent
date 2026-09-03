"use client"

import * as React from "react"
import {
  Bot,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  CreditCard,
  Eye,
  FileText,
  Globe,
  Mail,
  MousePointerClick,
  Sparkles,
  Terminal,
  Zap,
} from "lucide-react"
import { motion, AnimatePresence } from "motion/react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export interface PrimitiveNodeInfo {
  id: string
  title: string
  category: "Triggers" | "Browser AI" | "Backend & Code"
  kind: "trigger" | "action"
  icon: React.ComponentType<{ className?: string }>
  iconBg: string
  description: string
  runtime: "Stagehand v4" | "Browserbase" | "Trigger.dev Worker" | "Credential Vault"
  fields: { label: string; key: string; value: string; isToken?: boolean; isSecret?: boolean }[]
  outputs: { path: string; label: string; sample: string }[]
  badge?: string
}

const PRIMITIVE_NODES: PrimitiveNodeInfo[] = [
  {
    id: "agent",
    title: "Agent",
    category: "Browser AI",
    kind: "action",
    icon: Bot,
    iconBg: "bg-[#ec4899] text-white",
    badge: "Stagehand v4",
    description:
      "Autonomous AI browser agent. Solves multi-step visual interactions, bypasses dynamic DOM structures, and plans actions with natural language.",
    runtime: "Stagehand v4",
    fields: [
      {
        label: "Instruction",
        key: "instruction",
        value: "Navigate to lead profile, research their tech stack & craft personalized pitch",
      },
      {
        label: "Max Steps",
        key: "maxSteps",
        value: "15 steps (Smart Termination)",
      },
      {
        label: "Model",
        key: "model",
        value: "openai/gpt-5.4-mini",
      },
    ],
    outputs: [
      { path: "summary", label: "Summary", sample: "Found 4 pain points on landing page..." },
      { path: "actionLog", label: "Action Log", sample: "12 DOM actions executed successfully" },
    ],
  },
  {
    id: "extract",
    title: "Extract",
    category: "Browser AI",
    kind: "action",
    icon: FileText,
    iconBg: "bg-[#f59e0b] text-white",
    badge: "Zero-Shot Vision",
    description:
      "Extract structured data from any page using natural language instructions and Zod schemas without fragile CSS or XPath selectors.",
    runtime: "Stagehand v4",
    fields: [
      {
        label: "Instruction",
        key: "instruction",
        value: "Extract verified email, company revenue, founder name, and pricing tiers",
      },
      {
        label: "Schema Target",
        key: "schema",
        value: "{ email: z.string().email(), companySize: z.number() }",
      },
    ],
    outputs: [
      { path: "email", label: "Email", sample: "alex.turner@saasgrowth.io" },
      { path: "companySize", label: "Company Size", sample: "45 employees" },
    ],
  },
  {
    id: "act",
    title: "Act",
    category: "Browser AI",
    kind: "action",
    icon: Zap,
    iconBg: "bg-[#8b5cf6] text-white",
    badge: "Atomic Action",
    description:
      "Deterministic, AI-guided single actions (click, type, select, hover). Uses local secret substitution so credentials never leak to LLMs.",
    runtime: "Browserbase",
    fields: [
      {
        label: "Instruction",
        key: "instruction",
        value: "Click the 'Export CSV' button in the analytics navigation bar",
      },
      {
        label: "Variables",
        key: "variables",
        value: "{{ secrets.ORGANIZATION_AUTH_TOKEN }}",
        isSecret: true,
      },
    ],
    outputs: [
      { path: "success", label: "Success", sample: "true" },
      { path: "url", label: "URL", sample: "https://app.saasgrowth.io/dashboard" },
    ],
  },
  {
    id: "stripe-trigger",
    title: "Stripe",
    category: "Triggers",
    kind: "trigger",
    icon: CreditCard,
    iconBg: "bg-[#635BFF] text-white",
    badge: "Webhooks",
    description:
      "Instant event listener for Stripe transactions. Trigger workflows on successful payments, subscription creations, or failed churn events.",
    runtime: "Trigger.dev Worker",
    fields: [
      {
        label: "Event Type",
        key: "eventType",
        value: "customer.subscription.created",
      },
      {
        label: "Signing Secret",
        key: "secret",
        value: "{{ secrets.STRIPE_WEBHOOK_SECRET }}",
        isSecret: true,
      },
    ],
    outputs: [
      { path: "customerId", label: "Customer ID", sample: "cus_R8qL39vP0" },
      { path: "amount", label: "Amount", sample: "$249.00 / month" },
      { path: "customerEmail", label: "Customer Email", sample: "billing@acme.corp" },
    ],
  },
  {
    id: "send-email",
    title: "Send Email",
    category: "Backend & Code",
    kind: "action",
    icon: Mail,
    iconBg: "bg-[#f97316] text-white",
    badge: "Resend Verified",
    description:
      "Multi-tenant transactional and cold outbound email dispatcher. Supports dynamic templating tokens and encrypted SMTP credentials.",
    runtime: "Trigger.dev Worker",
    fields: [
      {
        label: "To",
        key: "to",
        value: "{{ Extract · email }}",
        isToken: true,
      },
      {
        label: "Subject",
        key: "subject",
        value: "Scale {{ Extract · company }} revenue 3x with AI agents",
        isToken: true,
      },
      {
        label: "API Key",
        key: "apiKey",
        value: "{{ secrets.RESEND_API_KEY }}",
        isSecret: true,
      },
    ],
    outputs: [
      { path: "messageId", label: "Message ID", sample: "msg_90a721b6" },
      { path: "status", label: "Status", sample: "delivered (200 OK)" },
    ],
  },
  {
    id: "open-url",
    title: "Open URL",
    category: "Browser AI",
    kind: "action",
    icon: Globe,
    iconBg: "bg-[#10b981] text-white",
    badge: "Stealth Browser",
    description:
      "Spawns an isolated cloud browser session on Browserbase with anti-bot fingerprint masking, proxy rotation, and session recording.",
    runtime: "Browserbase",
    fields: [
      {
        label: "Target URL",
        key: "url",
        value: "https://linkedin.com/search/leads?q=founder",
      },
      {
        label: "Session Type",
        key: "session",
        value: "Residential Cloud Proxy · US West",
      },
    ],
    outputs: [
      { path: "pageTitle", label: "Page Title", sample: "Search | LinkedIn Sales Navigator" },
      { path: "sessionId", label: "Session ID", sample: "bb_sess_81f09c2a" },
    ],
  },
]

export function NodePrimitivesShowcase() {
  const [selectedNodeId, setSelectedNodeId] = React.useState<string>("agent")
  const activeNode = PRIMITIVE_NODES.find((n) => n.id === selectedNodeId) ?? PRIMITIVE_NODES[0]

  return (
    <div className="w-full">
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground mb-4 shadow-xs">
          <Sparkles className="size-3.5 text-blue-500" />
          <span>Composable Atomic Architecture</span>
        </div>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
          Built with Pure Nodes, Edges &amp; Secure Secrets
        </h2>
        <p className="mt-3 text-sm sm:text-base text-muted-foreground leading-relaxed">
          Every capability in Nodus is a first-class DAG node. Mix visual Stagehand AI actions,
          event-driven triggers, and cloud sandboxes into resilient multi-tenant pipelines.
        </p>
      </div>

      {/* Interactive Two-Column Showcase */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Node Palette Navigation */}
        <div className="lg:col-span-5 flex flex-col gap-2.5">
          <span className="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider px-1">
            Explore Studio Primitives
          </span>

          <div className="flex flex-col gap-2">
            {PRIMITIVE_NODES.map((node) => {
              const isSelected = selectedNodeId === node.id
              const Icon = node.icon

              return (
                <button
                  key={node.id}
                  type="button"
                  onClick={() => setSelectedNodeId(node.id)}
                  className={cn(
                    "flex items-center justify-between p-3.5 rounded-xl border text-left transition-all cursor-pointer group select-none",
                    isSelected
                      ? "bg-card border-blue-500 shadow-md ring-1 ring-blue-500/20 dark:bg-[#161618]"
                      : "bg-card/60 hover:bg-card border-border/80 hover:border-border text-muted-foreground hover:text-foreground"
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={cn(
                        "flex size-9 shrink-0 items-center justify-center rounded-lg shadow-xs transition-transform group-hover:scale-105",
                        node.iconBg
                      )}
                    >
                      <Icon className="size-4.5" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "text-sm font-semibold truncate",
                            isSelected ? "text-foreground" : "text-foreground/80"
                          )}
                        >
                          {node.title}
                        </span>
                        {node.badge && (
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-muted text-muted-foreground border border-border/60">
                            {node.badge}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground line-clamp-1">
                        {node.description}
                      </span>
                    </div>
                  </div>

                  <ChevronRight
                    className={cn(
                      "size-4 shrink-0 transition-transform",
                      isSelected
                        ? "text-blue-500 translate-x-0.5"
                        : "text-muted-foreground/50 group-hover:translate-x-0.5"
                    )}
                  />
                </button>
              )
            })}
          </div>
        </div>

        {/* Right Column: Live Node Inspector Canvas Preview */}
        <div className="lg:col-span-7">
          <div className="relative rounded-2xl border border-border bg-card shadow-xl overflow-hidden flex flex-col dark:bg-[#111113]">
            {/* Canvas dot grid header */}
            <div className="h-10 border-b border-border px-4 flex items-center justify-between bg-muted/40 text-xs font-mono text-muted-foreground select-none">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-blue-500 animate-pulse" />
                <span className="font-semibold text-foreground">Node Inspector</span>
                <span>· {activeNode.runtime}</span>
              </div>
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
                {activeNode.kind}
              </span>
            </div>

            {/* Canvas Body */}
            <div
              className="p-6 sm:p-8 relative overflow-hidden"
              style={{
                backgroundImage:
                  "radial-gradient(hsl(var(--foreground) / 0.12) 1px, transparent 1px)",
                backgroundSize: "20px 20px",
              }}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeNode.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6 relative z-10"
                >
                  {/* The Physical Canvas Node Component */}
                  <div className="relative max-w-md mx-auto rounded-xl border border-border bg-card shadow-lg dark:bg-[#1c1c1e] p-4 select-none">
                    {/* Left Handle Notch */}
                    {activeNode.kind !== "trigger" && (
                      <div
                        style={{
                          position: "absolute",
                          left: 0,
                          top: "50%",
                          transform: "translate(-100%, -50%)",
                        }}
                        className="w-2 h-4 rounded-l-xs bg-blue-500 z-20 shadow-xs"
                      />
                    )}

                    {/* Right Handle Notch */}
                    <div
                      style={{
                        position: "absolute",
                        right: 0,
                        top: "50%",
                        transform: "translate(100%, -50%)",
                      }}
                      className="w-2 h-4 rounded-r-xs bg-blue-500 z-20 shadow-xs"
                    />

                    {/* Node Header */}
                    <div className="flex items-center gap-3 pb-3 border-b border-border/80">
                      <div
                        className={cn(
                          "flex size-8 shrink-0 items-center justify-center rounded-lg shadow-xs",
                          activeNode.iconBg
                        )}
                      >
                        <activeNode.icon className="size-4.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-foreground">
                            {activeNode.title}
                          </span>
                          <span className="text-[10px] font-mono text-muted-foreground uppercase">
                            {activeNode.kind}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground truncate block">
                          {activeNode.runtime}
                        </span>
                      </div>
                    </div>

                    {/* Configurable Input Fields */}
                    <div className="pt-3 space-y-2.5">
                      {activeNode.fields.map((f, i) => (
                        <div key={i} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground font-medium text-[11px]">
                              {f.label}
                            </span>
                            {f.isSecret && (
                              <span className="text-[10px] font-mono text-amber-500 flex items-center gap-1">
                                <span>Encrypted Vault Token</span>
                              </span>
                            )}
                            {f.isToken && (
                              <span className="text-[10px] font-mono text-blue-500">
                                Dynamic Token
                              </span>
                            )}
                          </div>

                          <div
                            className={cn(
                              "w-full text-xs font-mono rounded px-2.5 py-1.5 border break-all transition-colors",
                              f.isSecret
                                ? "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400 font-medium"
                                : f.isToken
                                  ? "bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400 font-medium"
                                  : "bg-muted/40 border-border/80 text-foreground"
                            )}
                          >
                            {f.value}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Output Variables Bar */}
                    <div className="mt-3 pt-3 border-t border-border/80">
                      <span className="text-[10px] uppercase font-mono font-medium text-muted-foreground block mb-1.5">
                        Exposed Downstream Outputs
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {activeNode.outputs.map((out, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-muted text-foreground border border-border/60"
                          >
                            <span className="size-1 rounded-full bg-emerald-500" />
                            <span>{`{{ ${activeNode.title} · ${out.path} }}`}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Real-time Execution Output Terminal */}
                  <div className="rounded-xl border border-border bg-card p-4 text-xs font-mono space-y-2 dark:bg-[#141416]">
                    <div className="flex items-center justify-between text-muted-foreground pb-2 border-b border-border/80">
                      <div className="flex items-center gap-2 text-foreground font-medium">
                        <Terminal className="size-3.5 text-blue-500" />
                        <span>Execution Step Output Sample</span>
                      </div>
                      <span className="text-[11px] text-emerald-500 flex items-center gap-1">
                        <CheckCircle2 className="size-3" />
                        <span>Resolved in 420ms</span>
                      </span>
                    </div>

                    <div className="space-y-1.5 pt-1 text-muted-foreground">
                      {activeNode.outputs.map((out, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <span className="text-blue-400 shrink-0">{out.path}:</span>
                          <span className="text-foreground dark:text-zinc-300 break-all">
                            &quot;{out.sample}&quot;
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
