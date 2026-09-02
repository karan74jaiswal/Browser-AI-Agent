# Specification: World-Class Interactive SaaS Landing Page (`/`)

## 1. Feature Overview & Objectives
The `/` root route serves as the flagship marketing landing page for the SaaS product. It must convey the polish, craftsmanship, and authority of a venture-backed developer platform (like Linear, Vercel, Trigger.dev, or Resend).

It must visually demonstrate the core value proposition: **"Visual, Collaborative AI Browser & Workflow Automation for Modern Engineering Teams"**.

---

## 2. Route Architecture & Separation of Concerns

```
app/
├── page.tsx                     # Public Landing Page (Server Component + Client interactive widgets)
├── (auth)/
│   ├── sign-in/[[...sign-in]]/page.tsx
│   └── sign-up/[[...sign-up]]/page.tsx
└── (dashboard)/                 # Protected App Surfaces
    ├── layout.tsx               # App Sidebar, Header, Org Context
    ├── workflows/page.tsx       # Workflows List
    ├── workflows/[id]/page.tsx  # ReactFlow Canvas & Liveblocks Room
    └── templates/page.tsx       # Template Registry
```

- If a user is already authenticated and visits `/`, the hero CTA dynamically displays **"Go to Dashboard &rarr;"** instead of "Sign In".
- No dashboard layouts or canvas Liveblocks providers wrap `/` to ensure instant sub-100ms loading speeds.

---

## 3. Detailed Section-by-Section Breakdown

### Section 1: Sticky Glassmorphism Navigation Bar
- **Branding**: Logo mark with glowing indigo/violet badge + product title `Browser AI Agent`.
- **Navigation Links**: Smooth scroll to `#features`, `#templates`, `#security`, `#pricing`, `#docs`.
- **Actions**:
  - Dark mode toggle.
  - GitHub Stars badge / link.
  - Signed-out: `Sign In` (Ghost) + `Get Started Free` (Primary Gradient).
  - Signed-in: `Go to Dashboard` (Primary Gradient with arrow).

### Section 2: Hero Section with Live Interactive Workflow Simulator
- **Headline**: High-impact copy: *"Automate Complex Browser & Backend Workflows Visually — Powered by AI Agents."*
- **Subheadline**: *"Compose resilient DAG workflows with Stagehand AI browser automation, distributed background queues, and multiplayer collaboration."*
- **CTAs**:
  - `Start Building Free` $\rightarrow$ triggers onboarding / signup.
  - `Watch 2-Min Demo` $\rightarrow$ opens video modal showing Liveblocks multi-cursor canvas in action.
- **Interactive Hero Widget (Mini Workflow Simulator)**:
  - An interactive React canvas rendering 4 connected nodes: `Stripe Webhook` $\rightarrow$ `If VIP Customer` $\rightarrow$ `Stagehand AI Extract` $\rightarrow$ `Send Email`.
  - User can click **"Test Run"** on the landing page $\rightarrow$ glowing active pulses travel across the edges in real-time with mock log output streaming beside it!

### Section 3: Metrics & Trust Bar
- Metric 1: `99.9%` Uptime & Distributed Task Retries (Trigger.dev).
- Metric 2: `AES-256-GCM` Zero-Knowledge Tenant Cryptography.
- Metric 3: `<50ms` Multiplayer Cursor Latency (Liveblocks CRDT).
- Metric 4: `100%` Sandbox Isolation for Python & JS Code (E2B).

### Section 4: Deep-Dive Feature Grid (Bento Box Layout)
1. **Multiplayer Canvas Collaboration**: Show animated avatar stack with 3 live simulated cursors moving and selecting nodes.
2. **AI Browser Automation (Stagehand v4 + Browserbase)**: Visual simulation of `observe`, `act`, and `extract` on live websites with session replay.
3. **Resilient DAG Execution Engine**: Diagram illustrating parallel branches, winner-takes-all merge nodes, and automated error boundaries.
4. **Encrypted Credential Vault**: Interactive vault key card demonstrating how `{{ secrets.KEY }}` tokens are resolved only in-memory.

### Section 5: Template Showcase Carousel
- Embed the top 4 templates from `specs/template-workflows-registry.md`.
- Each card shows the topology diagram, execution time estimate, and a **"1-Click Clone"** button that deep-links directly into the workspace.

### Section 6: Interactive Pricing Matrix
- Billing toggle: **Monthly / Annual (Save 20%)**.
- Three tiers matching `PLAN_LIMITS` in `lib/plan-limits.ts`:
  - **Free**: 3 Workflows, 100 Runs/mo, Standard Nodes.
  - **Pro** ($29/mo): 20 Workflows, 5,000 Runs/mo, Pro Nodes (Stripe, Google Forms, Code Sandboxes), Multiplayer Collaboration.
  - **Enterprise** (Custom): Unlimited Workflows, Dedicated Trigger.dev Concurrency, Custom SLA, Vault Compliance.
- CTA on Pro tier connects directly to Clerk Billing in-app checkout drawer.

### Section 7: Modern Footer
- Product sitemap, GitHub link, Status page, Terms, Privacy, and copyright.

---

## 4. Design System, Typography & Animation Guidelines
- **Palette**: Dark theme based on Zinc/Slate (`bg-[#09090b]`, borders `border-zinc-800`, text `text-zinc-100`, accents `indigo-500` & `violet-500`).
- **Typography**: Inter / Geist Sans with crisp tracking and high contrast.
- **Micro-Interactions**: Framer Motion for smooth section entry, gradient hover glows, and edge pulse animations.

---

## 5. What NOT to Do (Anti-Patterns & Pitfalls)
- ❌ **DO NOT make static, dead screenshots**: Use animated SVG nodes or interactive components that respond to cursor hover and clicks.
- ❌ **DO NOT break mobile layout**: All bento grid cards and interactive canvas simulators must collapse gracefully on mobile screens (`max-w-full overflow-hidden`).
- ❌ **DO NOT bundle heavy Stagehand/Browserbase backend dependencies**: Keep landing page components purely presentational and client-interactive.
- ❌ **DO NOT use raw HTML quotes or apostrophes in JSX**: Escape all apostrophes (`&apos;`) and quotes (`&quot;`) to satisfy ESLint rules.
