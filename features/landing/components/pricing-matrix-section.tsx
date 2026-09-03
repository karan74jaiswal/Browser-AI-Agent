"use client"

import * as React from "react"
import Link from "next/link"
import { motion } from "motion/react"
import {
  ArrowRight,
  Bot,
  Check,
  CheckCircle2,
  Cpu,
  CreditCard,
  FileText,
  Globe,
  Lock,
  Mail,
  MousePointerClick,
  Shield,
  Sparkles,
  Users,
  Workflow,
  Zap,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface NodeCapability {
  name: string
  icon: React.ComponentType<{ className?: string }>
  iconBg: string
  isPro?: boolean
}

interface PricingTier {
  id: string
  name: string
  badge?: string
  subtitle: string
  description: string
  monthlyPrice: number
  annualPrice: number
  popular?: boolean
  icon: React.ComponentType<{ className?: string }>
  iconBg: string
  handleColor: string
  accentBorder: string
  buttonText: string
  buttonHref: string
  buttonVariant: "default" | "outline"
  unlockedNodes: NodeCapability[]
  specifications: { label: string; value: string }[]
  outputToken: string
}

const PRICING_TIERS: PricingTier[] = [
  {
    id: "free",
    name: "Free Hobbyist",
    subtitle: "Canvas Exploration & Prototypes",
    description: "Ideal for solo builders experimenting with visual workflows and basic automation.",
    monthlyPrice: 0,
    annualPrice: 0,
    icon: MousePointerClick,
    iconBg: "bg-[#2563eb] text-white",
    handleColor: "bg-blue-500",
    accentBorder: "border-border/80 hover:border-blue-500/40",
    buttonText: "Start Building Free",
    buttonHref: "/sign-up",
    buttonVariant: "outline",
    unlockedNodes: [
      { name: "Start", icon: MousePointerClick, iconBg: "bg-[#2563eb]" },
      { name: "Open URL", icon: Globe, iconBg: "bg-[#10b981]" },
      { name: "Act", icon: Zap, iconBg: "bg-[#8b5cf6]" },
      { name: "Send Email", icon: Mail, iconBg: "bg-[#f97316]" },
    ],
    specifications: [
      { label: "Active Workflows", value: "Up to 3 pipelines" },
      { label: "Monthly Task Runs", value: "100 runs / month" },
      { label: "Multiplayer Canvas", value: "Single User" },
      { label: "Run History", value: "7-day log retention" },
      { label: "Execution Engine", value: "Trigger.dev Community" },
    ],
    outputToken: "{{ Plan · tier: 'hobbyist' }}",
  },
  {
    id: "pro",
    name: "Pro Builder",
    badge: "Most Popular",
    subtitle: "Autonomous AI Agents & Teams",
    description: "For engineering teams scaling browser agents, live multiplayer, and secure vaults.",
    monthlyPrice: 29,
    annualPrice: 23,
    popular: true,
    icon: Bot,
    iconBg: "bg-[#ec4899] text-white",
    handleColor: "bg-pink-500",
    accentBorder: "border-pink-500/60 shadow-xl shadow-pink-500/5 ring-1 ring-pink-500/20",
    buttonText: "Launch Pro Studio",
    buttonHref: "/pricing",
    buttonVariant: "default",
    unlockedNodes: [
      { name: "Stagehand Agent", icon: Bot, iconBg: "bg-[#ec4899]", isPro: true },
      { name: "Extract (Vision)", icon: FileText, iconBg: "bg-[#f59e0b]", isPro: true },
      { name: "Stripe Trigger", icon: CreditCard, iconBg: "bg-[#635BFF]", isPro: true },
      { name: "E2B Code Sandbox", icon: Cpu, iconBg: "bg-amber-600", isPro: true },
    ],
    specifications: [
      { label: "Active Workflows", value: "Up to 20 pipelines" },
      { label: "Monthly Task Runs", value: "5,000 runs / month" },
      { label: "Multiplayer Seats", value: "4 seats (Liveblocks CRDT)" },
      { label: "Credential Vault", value: "AES-256 Multi-Tenant" },
      { label: "Session Observability", value: "30-day HLS replays" },
    ],
    outputToken: "{{ Plan · tier: 'pro_agent_team' }}",
  },
  {
    id: "enterprise",
    name: "Enterprise Scale",
    badge: "Custom Scale",
    subtitle: "High Concurrency & Custom SLAs",
    description: "For organizations requiring dedicated worker pools, custom sandboxes, and SSO/SAML.",
    monthlyPrice: 199,
    annualPrice: 159,
    icon: Shield,
    iconBg: "bg-[#10b981] text-white",
    handleColor: "bg-emerald-500",
    accentBorder: "border-border/80 hover:border-emerald-500/40",
    buttonText: "Contact Enterprise Sales",
    buttonHref: "mailto:sales@nodus.dev",
    buttonVariant: "outline",
    unlockedNodes: [
      { name: "All Studio Nodes", icon: Workflow, iconBg: "bg-indigo-600", isPro: true },
      { name: "Dedicated Browser Pools", icon: Globe, iconBg: "bg-emerald-600", isPro: true },
      { name: "Custom E2B Templates", icon: Cpu, iconBg: "bg-amber-600", isPro: true },
      { name: "Hardware Security Vault", icon: Lock, iconBg: "bg-blue-600", isPro: true },
    ],
    specifications: [
      { label: "Active Workflows", value: "Unlimited pipelines" },
      { label: "Monthly Task Runs", value: "Custom high concurrency" },
      { label: "Multiplayer Seats", value: "Unlimited seats + SSO" },
      { label: "Worker Clusters", value: "Dedicated Trigger.dev" },
      { label: "Service Agreement", value: "99.99% Uptime SLA" },
    ],
    outputToken: "{{ Plan · tier: 'enterprise_hsm' }}",
  },
]

export function PricingMatrixSection() {
  const [billingInterval, setBillingInterval] = React.useState<"monthly" | "annual">("annual")

  return (
    <section id="pricing" className="w-full border-t border-border/80 bg-muted/20 py-16 sm:py-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        {/* Section Header styled like a Canvas Studio component */}
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground mb-4 shadow-xs">
            <CreditCard className="size-3.5 text-blue-500" />
            <span>Studio Plan Nodes</span>
          </div>

          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-foreground leading-[1.15]">
            Transparent Plans for Every Workflow Scale
          </h2>
          <p className="mt-3 text-sm sm:text-base text-muted-foreground leading-relaxed">
            Start completely free. Upgrade to unlock autonomous Stagehand AI web agents, real-time
            Liveblocks multiplayer, and the AES-256 multi-tenant Credential Vault.
          </p>

          {/* Billing Frequency Toggle Pill (Studio Style) */}
          <div className="mt-8 flex items-center justify-center select-none">
            <div className="relative flex items-center rounded-full border border-border bg-card p-1 shadow-xs">
              <button
                type="button"
                onClick={() => setBillingInterval("monthly")}
                className={cn(
                  "relative z-10 rounded-full px-4 py-1.5 text-xs font-medium transition-colors cursor-pointer",
                  billingInterval === "monthly"
                    ? "text-foreground font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {billingInterval === "monthly" && (
                  <motion.div
                    layoutId="pricing-pill"
                    className="absolute inset-0 rounded-full bg-muted shadow-xs"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10">Monthly</span>
              </button>

              <button
                type="button"
                onClick={() => setBillingInterval("annual")}
                className={cn(
                  "relative z-10 flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-medium transition-colors cursor-pointer",
                  billingInterval === "annual"
                    ? "text-foreground font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {billingInterval === "annual" && (
                  <motion.div
                    layoutId="pricing-pill"
                    className="absolute inset-0 rounded-full bg-muted shadow-xs"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10">Annual</span>
                <span className="relative z-10 text-[9px] font-bold font-mono px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  Save 20%
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* 3-Tier Canvas Plan Nodes */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch relative">
          {PRICING_TIERS.map((tier) => {
            const price = billingInterval === "annual" ? tier.annualPrice : tier.monthlyPrice
            const Icon = tier.icon

            return (
              <div
                key={tier.id}
                className={cn(
                  "relative rounded-2xl border bg-card p-6 sm:p-7 shadow-lg flex flex-col justify-between transition-all duration-300 dark:bg-[#141417] select-none",
                  tier.accentBorder,
                  tier.popular && "lg:-translate-y-2 z-10"
                )}
              >
                {/* Left Target Handle Notch */}
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    top: "52px",
                    transform: "translate(-100%, -50%)",
                  }}
                  className={cn("hidden lg:block w-2 h-4 rounded-l-xs shadow-xs", tier.handleColor)}
                />

                {/* Right Source Handle Notch */}
                <div
                  style={{
                    position: "absolute",
                    right: 0,
                    top: "52px",
                    transform: "translate(100%, -50%)",
                  }}
                  className={cn("hidden lg:block w-2 h-4 rounded-r-xs shadow-xs", tier.handleColor)}
                />

                {/* Floating Badge (Popular / Recommended) */}
                {tier.badge && (
                  <div className="absolute -top-3 left-6 z-20">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-3 py-0.5 text-[11px] font-semibold text-white shadow-md",
                        tier.popular ? "bg-pink-600" : "bg-emerald-600"
                      )}
                    >
                      <Sparkles className="size-3" />
                      <span>{tier.badge}</span>
                    </span>
                  </div>
                )}

                <div>
                  {/* Node Header */}
                  <div className="flex items-center justify-between pb-4 border-b border-border/80">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "flex size-10 shrink-0 items-center justify-center rounded-lg shadow-xs",
                          tier.iconBg
                        )}
                      >
                        <Icon className="size-5" />
                      </div>
                      <div>
                        <div className="text-base font-bold text-foreground">{tier.name}</div>
                        <div className="text-xs text-muted-foreground">{tier.subtitle}</div>
                      </div>
                    </div>
                  </div>

                  {/* Price Row */}
                  <div className="py-5 flex items-baseline gap-1.5 border-b border-border/80">
                    <span className="text-4xl sm:text-5xl font-extrabold font-mono tracking-tight text-foreground">
                      ${price}
                    </span>
                    <span className="text-xs text-muted-foreground font-mono">
                      {tier.monthlyPrice > 0
                        ? `/ month ${billingInterval === "annual" ? "(billed annually)" : ""}`
                        : "forever free"}
                    </span>
                  </div>

                  {/* Unlocked Node Badges (App Primitives) */}
                  <div className="pt-4 pb-3">
                    <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-muted-foreground block mb-2.5">
                      Unlocked Studio Nodes
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      {tier.unlockedNodes.map((node, i) => {
                        const NodeIcon = node.icon
                        return (
                          <div
                            key={i}
                            className="flex items-center gap-2 p-1.5 rounded-md border border-border/70 bg-muted/30 text-xs text-foreground dark:bg-[#1c1c1f]"
                          >
                            <div
                              className={cn(
                                "size-5 rounded flex items-center justify-center text-white shrink-0 shadow-2xs",
                                node.iconBg
                              )}
                            >
                              <NodeIcon className="size-3" />
                            </div>
                            <span className="text-[11px] font-medium truncate">{node.name}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Parameter Specification Rows (Matching Canvas Inspector) */}
                  <div className="mt-3 p-3 rounded-lg border border-border/80 bg-muted/20 text-xs font-mono space-y-2 dark:bg-[#1a1a1d]">
                    {tier.specifications.map((spec, i) => (
                      <div key={i} className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground text-[11px]">{spec.label}:</span>
                        <span className="text-foreground dark:text-zinc-200 text-[11px] font-semibold truncate text-right">
                          {spec.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Card CTA & Output Token Footer */}
                <div className="mt-6 pt-4 border-t border-border/80 space-y-3">
                  <Button
                    asChild
                    variant={tier.buttonVariant}
                    size="lg"
                    className={cn(
                      "w-full h-10 text-xs font-semibold gap-1.5 cursor-pointer shadow-xs",
                      tier.popular
                        ? "bg-primary text-primary-foreground hover:bg-primary/90"
                        : "hover:bg-muted"
                    )}
                  >
                    <Link href={tier.buttonHref}>
                      <span>{tier.buttonText}</span>
                      <ArrowRight className="size-3.5" />
                    </Link>
                  </Button>

                  <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground">
                    <span>Plan Token</span>
                    <span className="px-1.5 py-0.5 rounded bg-muted text-foreground border border-border/60 truncate max-w-[200px]">
                      {tier.outputToken}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
