import type { Metadata } from "next"
import Link from "next/link"
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  LayoutTemplate,
  MousePointerClick,
  Sparkles,
  Users,
  Workflow,
  Zap,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { PublicNavbar } from "@/components/public-navbar"
import { NodusLogo } from "@/components/nodus-logo"
import { AmbientSpotlight } from "@/components/ambient-spotlight"
import { WorkflowSimulator } from "@/features/landing/components/workflow-simulator"
import { StudioTelemetryStrip } from "@/features/landing/components/studio-telemetry-strip"
import { HowItWorksPipeline } from "@/features/landing/components/how-it-works-pipeline"
import { NodePrimitivesShowcase } from "@/features/landing/components/node-primitives-showcase"
import { NaturalLanguagePlayground } from "@/features/landing/components/natural-language-playground"
import { ObservabilityReplayShowcase } from "@/features/landing/components/observability-replay-showcase"
import { MultiplayerCollaborationShowcase } from "@/features/landing/components/multiplayer-collaboration-showcase"
import { IntegrationsHub } from "@/features/landing/components/integrations-hub"
import { PipelineTemplatesShowcase } from "@/features/landing/components/pipeline-templates-showcase"
import { PricingMatrixSection } from "@/features/landing/components/pricing-matrix-section"
import { CanvasFaq } from "@/features/landing/components/canvas-faq"

export const metadata: Metadata = {
  title: "Nodus — Visual Workflow & AI Agent Platform",
  description:
    "Compose resilient DAG pipelines with autonomous Stagehand AI web agents, distributed Trigger.dev background workers, and real-time Liveblocks multiplayer canvas.",
  openGraph: {
    title: "Nodus — Visual Workflow & AI Agent Platform",
    description:
      "Automate complex browser and backend workflows visually with Stagehand AI agents, Trigger.dev, and collaborative multiplayer canvas.",
    type: "website",
  },
}

export default function LandingPage() {
  return (
    <div className="flex min-h-screen w-full flex-col bg-background text-foreground selection:bg-primary/20 relative">
      {/* Interactive Canvas Mouse-Following Ambient Spotlight */}
      <AmbientSpotlight />

      {/* Top Navigation Bar with Integrated Theme Toggle & Multiplayer Indicator */}
      <PublicNavbar />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col items-center">
        {/* ================================================================= */}
        {/* 1. HERO HEADER                                                    */}
        {/* ================================================================= */}
        <section className="relative w-full overflow-hidden pt-8 pb-4 sm:pt-12 sm:pb-6 md:pt-16 md:pb-8">
          {/* Theme-Adaptive Ambient Radial Glow */}
          <div className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center overflow-hidden">
            <div className="h-[400px] w-[700px] sm:h-[500px] sm:w-[900px] rounded-full bg-gradient-to-tr from-primary/15 via-indigo-500/10 to-sky-500/10 blur-[130px] opacity-75 dark:opacity-40" />
          </div>

          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl flex flex-col items-center text-center">
            {/* Announcement Pill */}
            <div className="mb-4">
              <Link href="/templates">
                <Badge
                  variant="outline"
                  className="group inline-flex items-center gap-2 rounded-full border-border/80 bg-background/80 px-3.5 py-1 text-xs font-medium text-foreground backdrop-blur-md transition-all hover:border-primary/40 hover:bg-muted/60 cursor-pointer shadow-xs"
                >
                  <span className="flex size-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Nodus Studio · Visual AI Agents &amp; Real-Time Multiplayer</span>
                  <ArrowRight className="size-3 text-muted-foreground transition-transform group-hover:translate-x-1" />
                </Badge>
              </Link>
            </div>

            {/* Headline */}
            <h1 className="max-w-4xl text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-[1.12]">
              Automate Complex Web &amp; Backend Workflows{" "}
              <span className="bg-gradient-to-r from-primary via-indigo-400 to-sky-400 bg-clip-text text-transparent">
                Visually.
              </span>
            </h1>

            {/* Subheadline */}
            <p className="mt-3.5 max-w-2xl text-sm sm:text-base md:text-lg text-muted-foreground font-normal leading-relaxed">
              Compose resilient DAG pipelines with autonomous Stagehand browser agents,
              distributed Trigger.dev workers, and Liveblocks collaborative canvas.
            </p>

            {/* Quick CTAs */}
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3 w-full sm:w-auto">
              <Button
                asChild
                size="lg"
                className="h-10 px-6 text-xs sm:text-sm font-semibold gap-2 shadow-md w-full sm:w-auto cursor-pointer"
              >
                <Link href="/workflows">
                  <Workflow className="size-4" />
                  <span>Open Studio Canvas</span>
                  <ArrowRight className="size-4" />
                </Link>
              </Button>

              <Button
                asChild
                variant="outline"
                size="lg"
                className="h-10 px-5 text-xs sm:text-sm font-medium gap-2 w-full sm:w-auto hover:bg-muted/80"
              >
                <Link href="/templates">
                  <LayoutTemplate className="size-4 text-muted-foreground" />
                  <span>Browse 20+ Blueprints</span>
                </Link>
              </Button>
            </div>

            {/* Capability Badges */}
            <div className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5 font-medium">
                <Bot className="size-3.5 text-pink-500" />
                Stagehand AI Web Agents
              </span>
              <span className="hidden sm:inline text-border">•</span>
              <span className="flex items-center gap-1.5 font-medium">
                <Users className="size-3.5 text-emerald-500" />
                Liveblocks CRDT Multiplayer
              </span>
              <span className="hidden sm:inline text-border">•</span>
              <span className="flex items-center gap-1.5 font-medium">
                <Zap className="size-3.5 text-blue-500" />
                Trigger.dev Background DAGs
              </span>
            </div>
          </div>
        </section>

        {/* ================================================================= */}
        {/* 2. LIVE STUDIO TELEMETRY & BENCHMARK STRIP                        */}
        {/* ================================================================= */}
        <section className="w-full px-4 sm:px-6 lg:px-8 max-w-6xl pb-8 sm:pb-12">
          <StudioTelemetryStrip />
        </section>

        {/* ================================================================= */}
        {/* 3. LIVE STUDIO SIMULATOR CENTERPIECE                              */}
        {/* ================================================================= */}
        <section className="w-full px-4 sm:px-6 lg:px-8 max-w-7xl pb-16 sm:pb-24">
          <div className="relative">
            {/* Interactive hint banner */}
            <div className="mb-3 flex items-center justify-between px-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-emerald-500 animate-ping" />
                <span className="font-mono text-[11px] text-foreground font-medium">
                  Live Studio Session · Priya Sharma, Rohan Mehta, Aditya Patel &amp; Neha Reddy active
                </span>
              </div>
              <div className="hidden sm:flex items-center gap-2 font-mono text-[11px] text-muted-foreground">
                <span>Real-time conflict resolution &middot; Live typing &middot; Dynamic wires</span>
              </div>
            </div>

            {/* The Live Interactive Simulator */}
            <WorkflowSimulator />
          </div>
        </section>

        {/* ================================================================= */}
        {/* 4. HOW IT WORKS: 3 CONNECTED DAG NODES                            */}
        {/* ================================================================= */}
        <section className="w-full border-t border-border/80 bg-muted/20 py-16 sm:py-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
            <HowItWorksPipeline />
          </div>
        </section>

        {/* ================================================================= */}
        {/* 5. ATOMIC PRIMITIVES: INTERACTIVE NODE PALETTE & INSPECTOR       */}
        {/* ================================================================= */}
        <section id="features" className="w-full border-t border-border/80 py-16 sm:py-24 bg-background scroll-mt-14">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
            <NodePrimitivesShowcase />
          </div>
        </section>

        {/* ================================================================= */}
        {/* 6. NATURAL LANGUAGE PLAYGROUND: ENGLISH TO STAGEHAND CODE         */}
        {/* ================================================================= */}
        <section id="sandboxes" className="w-full border-t border-border/80 bg-muted/20 py-16 sm:py-24 scroll-mt-14">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
            <NaturalLanguagePlayground />
          </div>
        </section>

        {/* ================================================================= */}
        {/* 7. OBSERVABILITY & LIVE REPLAY: BROWSERBASE + STAGEHAND          */}
        {/* ================================================================= */}
        <section className="w-full border-t border-border/80 py-16 sm:py-24 bg-background">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
            <ObservabilityReplayShowcase />
          </div>
        </section>

        {/* ================================================================= */}
        {/* 8. MULTIPLAYER CO-AUTHORING: LIVEBLOCKS CRDT CANVAS               */}
        {/* ================================================================= */}
        <section id="multiplayer" className="w-full border-t border-border/80 bg-muted/20 py-16 sm:py-24 scroll-mt-14">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
            <MultiplayerCollaborationShowcase />
          </div>
        </section>

        {/* ================================================================= */}
        {/* 9. INTEGRATIONS NODE HUB: BRIDGES YOUR ENTIRE STACK              */}
        {/* ================================================================= */}
        <section className="w-full border-t border-border/80 py-16 sm:py-24 bg-background">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
            <IntegrationsHub />
          </div>
        </section>

        {/* ================================================================= */}
        {/* 10. PROVEN PRODUCTION BLUEPRINTS: VISUAL DAG CARDS               */}
        {/* ================================================================= */}
        <section className="w-full border-t border-border/80 bg-muted/20 py-16 sm:py-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
            <PipelineTemplatesShowcase />
          </div>
        </section>

        {/* ================================================================= */}
        {/* 11. TRANSPARENT PRICING MATRIX                                    */}
        {/* ================================================================= */}
        <PricingMatrixSection />

        {/* ================================================================= */}
        {/* 12. ARCHITECTURE & SECURITY FAQ                                   */}
        {/* ================================================================= */}
        <section className="w-full border-t border-border/80 py-16 sm:py-24 bg-muted/10">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
            <CanvasFaq />
          </div>
        </section>

        {/* ================================================================= */}
        {/* 13. STUDIO CTA: LAUNCH YOUR CANVAS                                */}
        {/* ================================================================= */}
        <section className="w-full border-t border-border/80 py-16 sm:py-24 bg-gradient-to-b from-transparent via-muted/15 to-muted/30">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl text-center">
            {/* Node Handle Visual Header */}
            <div className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-xs font-mono text-foreground mb-6 shadow-md">
              <div className="flex size-6 items-center justify-center rounded bg-blue-600 text-white shadow-2xs">
                <MousePointerClick className="size-3.5" />
              </div>
              <span className="font-semibold">Start Node</span>
              <span className="text-muted-foreground">&rarr; Connect your first AI agent</span>
            </div>

            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
              Ready to Automate Your High-Impact Workflows?
            </h2>
            <p className="mt-3.5 max-w-xl mx-auto text-sm sm:text-base text-muted-foreground leading-relaxed">
              No complex setup. Spin up autonomous Stagehand browser agents, collaborate with your
              team in real-time, and run durable background pipelines in minutes.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                asChild
                size="lg"
                className="h-11 px-7 text-sm font-semibold gap-2 shadow-md w-full sm:w-auto cursor-pointer"
              >
                <Link href="/sign-up">
                  <Sparkles className="size-4" />
                  <span>Start Free in Studio</span>
                  <ArrowRight className="size-4" />
                </Link>
              </Button>

              <Button
                asChild
                variant="outline"
                size="lg"
                className="h-11 px-6 text-sm font-medium gap-2 w-full sm:w-auto hover:bg-muted/80"
              >
                <Link href="/workflows">
                  <Workflow className="size-4 text-muted-foreground" />
                  <span>Explore Workflows</span>
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-border/80 bg-card/40 py-8 text-center text-xs text-muted-foreground">
        <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 max-w-6xl">
          <div className="flex items-center gap-2.5">
            <NodusLogo size={22} />
            <span className="font-bold text-foreground">Nodus</span>
            <span>· Visual Workflow &amp; AI Agent Platform</span>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/templates" className="hover:text-foreground transition-colors">
              Blueprints
            </Link>
            <Link href="/workflows" className="hover:text-foreground transition-colors">
              Workflows
            </Link>
            <Link href="/pricing" className="hover:text-foreground transition-colors">
              Pricing
            </Link>
            <Link href="/sign-in" className="hover:text-foreground transition-colors">
              Sign In
            </Link>
          </div>

          <div>
            &copy; {new Date().getFullYear()} Nodus Inc. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
