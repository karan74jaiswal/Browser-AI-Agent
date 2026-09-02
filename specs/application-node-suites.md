# Specification: Application Node Suites & Real-World Business Integrations

## 1. Feature Overview & Objectives
Transform the workflow builder's node library from a basic list of generic nodes into a professional, enterprise-grade **Application Node Suite** categorized by service ecosystem (similar to Zapier, Make, and n8n).

Each suite provides meaningful, real-world business operations that solve actual customer problems (e.g. automating failed payment retries with Stripe, sending batch emails with Resend, running web scrapers via Apify/Stagehand, and executing sandboxed code via E2B).

---

## 2. Application Suites Architecture

The Right Sidebar Palette is reorganized into 5 distinct accordion categories:

```
┌─────────────────────────────────────────────────────────────┐
│ PALETTE TOOLBAR                                             │
├─────────────────────────────────────────────────────────────┤
│ ▼ 🌐 Browser & AI Automation Suite                           │
│   • Open URL                                                │
│   • Act (Atomic AI Action)                                  │
│   • Extract (Natural Language Data Extraction)              │
│   • Observe (Interactive DOM Planning)                      │
│   • AI Web Agent (Multi-Step Goal Automation)               │
├─────────────────────────────────────────────────────────────┤
│ ▼ 💳 Stripe Financial & Billing Suite                       │
│   • Stripe Webhook Trigger (Multi-Event Listener)           │
│   • Create Payment Link (Checkout URLs)                     │
│   • Refund Payment (Charge & Payment Intent Refunds)        │
│   • Cancel Subscription (Immediate or End-of-Period)        │
├─────────────────────────────────────────────────────────────┤
│ ▼ ✉️ Resend Communications Suite                            │
│   • Send Transactional Email (Single Recipient)             │
│   • Send Batch Emails (Multi-Recipient Array)               │
│   • Check Email Delivery Status                             │
├─────────────────────────────────────────────────────────────┤
│ ▼ 🕷️ Web Scraping & Lead Enrichment Suite                   │
│   • Apify Actor Run (Lead Scrapers, Google Maps, LinkedIn)   │
│   • HTTP Request (REST APIs, Webhooks, GraphQL)             │
├─────────────────────────────────────────────────────────────┤
│ ▼ ⚡ Logic, Control Flow & Code Sandboxes                   │
│   • Start (Manual Run)                                      │
│   • If / Else Condition (12 Comparison Operators)           │
│   • Switch Router (Multi-Path Branching)                    │
│   • Loop Orchestrator (For Each, Count, While, Until)       │
│   • Merge / Join (First Winner, Combine Map, Array Flatten) │
│   • JavaScript Code Sandbox (E2B VM Execution)              │
│   • Python Code Sandbox (E2B VM Execution)                  │
│   • Wait / Delay                                            │
│   • Throw Error (Failure Boundary Testing)                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. High-Value Action Nodes Specification

### A. Stripe Suite Nodes

#### 1. `stripe-create-payment-link`
- **Purpose**: Generates a hosted Stripe Checkout URL for a product or custom amount.
- **Fields**:
  - `apiKey`: Secret token (default `{{ secrets.STRIPE_SECRET_KEY }}`).
  - `amount`: Number (e.g. `{{ Step 1 · Price }}` or `49.00`).
  - `currency`: Text (default `"usd"`).
  - `productName`: Text (e.g. `"Pro Subscription"`).
- **Outputs**:
  - `url`: The generated Stripe payment URL (`https://buy.stripe.com/...`).
  - `paymentLinkId`: Stripe Payment Link ID (`plink_...`).

#### 2. `stripe-refund-payment`
- **Purpose**: Issues a partial or full refund for a charge or payment intent.
- **Fields**:
  - `apiKey`: Secret token (default `{{ secrets.STRIPE_SECRET_KEY }}`).
  - `paymentIntentId`: Text (e.g. `{{ Stripe Trigger · Payment Intent ID }}`).
  - `amount`: Optional number for partial refund.
  - `reason`: Select (`"requested_by_customer"`, `"duplicate"`, `"fraudulent"`).
- **Outputs**:
  - `refundId`: Stripe Refund ID (`re_...`).
  - `status`: Refund status (`"succeeded"`, `"pending"`).
  - `amountRefunded`: Number.

---

### B. Resend Communications Suite

#### 1. `resend-batch-email`
- **Purpose**: Dispatches multiple personalized emails in a single atomic API call using Resend Batch API.
- **Fields**:
  - `apiKey`: Secret token (default `{{ secrets.RESEND_API_KEY }}`).
  - `emailsJson`: JSON string array of recipients: `[{"to": "user@example.com", "subject": "Hello", "html": "<p>Hi</p>"}]`.
- **Outputs**:
  - `batchId`: Batch operation ID.
  - `count`: Number of emails queued.
  - `emailIds`: Array of generated email IDs.

---

### C. Apify Web Scraping Suite

#### 1. `apify-actor-run`
- **Purpose**: Triggers an Apify cloud scraping actor (e.g. LinkedIn Scraper, Google Maps Leads, Instagram Scraper) and extracts results.
- **Fields**:
  - `apiKey`: Secret token (default `{{ secrets.APIFY_API_KEY }}`).
  - `actorId`: Actor identifier (e.g. `"apify/web-scraper"`, `"curious_coder/linkedin-scraper"`).
  - `inputJson`: JSON payload configured for the actor.
  - `waitForFinish`: Select (`"true"`, `"false"`).
- **Outputs**:
  - `runId`: Apify execution ID.
  - `datasetId`: Apify dataset ID containing scraped rows.
  - `items`: JSON array of scraped lead objects.
  - `count`: Total items scraped.

---

## 4. Implementation Rules & Contract

1. **Strict Types**: Every new action node must be defined in `features/workflows/nodes/<node-name>.ts` and registered in `nodeExecutors` in `features/workflows/nodes/node-executors.ts`.
2. **Compile-time Safety**: `nodeExecutors` must always satisfy `satisfies Record<ActionNodeType, NodeExecutor>`.
3. **Multi-Tenant Vault Isolation**: Never read credentials from server `process.env`. All third-party API keys must be retrieved through `values.apiKey` which is automatically interpolated from the organization's encrypted Credential Vault (`{{ secrets.KEY }}`).
4. **Token Icon Badge**: Add the brand SVG icon path in `features/workflows/components/token-input.tsx` so downstream tokens display the branded badge.

---

## 5. What NOT to Do (Anti-Patterns & Pitfalls)
- ❌ **DO NOT catch and swallow errors silently**: Always throw descriptive `Error` instances so Trigger.dev records the error in step metadata and displays the red failure boundary on the canvas.
- ❌ **DO NOT hardcode node UI inside `step-node.tsx`**: Keep canvas nodes 100% dynamic and registry-driven.
- ❌ **DO NOT use native HTML dropdowns**: Always use shadcn/ui `<Select>` in node manifests.
