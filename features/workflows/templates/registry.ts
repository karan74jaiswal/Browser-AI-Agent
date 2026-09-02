import type { TemplateCategory, WorkflowTemplate } from "./types"

export const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  {
    id: "stripe-churn-recovery",
    title: "Stripe Failed Payment Recovery & Smart Churn Prevention",
    shortDescription:
      "Automatically recover failed payments with tiered email outreach and VIP retention discounts.",
    fullDescription:
      "Listens to failed Stripe payment events in real-time. Evaluates the failed amount with intelligent branching: high-value transactions (over $50) receive an immediate personalized recovery email containing an exclusive 20% discount code, while standard transactions receive an automated payment retry notification with billing portal links, dramatically reducing involuntary churn.",
    category: "ecommerce-billing",
    icon: "CreditCard",
    accent: "bg-[#635BFF] text-white",
    requiredIntegrations: [
      {
        name: "Stripe",
        icon: "CreditCard",
        key: "STRIPE_SECRET_KEY",
        description: "Listens for payment_intent.payment_failed webhook events",
      },
      {
        name: "Resend",
        icon: "Mail",
        key: "RESEND_API_KEY",
        description: "Dispatches transactional recovery and discount emails",
      },
    ],
    estimatedRunTime: "~2s",
    highlights: [
      "Real-time Stripe webhook ingestion",
      "Conditional VIP recovery routing (> $50)",
      "Automated discount code generation",
      "Zero-configuration billing portal recovery links",
    ],
    author: {
      name: "Nodus Automation",
    },
    graph: {
      nodes: [
        {
          id: "stripe-1",
          type: "step",
          position: { x: 0, y: 160 },
          data: {
            type: "stripe-trigger",
            kind: "trigger",
            title: "Stripe Payment Failed",
            values: {
              eventType: "payment_intent.payment_failed",
              secret: "whsec_stripe_template",
            },
          },
        },
        {
          id: "if-1",
          type: "step",
          position: { x: 340, y: 160 },
          data: {
            type: "if",
            kind: "action",
            title: "Amount > $50?",
            values: {
              combinator: "and",
              conditions: JSON.stringify([
                {
                  id: "cond-1",
                  left: "{{ stripe-1.amount }}",
                  operator: "greater_than",
                  right: "50",
                },
              ]),
            },
          },
        },
        {
          id: "email-vip",
          type: "step",
          position: { x: 680, y: 50 },
          data: {
            type: "send-email",
            kind: "action",
            title: "Send VIP Retention Discount",
            values: {
              to: "{{ stripe-1.customerEmail }}",
              subject:
                "Urgent: Issue with your payment of ${{ stripe-1.amount }}",
              body: "Hi there,\n\nWe noticed your recent payment of ${{ stripe-1.amount }} {{ stripe-1.currency }} could not be completed.\n\nBecause you are a valued customer, here is an exclusive 20% discount code to renew your subscription immediately: VIP20RECOVERY.\n\nPlease visit your billing portal to update your payment method: https://app.example.com/billing\n\nBest,\nThe Customer Success Team",
            },
          },
        },
        {
          id: "email-std",
          type: "step",
          position: { x: 680, y: 270 },
          data: {
            type: "send-email",
            kind: "action",
            title: "Send Standard Retry Notice",
            values: {
              to: "{{ stripe-1.customerEmail }}",
              subject: "Action Required: Update payment method",
              body: "Hello,\n\nYour payment of ${{ stripe-1.amount }} {{ stripe-1.currency }} was unsuccessful. Please update your billing information within 48 hours to avoid any service disruption.\n\nUpdate here: https://app.example.com/billing\n\nThank you,\nSupport Team",
            },
          },
        },
      ],
      edges: [
        {
          id: "e1",
          source: "stripe-1",
          target: "if-1",
        },
        {
          id: "e2",
          source: "if-1",
          target: "email-vip",
          sourceHandle: "true",
        },
        {
          id: "e3",
          source: "if-1",
          target: "email-std",
          sourceHandle: "false",
        },
      ],
    },
  },
  {
    id: "ai-job-applicant-tracker",
    title: "AI Job Application Submitter & Tracker",
    shortDescription:
      "Scrape job postings, extract hiring manager contacts, rank fit with Python, and send tailored pitches.",
    fullDescription:
      "Automates end-to-end technical job discovery and outreach. Stagehand navigates directly to target career boards, extracts structured role criteria and recruiter contact details, runs Python code in an E2B cloud sandbox to compute a custom role compatibility score and format cover letter points, and sends a personalized application email.",
    category: "ai-agents",
    icon: "Bot",
    accent: "bg-indigo-500 text-white",
    requiredIntegrations: [
      {
        name: "Resend",
        icon: "Mail",
        key: "RESEND_API_KEY",
        description: "Dispatches personalized job application emails",
      },
    ],
    estimatedRunTime: "~15s",
    highlights: [
      "Stagehand autonomous browser extraction",
      "E2B sandboxed Python execution",
      "Dynamic cover letter token interpolation",
      "Automated recruiter discovery",
    ],
    author: {
      name: "Nodus Automation",
    },
    graph: {
      nodes: [
        {
          id: "start-1",
          type: "step",
          position: { x: 0, y: 160 },
          data: {
            type: "start",
            kind: "trigger",
            title: "Start Job Pipeline",
            values: {},
          },
        },
        {
          id: "url-1",
          type: "step",
          position: { x: 280, y: 160 },
          data: {
            type: "open-url",
            kind: "action",
            title: "Open Careers Page",
            values: {
              url: "https://news.ycombinator.com/jobs",
            },
          },
        },
        {
          id: "extract-1",
          type: "step",
          position: { x: 560, y: 160 },
          data: {
            type: "extract",
            kind: "action",
            title: "Extract Job & Recruiter Details",
            values: {
              instruction:
                "Extract the primary job title, company name, salary range, and recruiter contact email from the top hiring post.",
            },
          },
        },
        {
          id: "py-1",
          type: "step",
          position: { x: 840, y: 160 },
          data: {
            type: "python-code",
            kind: "action",
            title: "Score Fit & Generate Pitch",
            values: {
              code: `# Score candidate fit and prepare custom intro pitch
import json

raw_job = """{{ extract-1.result }}"""
print("Analyzing requirements from:", raw_job[:80])
pitch = f"Based on the role specifications ({raw_job[:60]}...), I bring 6+ years of full-stack TypeScript & AI agent systems engineering."
pitch`,
            },
          },
        },
        {
          id: "email-1",
          type: "step",
          position: { x: 1120, y: 160 },
          data: {
            type: "send-email",
            kind: "action",
            title: "Send Tailored Pitch",
            values: {
              to: "recruiting@example.com",
              subject: "Application for Engineering Role",
              body: "Hello Hiring Team,\n\nI am writing to express my enthusiasm for your open engineering position.\n\nSummary of fit:\n{{ py-1.result }}\n\nMy portfolio and projects are available for your review.\n\nBest regards,\nCandidate",
            },
          },
        },
      ],
      edges: [
        {
          id: "e1",
          source: "start-1",
          target: "url-1",
        },
        {
          id: "e2",
          source: "url-1",
          target: "extract-1",
        },
        {
          id: "e3",
          source: "extract-1",
          target: "py-1",
        },
        {
          id: "e4",
          source: "py-1",
          target: "email-1",
        },
      ],
    },
  },
  {
    id: "google-forms-lead-scoring",
    title: "Google Forms Lead Scoring & Auto-Responder",
    shortDescription:
      "Route incoming form responses by budget tier to send Calendly links or self-serve demo guides.",
    fullDescription:
      "Captures incoming Google Form leads via webhook. An advanced Switch router evaluates respondent responses and budget tier: enterprise scale submissions ($10k+) receive immediate VIP Calendly booking links with leadership, growth tier submissions receive product tours, and self-serve tiers receive sandbox demo links and documentation.",
    category: "lead-generation",
    icon: "ClipboardList",
    accent: "bg-purple-600 text-white",
    requiredIntegrations: [
      {
        name: "Resend",
        icon: "Mail",
        key: "RESEND_API_KEY",
        description: "Dispatches tailored lead responses and demo links",
      },
    ],
    estimatedRunTime: "~3s",
    highlights: [
      "Instant Google Forms webhook capture",
      "Multi-branch Switch conditional logic",
      "Automated calendar booking dispatch",
      "Lead segmentation by budget tier",
    ],
    author: {
      name: "Nodus Automation",
    },
    graph: {
      nodes: [
        {
          id: "gform-1",
          type: "step",
          position: { x: 0, y: 180 },
          data: {
            type: "google-form-trigger",
            kind: "trigger",
            title: "Inbound Lead Submission",
            values: {
              accessMode: "public",
              secret: "whsec_gform_template",
            },
          },
        },
        {
          id: "switch-1",
          type: "step",
          position: { x: 360, y: 180 },
          data: {
            type: "switch",
            kind: "action",
            title: "Route by Budget Tier",
            values: {
              mode: "rules",
              fallbackEnabled: "true",
              fallbackName: "Self-Serve Demo",
              rules: JSON.stringify([
                {
                  id: "r1",
                  name: "High Budget ($10k+)",
                  combinator: "or",
                  conditions: [
                    {
                      id: "c1",
                      left: "{{ gform-1.responses }}",
                      operator: "contains",
                      right: "$10,000",
                    },
                    {
                      id: "c2",
                      left: "{{ gform-1.responses }}",
                      operator: "contains",
                      right: "Enterprise",
                    },
                  ],
                },
                {
                  id: "r2",
                  name: "Medium Budget ($2k-$10k)",
                  combinator: "or",
                  conditions: [
                    {
                      id: "c3",
                      left: "{{ gform-1.responses }}",
                      operator: "contains",
                      right: "$2,000",
                    },
                    {
                      id: "c4",
                      left: "{{ gform-1.responses }}",
                      operator: "contains",
                      right: "Growth",
                    },
                  ],
                },
              ]),
            },
          },
        },
        {
          id: "email-vip",
          type: "step",
          position: { x: 720, y: 50 },
          data: {
            type: "send-email",
            kind: "action",
            title: "Send VIP Calendly Booking",
            values: {
              to: "{{ gform-1.respondentEmail }}",
              subject: "Schedule your Architecture Consultation",
              body: "Hi,\n\nThanks for submitting {{ gform-1.formTitle }}! Based on your organization's scale, we would love to connect you directly with our Founding Team.\n\nBook your private session here: https://calendly.com/founders/vip-session\n\nLooking forward to speaking!",
            },
          },
        },
        {
          id: "email-med",
          type: "step",
          position: { x: 720, y: 180 },
          data: {
            type: "send-email",
            kind: "action",
            title: "Send Guided Product Tour",
            values: {
              to: "{{ gform-1.respondentEmail }}",
              subject: "Welcome to Nodus! Explore our platform overview",
              body: "Hi,\n\nThank you for reaching out via {{ gform-1.formTitle }}. We have prepared a customized tour of our automation features for your team.\n\nSchedule a demo here: https://calendly.com/team/demo\n\nBest regards,\nThe Growth Team",
            },
          },
        },
        {
          id: "email-low",
          type: "step",
          position: { x: 720, y: 310 },
          data: {
            type: "send-email",
            kind: "action",
            title: "Send Self-Serve Quickstart",
            values: {
              to: "{{ gform-1.respondentEmail }}",
              subject: "Getting Started with Nodus - Quickstart Guide",
              body: "Hi,\n\nThank you for your interest! You can jump right into our self-serve playground and start building your first workflow today:\n\nExplore Docs: https://docs.example.com\nInteractive Templates: https://app.example.com/templates\n\nHappy building!",
            },
          },
        },
      ],
      edges: [
        {
          id: "e1",
          source: "gform-1",
          target: "switch-1",
        },
        {
          id: "e2",
          source: "switch-1",
          target: "email-vip",
          sourceHandle: "0",
        },
        {
          id: "e3",
          source: "switch-1",
          target: "email-med",
          sourceHandle: "1",
        },
        {
          id: "e4",
          source: "switch-1",
          target: "email-low",
          sourceHandle: "fallback",
        },
      ],
    },
  },
  {
    id: "competitor-price-watchdog",
    title: "Competitor SaaS Price & Feature Watchdog",
    shortDescription:
      "Monitor competitor pricing pages, detect plan changes or discounts, and alert your leadership team.",
    fullDescription:
      "Deploys a browser agent to regularly inspect competitor pricing and plan pages. Extracts pricing tables, tier limits, and promotional offers. When changes or discounts are detected, it dispatches an executive intelligence digest directly to team leads.",
    category: "devops-monitoring",
    icon: "Eye",
    accent: "bg-rose-500 text-white",
    requiredIntegrations: [
      {
        name: "Resend",
        icon: "Mail",
        key: "RESEND_API_KEY",
        description: "Sends pricing alert digests to executive stakeholders",
      },
    ],
    estimatedRunTime: "~12s",
    highlights: [
      "Automated competitor webpage crawling",
      "AI structured extraction of pricing tiers",
      "Condition-based alert filtering",
      "Executive summary email delivery",
    ],
    author: {
      name: "Nodus Automation",
    },
    graph: {
      nodes: [
        {
          id: "start-1",
          type: "step",
          position: { x: 0, y: 160 },
          data: {
            type: "start",
            kind: "trigger",
            title: "Start Watchdog",
            values: {},
          },
        },
        {
          id: "url-1",
          type: "step",
          position: { x: 280, y: 160 },
          data: {
            type: "open-url",
            kind: "action",
            title: "Open Competitor Pricing Page",
            values: {
              url: "https://stripe.com/pricing",
            },
          },
        },
        {
          id: "extract-1",
          type: "step",
          position: { x: 560, y: 160 },
          data: {
            type: "extract",
            kind: "action",
            title: "Extract Pricing Tiers & Discounts",
            values: {
              instruction:
                "Extract all tier names, monthly prices, feature limits, and any active discount or promotional banners on the page.",
            },
          },
        },
        {
          id: "if-1",
          type: "step",
          position: { x: 840, y: 160 },
          data: {
            type: "if",
            kind: "action",
            title: "Check If Pricing Detected",
            values: {
              combinator: "and",
              conditions: JSON.stringify([
                {
                  id: "c1",
                  left: "{{ extract-1.result }}",
                  operator: "is_not_empty",
                  right: "",
                },
              ]),
            },
          },
        },
        {
          id: "email-report",
          type: "step",
          position: { x: 1160, y: 70 },
          data: {
            type: "send-email",
            kind: "action",
            title: "Send Executive Pricing Digest",
            values: {
              to: "leadership@example.com",
              subject: "Competitor Pricing Intelligence Alert",
              body: "Executive Summary:\n\nPricing scan completed for {{ url-1.url }}.\n\nExtracted intelligence:\n{{ extract-1.result }}\n\nPlease review against our current roadmap and pricing model.",
            },
          },
        },
        {
          id: "email-log",
          type: "step",
          position: { x: 1160, y: 250 },
          data: {
            type: "send-email",
            kind: "action",
            title: "Log Silent Status Check",
            values: {
              to: "devops-alerts@example.com",
              subject: "Watchdog Check: No changes",
              body: "Pricing watchdog completed scan for {{ url-1.url }}. No actionable price changes detected.",
            },
          },
        },
      ],
      edges: [
        {
          id: "e1",
          source: "start-1",
          target: "url-1",
        },
        {
          id: "e2",
          source: "url-1",
          target: "extract-1",
        },
        {
          id: "e3",
          source: "extract-1",
          target: "if-1",
        },
        {
          id: "e4",
          source: "if-1",
          target: "email-report",
          sourceHandle: "true",
        },
        {
          id: "e5",
          source: "if-1",
          target: "email-log",
          sourceHandle: "false",
        },
      ],
    },
  },
  {
    id: "ai-browser-researcher",
    title: "AI Browser Research & Data Enrichment",
    shortDescription:
      "Autonomous browser agent discovers company contacts, team leadership, and tech stack for CRM sync.",
    fullDescription:
      "Conducts deep automated company intelligence gathering. Navigates target websites, uses visual AI observation to locate leadership and company directories, extracts team members and technology stack details, and syncs the structured profile to your CRM or backend via an authenticated HTTP webhook.",
    category: "ai-agents",
    icon: "Globe",
    accent: "bg-emerald-500 text-white",
    requiredIntegrations: [],
    estimatedRunTime: "~18s",
    highlights: [
      "AI vision element observation",
      "Multi-field corporate profile extraction",
      "Direct CRM webhook synchronization",
      "Zero-code API request formatting",
    ],
    author: {
      name: "Nodus Automation",
    },
    graph: {
      nodes: [
        {
          id: "start-1",
          type: "step",
          position: { x: 0, y: 160 },
          data: {
            type: "start",
            kind: "trigger",
            title: "Start Research",
            values: {},
          },
        },
        {
          id: "url-1",
          type: "step",
          position: { x: 280, y: 160 },
          data: {
            type: "open-url",
            kind: "action",
            title: "Open Target Company Site",
            values: {
              url: "https://news.ycombinator.com",
            },
          },
        },
        {
          id: "observe-1",
          type: "step",
          position: { x: 560, y: 160 },
          data: {
            type: "observe",
            kind: "action",
            title: "Observe Navigation & About Links",
            values: {
              instruction:
                "Find the navigation links pointing to 'About', 'Team', 'Press', or 'Contact' sections.",
            },
          },
        },
        {
          id: "extract-1",
          type: "step",
          position: { x: 840, y: 160 },
          data: {
            type: "extract",
            kind: "action",
            title: "Extract Company & Leadership Profile",
            values: {
              instruction:
                "Extract company summary, leadership names, headquarters location, and technology stack mentions.",
            },
          },
        },
        {
          id: "http-1",
          type: "step",
          position: { x: 1120, y: 160 },
          data: {
            type: "http-request",
            kind: "action",
            title: "Sync to CRM Webhook",
            values: {
              endpoint: "https://api.example.com/v1/crm/enrichment-webhook",
              method: "POST",
              headers: '{\n  "Content-Type": "application/json"\n}',
              body: '{\n  "sourceUrl": "{{ url-1.url }}",\n  "researchData": "{{ extract-1.result }}"\n}',
            },
          },
        },
      ],
      edges: [
        {
          id: "e1",
          source: "start-1",
          target: "url-1",
        },
        {
          id: "e2",
          source: "url-1",
          target: "observe-1",
        },
        {
          id: "e3",
          source: "observe-1",
          target: "extract-1",
        },
        {
          id: "e4",
          source: "extract-1",
          target: "http-1",
        },
      ],
    },
  },
  {
    id: "multi-channel-announcement",
    title: "Product Release & Multi-Channel Broadcast",
    shortDescription:
      "Extract release notes from your blog or changelog and broadcast updates across Slack and Discord.",
    fullDescription:
      "Automates developer relations and product changelog broadcasting. Scrapes the newest release notes from your changelog page and simultaneously formats and posts styled notifications to both team Slack channels and community Discord servers.",
    category: "marketing-comms",
    icon: "Zap",
    accent: "bg-sky-500 text-white",
    requiredIntegrations: [],
    estimatedRunTime: "~8s",
    highlights: [
      "Automated changelog extraction",
      "Simultaneous Slack & Discord posting",
      "Dynamic notification token interpolation",
    ],
    author: {
      name: "Nodus Automation",
    },
    graph: {
      nodes: [
        {
          id: "start-1",
          type: "step",
          position: { x: 0, y: 160 },
          data: {
            type: "start",
            kind: "trigger",
            title: "Start Release Broadcast",
            values: {},
          },
        },
        {
          id: "url-1",
          type: "step",
          position: { x: 280, y: 160 },
          data: {
            type: "open-url",
            kind: "action",
            title: "Open Changelog Page",
            values: {
              url: "https://github.com",
            },
          },
        },
        {
          id: "extract-1",
          type: "step",
          position: { x: 560, y: 160 },
          data: {
            type: "extract",
            kind: "action",
            title: "Extract Latest Release Highlights",
            values: {
              instruction:
                "Extract the title, version number, and top 3 bullet points from the latest release announcement.",
            },
          },
        },
        {
          id: "slack-1",
          type: "step",
          position: { x: 840, y: 70 },
          data: {
            type: "slack",
            kind: "action",
            title: "Post to #announcements in Slack",
            values: {
              webhookUrl: "https://hooks.slack.com/services/sample/webhook",
              content:
                "🚀 *New Product Release Announced!*\n\n{{ extract-1.result }}\n\nRead more: {{ url-1.url }}",
              username: "Release Bot",
            },
          },
        },
        {
          id: "discord-1",
          type: "step",
          position: { x: 840, y: 250 },
          data: {
            type: "discord",
            kind: "action",
            title: "Post to #updates in Discord",
            values: {
              webhookUrl:
                "https://discord.com/api/webhooks/sample/webhook",
              content:
                "🚀 **New Product Release Announced!**\n\n{{ extract-1.result }}\n\nRead more: {{ url-1.url }}",
              username: "Release Bot",
            },
          },
        },
      ],
      edges: [
        {
          id: "e1",
          source: "start-1",
          target: "url-1",
        },
        {
          id: "e2",
          source: "url-1",
          target: "extract-1",
        },
        {
          id: "e3",
          source: "extract-1",
          target: "slack-1",
        },
        {
          id: "e4",
          source: "extract-1",
          target: "discord-1",
        },
      ],
    },
  },
  {
    id: "bulk-lead-outreach-loop",
    title: "Batch Lead Enrichment & Personalized Outreach Loop",
    shortDescription:
      "Process qualified lead batches with automated email personalization and real-time campaign reporting.",
    fullDescription:
      "Scales outbound sales workflows with iterative looping. Takes a list of enriched leads, evaluates each profile in a resilient Loop processor with error isolation, sends personalized VIP pitch emails to each prospect, and notifies your team in Slack upon campaign completion.",
    category: "lead-generation",
    icon: "Repeat",
    accent: "bg-emerald-600 text-white",
    requiredIntegrations: [
      {
        name: "Resend",
        icon: "Mail",
        key: "RESEND_API_KEY",
        description: "Sends personalized outreach emails to each evaluated lead",
      },
    ],
    estimatedRunTime: "~15s",
    highlights: [
      "Per-item batch lead iteration with Loop Node",
      "Resilient error isolation (continue on item failure)",
      "Dynamic token interpolation for personalized emails",
      "Post-loop campaign completion notification in Slack",
    ],
    author: {
      name: "Nodus Automation",
    },
    graph: {
      nodes: [
        {
          id: "start-1",
          type: "step",
          position: { x: 0, y: 160 },
          data: {
            type: "start",
            kind: "trigger",
            title: "Start Lead Campaign",
            values: {},
          },
        },
        {
          id: "code-1",
          type: "step",
          position: { x: 280, y: 160 },
          data: {
            type: "python-code",
            kind: "action",
            title: "Fetch & Score Leads",
            values: {
              code: `# Fetch qualified prospect profiles for outreach\nleads = [\n  {"name": "Sarah Connor", "email": "sarah@cyberdyne.io", "company": "Cyberdyne", "title": "VP of Engineering"},\n  {"name": "Alex Murphy", "email": "alex@ocp-corp.com", "company": "OCP Industries", "title": "Head of Automation"},\n  {"name": "Rick Deckard", "email": "rick@tyrell-ai.org", "company": "Tyrell Corp", "title": "Director of Operations"}\n]\nprint(f"Scored {len(leads)} qualified prospects")\nleads`,
            },
          },
        },
        {
          id: "loop-1",
          type: "step",
          position: { x: 560, y: 160 },
          data: {
            type: "loop",
            kind: "action",
            title: "Loop Through Qualified Leads",
            values: {
              mode: "for_each",
              items: "{{ code-1.result }}",
              onItemFailure: "continue",
              maxIterations: "50",
            },
          },
        },
        {
          id: "email-1",
          type: "step",
          position: { x: 860, y: 70 },
          data: {
            type: "send-email",
            kind: "action",
            title: "Send Personalized VIP Pitch",
            values: {
              to: "{{ loop-1.item }}",
              subject: "Scaling automation workflows for your team",
              body: "Hi,\n\nI noticed your team is expanding operations. We built Nodus to help engineering and ops leaders orchestrate autonomous AI browser workflows.\n\nWould love to share a quick 5-min demo with your team:\nhttps://calendly.com/founders/quick-demo\n\nBest regards,\nGrowth Team",
            },
          },
        },
        {
          id: "slack-1",
          type: "step",
          position: { x: 860, y: 250 },
          data: {
            type: "slack",
            kind: "action",
            title: "Post Campaign Summary to Slack",
            values: {
              webhookUrl: "https://hooks.slack.com/services/sample/webhook",
              content:
                "🎯 *Outreach Campaign Dispatched!*\n\nSuccessfully processed leads with 0 fatal errors.\nCheck CRM dashboard for engagement analytics.",
              username: "Sales Bot",
            },
          },
        },
      ],
      edges: [
        {
          id: "e1",
          source: "start-1",
          target: "code-1",
        },
        {
          id: "e2",
          source: "code-1",
          target: "loop-1",
        },
        {
          id: "e3",
          source: "loop-1",
          target: "email-1",
          sourceHandle: "loop",
        },
        {
          id: "e4",
          source: "loop-1",
          target: "slack-1",
          sourceHandle: "done",
        },
      ],
    },
  },
  {
    id: "multi-source-intelligence-merge",
    title: "Multi-Source Market Intelligence & Merge Digest",
    shortDescription:
      "Scrape multiple tech portals in parallel, merge data streams with Merge Node, and email a consolidated digest.",
    fullDescription:
      "Orchestrates concurrent intelligence gathering across multiple web portals. Scrapes Hacker News tech headlines and GitHub Trending AI repositories in parallel branches, merges the active data streams into a unified object map, and compiles an executive digest email for stakeholders.",
    category: "devops-monitoring",
    icon: "Eye",
    accent: "bg-indigo-600 text-white",
    requiredIntegrations: [
      {
        name: "Resend",
        icon: "Mail",
        key: "RESEND_API_KEY",
        description: "Dispatches the unified multi-source intelligence digest",
      },
    ],
    estimatedRunTime: "~14s",
    highlights: [
      "Parallel multi-branch web crawling",
      "Structured AI extraction from 2 portals simultaneously",
      "Automatic stream combination with Merge Node",
      "Consolidated executive intelligence email digest",
    ],
    author: {
      name: "Nodus Automation",
    },
    graph: {
      nodes: [
        {
          id: "start-1",
          type: "step",
          position: { x: 0, y: 160 },
          data: {
            type: "start",
            kind: "trigger",
            title: "Start Market Scan",
            values: {},
          },
        },
        {
          id: "url-hn",
          type: "step",
          position: { x: 280, y: 70 },
          data: {
            type: "open-url",
            kind: "action",
            title: "Open Hacker News",
            values: {
              url: "https://news.ycombinator.com",
            },
          },
        },
        {
          id: "extract-hn",
          type: "step",
          position: { x: 560, y: 70 },
          data: {
            type: "extract",
            kind: "action",
            title: "Extract Top HN Discussions",
            values: {
              instruction:
                "Extract the top 3 AI and machine learning discussions with point counts.",
            },
          },
        },
        {
          id: "url-gh",
          type: "step",
          position: { x: 280, y: 250 },
          data: {
            type: "open-url",
            kind: "action",
            title: "Open GitHub Trending",
            values: {
              url: "https://github.com/trending",
            },
          },
        },
        {
          id: "extract-gh",
          type: "step",
          position: { x: 560, y: 250 },
          data: {
            type: "extract",
            kind: "action",
            title: "Extract Trending AI Repos",
            values: {
              instruction:
                "Extract the top 3 trending open source AI repositories and their star counts.",
            },
          },
        },
        {
          id: "merge-1",
          type: "step",
          position: { x: 840, y: 160 },
          data: {
            type: "merge",
            kind: "action",
            title: "Merge Intelligence Streams",
            values: {
              mode: "combine",
              onBranchFailure: "continue",
            },
          },
        },
        {
          id: "email-digest",
          type: "step",
          position: { x: 1120, y: 160 },
          data: {
            type: "send-email",
            kind: "action",
            title: "Send Unified Intelligence Digest",
            values: {
              to: "executives@example.com",
              subject: "Daily Market & Tech Intelligence Digest",
              body: "Executive Market Scan:\n\nHacker News Tech Highlights:\n{{ extract-hn.result }}\n\nGitHub Trending AI Projects:\n{{ extract-gh.result }}\n\nAggregated Data Stream Map:\n{{ merge-1.merged }}",
            },
          },
        },
      ],
      edges: [
        {
          id: "e1",
          source: "start-1",
          target: "url-hn",
        },
        {
          id: "e2",
          source: "start-1",
          target: "url-gh",
        },
        {
          id: "e3",
          source: "url-hn",
          target: "extract-hn",
        },
        {
          id: "e4",
          source: "url-gh",
          target: "extract-gh",
        },
        {
          id: "e5",
          source: "extract-hn",
          target: "merge-1",
        },
        {
          id: "e6",
          source: "extract-gh",
          target: "merge-1",
        },
        {
          id: "e7",
          source: "merge-1",
          target: "email-digest",
        },
      ],
    },
  },
]

export function listTemplates(): WorkflowTemplate[] {
  return WORKFLOW_TEMPLATES
}

export function getTemplateById(id: string): WorkflowTemplate | undefined {
  return WORKFLOW_TEMPLATES.find((t) => t.id === id)
}

export function getTemplatesByCategory(
  category: TemplateCategory | "all"
): WorkflowTemplate[] {
  if (category === "all") return WORKFLOW_TEMPLATES
  return WORKFLOW_TEMPLATES.filter((t) => t.category === category)
}
