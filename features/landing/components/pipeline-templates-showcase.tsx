"use client"

import * as React from "react"
import Link from "next/link"
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  Clock,
  CreditCard,
  FileText,
  Globe,
  LayoutTemplate,
  Mail,
  MousePointerClick,
  Sparkles,
  Zap,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export interface PipelineTemplate {
  id: string
  title: string
  category: "Growth & Sales" | "Revenue & Churn" | "Market Intel" | "Inbound Ops"
  description: string
  duration: string
  nodesCount: number
  nodes: { title: string; icon: React.ComponentType<{ className?: string }>; bg: string }[]
  accent: string
}

const TEMPLATES: PipelineTemplate[] = [
  {
    id: "omnichannel-customer-acquisition",
    title: "Omnichannel Lead Acquisition & Outreach",
    category: "Growth & Sales",
    description:
      "Scrapes prospective B2B decision makers on LinkedIn/X, extracts pain points with Stagehand AI, crafts 1:1 pitches, and delivers via Resend.",
    duration: "2m 14s",
    nodesCount: 5,
    accent: "border-blue-500/30 hover:border-blue-500",
    nodes: [
      { title: "Start", icon: MousePointerClick, bg: "bg-[#2563eb]" },
      { title: "Open URL", icon: Globe, bg: "bg-[#10b981]" },
      { title: "Extract", icon: FileText, bg: "bg-[#f59e0b]" },
      { title: "AI Agent", icon: Bot, bg: "bg-[#ec4899]" },
      { title: "Send Email", icon: Mail, bg: "bg-[#f97316]" },
    ],
  },
  {
    id: "stripe-churn-recovery",
    title: "Stripe Failed Payment & Churn Recovery",
    category: "Revenue & Churn",
    description:
      "Catches failed billing events from Stripe webhooks, evaluates customer value, notifies the account owner in Slack, and dispatches a card update rescue link.",
    duration: "410ms",
    nodesCount: 4,
    accent: "border-[#635BFF]/30 hover:border-[#635BFF]",
    nodes: [
      { title: "Stripe", icon: CreditCard, bg: "bg-[#635BFF]" },
      { title: "Act", icon: Zap, bg: "bg-[#8b5cf6]" },
      { title: "Extract", icon: FileText, bg: "bg-[#f59e0b]" },
      { title: "Send Email", icon: Mail, bg: "bg-[#f97316]" },
    ],
  },
  {
    id: "competitor-switcher-campaign",
    title: "G2 Competitor Switcher Engine",
    category: "Market Intel",
    description:
      "Monitors negative reviews of competitors on review portals, analyzes dissatisfied customer objections, and crafts hyper-relevant comparative pitches.",
    duration: "1m 45s",
    nodesCount: 4,
    accent: "border-pink-500/30 hover:border-pink-500",
    nodes: [
      { title: "Start", icon: MousePointerClick, bg: "bg-[#2563eb]" },
      { title: "Open URL", icon: Globe, bg: "bg-[#10b981]" },
      { title: "AI Agent", icon: Bot, bg: "bg-[#ec4899]" },
      { title: "Send Email", icon: Mail, bg: "bg-[#f97316]" },
    ],
  },
  {
    id: "autonomous-inbound-qualifier",
    title: "Autonomous Inbound Lead Qualifier",
    category: "Inbound Ops",
    description:
      "Triggers on contact form submission, spins up a Browserbase browser to audit the company website, and enriches CRM deal records automatically.",
    duration: "3.2s",
    nodesCount: 4,
    accent: "border-emerald-500/30 hover:border-emerald-500",
    nodes: [
      { title: "Start", icon: MousePointerClick, bg: "bg-[#2563eb]" },
      { title: "Open URL", icon: Globe, bg: "bg-[#10b981]" },
      { title: "Extract", icon: FileText, bg: "bg-[#f59e0b]" },
      { title: "Send Email", icon: Mail, bg: "bg-[#f97316]" },
    ],
  },
]

export function PipelineTemplatesShowcase() {
  return (
    <div className="w-full">
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground mb-4 shadow-xs">
          <LayoutTemplate className="size-3.5 text-blue-500" />
          <span>Proven Production Blueprints</span>
        </div>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
          Deploy High-Converting Workflows in Seconds
        </h2>
        <p className="mt-3 text-sm sm:text-base text-muted-foreground leading-relaxed">
          Clone pre-engineered DAG blueprints tested by high-growth startups to automate customer
          acquisition, reduce churn, and orchestrate web agents.
        </p>
      </div>

      {/* Grid of Mini DAG Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {TEMPLATES.map((tmpl) => (
          <div
            key={tmpl.id}
            className={cn(
              "group relative rounded-2xl border bg-card p-6 shadow-md transition-all duration-200 flex flex-col justify-between dark:bg-[#131316] select-none",
              tmpl.accent
            )}
          >
            <div>
              {/* Header: Category Badge & Execution Duration */}
              <div className="flex items-center justify-between mb-3 text-xs">
                <Badge variant="outline" className="font-mono text-[10px] bg-background">
                  {tmpl.category}
                </Badge>
                <span className="font-mono text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="size-3.5" />
                  <span>Avg {tmpl.duration}</span>
                </span>
              </div>

              <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                {tmpl.title}
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                {tmpl.description}
              </p>

              {/* Miniature Connected DAG Graph Visual */}
              <div
                className="mt-6 p-4 rounded-xl border border-border/80 bg-muted/20 relative overflow-hidden dark:bg-[#18181c]"
                style={{
                  backgroundImage:
                    "radial-gradient(hsl(var(--foreground) / 0.1) 1px, transparent 1px)",
                  backgroundSize: "16px 16px",
                }}
              >
                <div className="flex items-center justify-between relative z-10 gap-2">
                  {tmpl.nodes.map((n, i) => {
                    const Icon = n.icon
                    return (
                      <React.Fragment key={i}>
                        {/* Node Card */}
                        <div className="flex flex-col items-center gap-1 shrink-0">
                          <div
                            className={cn(
                              "size-9 rounded-lg flex items-center justify-center text-white shadow-md transition-transform group-hover:scale-105",
                              n.bg
                            )}
                          >
                            <Icon className="size-4.5" />
                          </div>
                          <span className="text-[10px] font-mono text-muted-foreground truncate max-w-[64px] text-center">
                            {n.title}
                          </span>
                        </div>

                        {/* Animated Wire Connector between nodes */}
                        {i < tmpl.nodes.length - 1 && (
                          <div className="flex-1 h-0.5 bg-border relative overflow-hidden shrink min-w-3">
                            <div className="absolute inset-0 bg-blue-500/80 animate-pulse" />
                          </div>
                        )}
                      </React.Fragment>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Card Footer: Clone CTA */}
            <div className="mt-6 pt-4 border-t border-border/80 flex items-center justify-between">
              <span className="text-xs font-mono text-muted-foreground">
                {tmpl.nodesCount} Nodes · Multi-Tenant Isolated
              </span>
              <Button
                asChild
                size="sm"
                variant="ghost"
                className="h-8 px-3 text-xs font-semibold gap-1 text-primary hover:text-primary hover:bg-primary/10 cursor-pointer"
              >
                <Link href="/templates">
                  <span>Use Blueprint</span>
                  <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
