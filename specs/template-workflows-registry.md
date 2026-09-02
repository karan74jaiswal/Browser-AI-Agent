# Specification: Template Workflows Registry & 1-Click Import

## 1. Feature Overview & Objectives
The Template Workflows Registry provides pre-built, production-ready automation workflows that users can explore, preview, and instantly clone into their organization workspace with a single click.

This eliminates the "blank canvas anxiety" for new signups coming from marketing videos, social posts, or the landing page, and enables hiring panels to immediately experience high-value automations without manual wiring.

---

## 2. End-to-End User Flows

### Flow A: From Landing Page / Public Video (Guest User)
1. **Discovery**: User visits `/` or a shared link `/templates?templateId=stripe-churn-recovery`.
2. **Preview**: User views a modal showing the workflow topology diagram, required integrations (e.g. Stripe, Resend), description, and expected business outcome.
3. **CTA**: User clicks **"Use This Template"**.
4. **Auth & Org Resolution**:
   - If not authenticated, user is redirected to `/sign-in?redirect_url=/templates?clone=stripe-churn-recovery`.
   - Upon signup/sign-in, if user belongs to an organization, the active `orgId` is used; if not, a default organization is provisioned.
5. **1-Click Clone**: Server action `cloneWorkflowFromTemplateAction(templateId)` clones the graph and persists to Postgres.
6. **Instant Navigation**: User is immediately redirected to `/workflows/[newWorkflowId]` with the canvas seeded, positioned, and ready to test or run.

### Flow B: From Dashboard (Authenticated User)
1. User navigates to `/templates` in the dashboard sidebar or clicks "New from Template" on `/workflows`.
2. User filters templates by category (e.g. *E-Commerce & Billing*, *AI & Browser Agents*, *Lead Generation*, *Marketing & Comms*).
3. User clicks **"Use Template"** on any card.
4. Server action checks organization plan limits (`countWorkflows(orgId) < limit`).
5. Workflow is created in Postgres and initialized in Liveblocks with room title.
6. Toast notification: *"Template imported successfully!"* $\rightarrow$ User is pushed to the workflow canvas.

---

## 3. Data Schema & Architecture

### Template Manifest Interface (`features/workflows/templates/types.ts`)

```typescript
import type { WorkflowGraph } from "@/lib/db"
import type { LucideIcon } from "lucide-react"

export type TemplateCategory =
  | "ai-agents"
  | "ecommerce-billing"
  | "lead-generation"
  | "marketing-comms"
  | "devops-monitoring"

export interface WorkflowTemplate {
  id: string
  title: string
  shortDescription: string
  fullDescription: string
  category: TemplateCategory
  icon: string // Branded icon identifier
  accent: string // Badge background class
  requiredIntegrations: Array<{
    name: string
    icon: string
    key: string // e.g. "RESEND_API_KEY", "STRIPE_SECRET_KEY"
    optional?: boolean
  }>
  graph: WorkflowGraph
  estimatedRunTime: string
  author: {
    name: string
    avatarUrl?: string
  }
}
```

---

## 4. Pre-Configured Production Templates

The registry must include at least 5 complete, runnable templates in `features/workflows/templates/registry.ts`:

1. **Stripe Failed Payment Recovery & Smart Churn Prevention** (`stripe-churn-recovery`):
   - *Topology*: `stripe-trigger` (listening to `payment_intent.payment_failed` or `invoice.payment_failed`) $\rightarrow$ `if` (Amount > $50) $\rightarrow$ True: `send-email` (VIP discount recovery via Resend) / False: `send-email` (Standard retry notice).
2. **AI Job Application Submitter & Tracker** (`ai-job-applicant-tracker`):
   - *Topology*: `start` $\rightarrow$ `open-url` (Job board) $\rightarrow$ `extract` (Job title, salary, recruiter email) $\rightarrow$ `python-code` (Match score ranking) $\rightarrow$ `send-email` (Application pitch with dynamic tokens).
3. **Google Forms Lead Scoring & Auto-Responder** (`google-forms-lead-scoring`):
   - *Topology*: `google-form-trigger` $\rightarrow$ `switch` (Budget tier: High / Medium / Low) $\rightarrow$ High: `send-email` (Direct Calendly invite) / Low: `send-email` (Self-serve demo link).
4. **Competitor SaaS Price & Feature Watchdog** (`competitor-price-watchdog`):
   - *Topology*: `start` $\rightarrow$ `open-url` (Competitor pricing page) $\rightarrow$ `extract` (Plan prices and feature table) $\rightarrow$ `if` (Price changed or discount detected) $\rightarrow$ `send-email` (Executive digest report).
5. **AI Browser Research & Data Enrichment** (`ai-browser-researcher`):
   - *Topology*: `start` $\rightarrow$ `open-url` (Company website) $\rightarrow$ `observe` (Locate contact and team page) $\rightarrow$ `extract` (Team size, founders, tech stack) $\rightarrow$ `http-request` (Webhook sync to CRM).

---

## 5. Technical Implementation Details

### File Structure to Create:
```
features/workflows/templates/
├── types.ts                     # Template schemas and categories
├── registry.ts                  # Static definitions of all 5 templates
├── actions.ts                   # cloneWorkflowFromTemplateAction
└── components/
    ├── template-card.tsx        # Card with badges, node preview chips, CTA
    ├── template-dialog.tsx      # Modal showing graph topology & required secrets
    └── template-category-tabs.tsx # Category filtering pills
app/(dashboard)/templates/
└── page.tsx                     # Full-page template gallery
```

### Server Action Contract (`features/workflows/templates/actions.ts`):
- Reads active `orgId` and subscription plan from Clerk auth (`await auth()`).
- Validates that `countWorkflows(orgId) < limit`. Throws descriptive error if plan limit is reached.
- Generates new unique IDs for the workflow and generates fresh webhook secrets for any trigger nodes in the template graph (`whsec_${crypto.randomUUID()}`).
- Inserts new workflow into Postgres with `createWorkflow(orgId, name)`.
- Saves the cloned graph with `saveWorkflowGraph(workflow.id, orgId, freshGraph)`.
- Updates Liveblocks room metadata: `liveblocks.updateRoom(workflow.id, { metadata: { title: name } })`.
- Returns `{ success: true, workflowId: workflow.id }`.

---

## 6. What NOT to Do (Anti-Patterns & Pitfalls)
- ❌ **DO NOT hardcode stale node IDs**: When cloning a template, ensure node IDs and edge source/target references match cleanly.
- ❌ **DO NOT share webhook secrets across clones**: Every cloned trigger node must generate a brand new `secret` in its `values` to maintain webhook isolation.
- ❌ **DO NOT bypass plan gating**: Always verify `getWorkflowLimit(currentPlan)` before creating the cloned workflow.
- ❌ **DO NOT duplicate Liveblocks rooms**: Always initialize the newly created workflow room with its unique `workflow.id`.
