"use client"

import * as React from "react"
import {
  ChevronDown,
  HelpCircle,
  Lock,
  ShieldCheck,
  Sparkles,
  Terminal,
} from "lucide-react"
import { motion, AnimatePresence } from "motion/react"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface FAQItem {
  id: string
  question: string
  category: "Security" | "Execution" | "Architecture" | "Multiplayer"
  badge: string
  answer: string
  codeSnippet?: string
}

const FAQS: FAQItem[] = [
  {
    id: "cloudflare-bot",
    category: "Architecture",
    badge: "Browserbase Stealth",
    question: "How do Stagehand v4 browser agents bypass Cloudflare, Datadome & CAPTCHAs?",
    answer:
      "Stagehand runs on Browserbase cloud browsers equipped with advanced anti-bot fingerprint masking, automatic residential IP rotation, and automated CAPTCHA resolution. The browser context mimics genuine human mouse velocity and canvas rendering fingerprints, maintaining a 99.8% pass rate across modern bot protection platforms.",
  },
  {
    id: "vault-security",
    category: "Security",
    badge: "AES-256 GCM",
    question: "Are our organization API keys and passwords ever sent or exposed to the AI model?",
    answer:
      "Never. All third-party credentials (Stripe, Resend, database passwords) are stored in your organization's multi-tenant AES-256-GCM Credential Vault. When you use a token like {{ secrets.STRIPE_SECRET_KEY }}, it is decrypted and interpolated locally on the execution worker just before execution, completely bypassing the LLM prompt context.",
    codeSnippet: `// Local runner token substitution (never sent to model)
const apiKey = values.apiKey.trim() // Decrypted in isolated memory`,
  },
  {
    id: "timeouts-durable",
    category: "Execution",
    badge: "Trigger.dev V3",
    question: "Can our workflows run indefinitely without hitting serverless timeout limits?",
    answer:
      "Yes. Workflows are compiled and dispatched to Trigger.dev distributed background tasks. Unlike standard Next.js or AWS Lambda routes which terminate after 15–60 seconds, Trigger.dev tasks run durably with automatic retries, step checkpointing, and zero timeout limits — allowing agents to perform deep multi-hour research loops.",
  },
  {
    id: "crdt-conflicts",
    category: "Multiplayer",
    badge: "Liveblocks CRDT",
    question: "How does real-time multiplayer prevent merge conflicts when multiple engineers edit?",
    answer:
      "Nodus uses Liveblocks Conflict-Free Replicated Data Types (CRDTs) to model the DAG graph state. Every node position, field edit, and wire connection is an atomic CRDT mutation. If two teammates edit simultaneously, the state mathematically converges within 30ms without merge conflicts or lost updates.",
  },
  {
    id: "code-sandboxes",
    category: "Execution",
    badge: "E2B Sandboxes",
    question: "Can we write and execute arbitrary Python or JavaScript code inside the pipeline?",
    answer:
      "Yes. Using the js-code and python-code nodes, you can execute complex data transformations and ML pipelines in isolated cloud micro-VM sandboxes (powered by E2B). All organization vault secrets are automatically injected as native environment variables (process.env in JS / os.environ in Python).",
  },
]

export function CanvasFaq() {
  const [openId, setOpenId] = React.useState<string | null>("cloudflare-bot")

  return (
    <div className="w-full">
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground mb-4 shadow-xs">
          <HelpCircle className="size-3.5 text-emerald-500" />
          <span>Architecture &amp; Security</span>
        </div>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
          Frequently Asked Questions
        </h2>
        <p className="mt-3 text-sm sm:text-base text-muted-foreground leading-relaxed">
          Everything you need to know about our Stagehand AI agents, Trigger.dev background execution,
          vault encryption, and Liveblocks multiplayer.
        </p>
      </div>

      {/* Accordion Node Cards */}
      <div className="max-w-3xl mx-auto space-y-4">
        {FAQS.map((faq) => {
          const isOpen = openId === faq.id

          return (
            <div
              key={faq.id}
              className={cn(
                "relative rounded-xl border bg-card transition-all duration-200 overflow-hidden dark:bg-[#141417] select-none",
                isOpen
                  ? "border-blue-500 shadow-md ring-1 ring-blue-500/20"
                  : "border-border/80 hover:border-border"
              )}
            >
              {/* Node Handle Notch Indicator */}
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  top: "24px",
                  transform: "translate(-100%, -50%)",
                }}
                className={cn(
                  "w-1.5 h-3.5 rounded-l-xs transition-colors",
                  isOpen ? "bg-blue-500" : "bg-border"
                )}
              />

              {/* Accordion Question Header */}
              <button
                type="button"
                onClick={() => setOpenId(isOpen ? null : faq.id)}
                className="w-full p-4 sm:p-5 flex items-center justify-between text-left cursor-pointer gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Badge
                    variant="outline"
                    className={cn(
                      "font-mono text-[10px] shrink-0 font-medium",
                      isOpen ? "bg-blue-500/10 text-blue-500 border-blue-500/30" : "bg-muted"
                    )}
                  >
                    {faq.badge}
                  </Badge>
                  <span className="text-sm sm:text-base font-semibold text-foreground truncate">
                    {faq.question}
                  </span>
                </div>

                <ChevronDown
                  className={cn(
                    "size-4 shrink-0 text-muted-foreground transition-transform duration-200",
                    isOpen && "rotate-180 text-blue-500"
                  )}
                />
              </button>

              {/* Accordion Answer Content */}
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-5 sm:px-5 sm:pb-6 pt-1 border-t border-border/60 text-xs sm:text-sm text-muted-foreground leading-relaxed space-y-3 font-normal">
                      <p>{faq.answer}</p>

                      {faq.codeSnippet && (
                        <div className="p-3 rounded-lg border border-border bg-muted/40 font-mono text-xs text-foreground dark:bg-[#1c1c20]">
                          <div className="flex items-center gap-1.5 text-muted-foreground pb-1.5 mb-1.5 border-b border-border text-[10px]">
                            <Terminal className="size-3 text-blue-500" />
                            <span>Zero-Leak Token Substitution</span>
                          </div>
                          <pre className="text-[11px] text-emerald-600 dark:text-emerald-400 overflow-x-auto">
                            {faq.codeSnippet}
                          </pre>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        })}
      </div>
    </div>
  )
}
