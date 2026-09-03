# Specification: World-Class Interactive SaaS Landing Page (`/`) for Nodus

## 1. Brand Identity & Product Scope

### Brand Name: **Nodus**
**Tagline**: *The Unified Visual Workflow & AI Agent Platform for Modern Engineering Teams.*

### Product Scope & Positioning:
Nodus is an enterprise-grade **Unified Workflow Orchestration Platform** that seamlessly bridges:
1. **Distributed Backend Automations**: Webhook ingestion, cron schedules, database sync, and Trigger.dev background workers.
2. **AI Browser & Web Agents**: Autonomous browser navigation, DOM extraction, and session replays with Stagehand v4 + Browserbase.
3. **Multi-Tenant Financial & Commerce Pipelines**: Real-time Stripe event routing, automatic churn prevention, and billing workflows.
4. **Data Processing & Code Sandboxes**: Secure multi-language cloud VMs (Python & JavaScript) via E2B.
5. **Real-Time Multiplayer Canvas**: Collaborative visual workflow design with Liveblocks CRDT presence and multi-cursor synchronization.

---

## 2. Design System & Theme Architecture (STRICT RULES)

### ⚠️ Strict Rule 1: No Hardcoded Colors or Ad-Hoc Hex Values
- **NEVER** write hardcoded color hex codes (e.g. `bg-[#09090b]`, `border-zinc-800`, `text-zinc-100`, `bg-[#18181b]`).
- **ALWAYS** use the semantic design tokens defined in `app/globals.css` and `@theme inline`:
  - Backgrounds: `bg-background`, `bg-card`, `bg-popover`, `bg-muted`, `bg-accent`, `bg-secondary`, `bg-primary`
  - Foregrounds / Text: `text-foreground`, `text-card-foreground`, `text-muted-foreground`, `text-primary-foreground`, `text-accent-foreground`
  - Borders & Rings: `border-border`, `border-input`, `ring-ring`, `border-sidebar-border`
  - Radii: `rounded-lg`, `rounded-md`, `rounded-xl`, `rounded-2xl`, `rounded-3xl`
- Adhering to these semantic tokens guarantees seamless light and dark mode synchronization, high contrast, and zero UI regressions.

### ⚠️ Strict Rule 2: Mandate ShadCN UI Components with Motion
- **NEVER** re-invent basic UI elements (buttons, dialogs, badges, carousels, tabs, tooltips, accordions).
- **ALWAYS** import and compose existing components from `@/components/ui/` and wrap them with `motion` / `framer-motion` for fluid spring physics:
  - Buttons: `@/components/ui/button`
  - Cards: `@/components/ui/card`
  - Badges: `@/components/ui/badge`
  - Carousel: `@/components/ui/carousel` (powered by `embla-carousel-react`)
  - Tabs: `@/components/ui/tabs`
  - Dialogs & Modals: `@/components/ui/dialog`
  - Accordion: `@/components/ui/accordion`
  - Tooltips: `@/components/ui/tooltip`
  - Spinners: `@/components/ui/spinner`
  - Separators: `@/components/ui/separator`

### ⚠️ Strict Rule 3: Match In-App Canvas & Sidebar Aesthetic
Before writing the visual simulators, reference the actual in-app component styling:
- **Canvas & Nodes**: [`step-node.tsx`](file:///Users/kartikey/Desktop/Browser-AI-Agent/features/workflows/components/step-node.tsx), [`workflow-edge.tsx`](file:///Users/kartikey/Desktop/Browser-AI-Agent/features/workflows/components/workflow-edge.tsx), [`canvas.tsx`](file:///Users/kartikey/Desktop/Browser-AI-Agent/features/workflows/components/canvas.tsx)
- **Navigation & Panels**: [`app-sidebar.tsx`](file:///Users/kartikey/Desktop/Browser-AI-Agent/components/app-sidebar.tsx), [`right-sidebar.tsx`](file:///Users/kartikey/Desktop/Browser-AI-Agent/features/workflows/components/rightSidebar/right-sidebar.tsx), [`palette.tsx`](file:///Users/kartikey/Desktop/Browser-AI-Agent/features/workflows/components/rightSidebar/palette.tsx)
*(Note: If you need visual screenshots of the live UI during execution, request them from the user).*

---

## 3. Required Packages, Skills & Reference Documentation

### A. Packages Installed & Verified
- `framer-motion` & `motion`: Installed. Use for physics-based springs, 3D card perspective tilts (`perspective: 1200px`), smooth SVG path particle flows, and viewport scroll triggers (`useInView`).
- `lucide-react`: Installed (`^1.31.0`). Use for all branded icons.
- `embla-carousel-react`: Installed (`^8.6.0`). Used by `@/components/ui/carousel`.
- `@liveblocks/react-ui` & `@liveblocks/react-flow`: Installed (`^3.24.1`). Reference for multiplayer cursors and `<AvatarStack>` presence.

### B. Agent Skills to Load
- `motion` (`.agents/skills/motion/SKILL.md`): Best practices for spring physics, layout animations, and performance.
- `liveblocks-best-practices` (`.agents/skills/liveblocks-best-practices/SKILL.md`): Multiplayer cursor conventions and presence patterns.
- `trigger-realtime-and-frontend` (`.agents/skills/trigger-realtime-and-frontend/SKILL.md`): Trigger.dev realtime progress patterns.
- `clerk-setup` (`.agents/skills/clerk-setup/SKILL.md`): Auth redirect links and session management.

### C. Official Documentation & `llms.txt` Indexes
- **React Flow Docs**: `https://reactflow.dev/llms.txt`
- **Framer Motion Docs**: `https://motion.dev/docs`
- **Browserbase Observability Docs**: `https://docs.browserbase.com/platform/browser/observability`
- **Next.js 15 App Router Guide**: `node_modules/next/dist/docs/`

---

## 4. Route Architecture & Separation of Concerns

```
app/
├── page.tsx                     # Landing Page (Fast Server Component wrapper)
└── (dashboard)/                 # Protected Dashboard Routes
    ├── layout.tsx               # App Sidebar, Header, Org Switcher
    ├── workflows/page.tsx       # Workflows List
    ├── workflows/[id]/page.tsx  # Interactive Canvas & Liveblocks Room
    └── templates/page.tsx       # Template Registry Gallery
```

- The landing page at `/` is a standalone marketing surface that does **not** load canvas Liveblocks room connections, keeping Time-to-Interactive (TTI) under 150ms.
- Authentication State Handoff:
  - If signed out: Hero CTA renders `Get Started Free` and `Sign In`.
  - If signed in: Hero CTA dynamically switches to `Go to Dashboard →` (linking directly to `/workflows`).

---

## 5. Section-by-Section Visual Effects, 3D & Animation Specs

### Section 1: Sticky Glassmorphism Navigation Bar
* **Visual Styling**: `sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md`.
* **Animations & Transitions**:
  - Logo hover: Subtle pulse glow on the icon badge.
  - Links: Underline indicator with smooth sliding layout transition (`layoutId="navbar-indicator"`).
  - Auth CTA: Primary button with subtle sheen/shimmer animation on hover.

---

### Section 2: Hero Section & Live Interactive Mini-Workflow Simulator
* **Background Shader**:
  - Subtle radial gradient spotlight (`radial-gradient(circle at 50% 0%, hsl(var(--primary)/0.15), transparent 70%)`).
  - Subtle animated dot matrix / grid pattern with CSS mask fade-out at edges.
* **Typography & Content**:
  - Animated Announcement Pill (`Badge` variant): *"Announcing Nodus v2.0 · Autonomous AI Agents & Real-Time Multiplayer"*.
  - Headline: *"Automate Complex Backend & AI Workflows Visually."* (Staggered upward fade-in with spring damping).
  - Subheadline: *"Compose resilient DAG pipelines with AI web agents, distributed background workers, Stripe event routers, and collaborative multiplayer canvas."*
  - CTAs: `Start Building Free` (`Button` variant="default" size="lg") + `Browse Templates` (`Button` variant="outline" size="lg").
* **The Interactive Mini-Workflow Simulator (3D Interactive Canvas)**:
  - **3D Card Container**: Perspective wrapper (`perspective: 1200px`) with subtle mouse-driven 3D tilt (`rotateX`, `rotateY` via `framer-motion`).
  - **Simulated Graph Nodes**: 4 interconnected branded nodes matching [`step-node.tsx`](file:///Users/kartikey/Desktop/Browser-AI-Agent/features/workflows/components/step-node.tsx):
    1. `Stripe Trigger` (*payment_failed*)
    2. `If Condition` (*amount > $50*)
    3. `Stagehand AI Agent` (*Extract Billing Portal*)
    4. `Resend Email` (*VIP Recovery Email*)
  - **Interactive "Simulate Run" Button**:
    - When clicked, glowing energetic pulse particles (`stroke-dashoffset` animation) travel along the SVG connecting edges in real time.
    - Each node header illuminates sequentially: `IDLE` $\rightarrow$ `RUNNING` (pulsing blue) $\rightarrow$ `DONE` (emerald checkmark).
    - A mini streaming log box beside the graph scrolls simulated execution timing (`"✓ Stripe webhook received (12ms)"`, `"✓ Condition evaluated: TRUE"`, `"✓ AI agent extracted portal (1.2s)"`, `"✓ Email dispatched via Resend"`).

---

### Section 3: Animated Metrics & Trust Rollup
* **Animation**: Viewport scroll trigger using `IntersectionObserver` / `framer-motion` `useInView`. Numbers roll up smoothly from 0 with spring interpolation.
* **Metric Cards**:
  1. `99.9%` — Distributed Execution Reliability (Trigger.dev Engine)
  2. `<50ms` — Multiplayer Cursor Sync Latency (Liveblocks CRDT)
  3. `AES-256` — Zero-Knowledge Tenant Cryptography (Credential Vault)
  4. `100%` — Multi-Language Cloud VM Isolation (E2B Sandboxes)
* **Styling**: Rendered in `Card` components with subtle border gradient hover effects.

---

### Section 4: Real-Time Multi-User Multiplayer Collaboration Showcase (DEDICATED SECTION)

* **Objective**: Show that Nodus is a true multiplayer Figma-like canvas where entire engineering teams collaborate live.
* **Interactive Canvas Showcase**:
  - An authentic recreation of the workflow canvas with grid background.
  - **Live Multi-Colored Cursors with Name Labels**:
    - Modeled directly after Liveblocks `@liveblocks/react-ui` and `@liveblocks/react-flow` cursor components.
    - Each cursor has a precision SVG arrow pointer + a rounded badge displaying the collaborator's name and role directly beneath/beside the pointer.
    - **Color Palette per User**:
      1. **Elena (Lead Architect)**: Emerald (`#10b981` / `text-emerald-500` badge)
      2. **Marcus (DevOps)**: Violet (`#8b5cf6` / `text-violet-500` badge)
      3. **Sarah (Product Lead)**: Amber (`#f59e0b` / `text-amber-500` badge)
      4. **David (AI Engineer)**: Sky (`#0ea5e9` / `text-sky-500` badge)
  - **Live Action Simulation**:
    - Continuous, smooth SVG path cursor movement via `framer-motion`.
    - Cursor 1 drags a node $\rightarrow$ node position updates fluidly on canvas.
    - Cursor 2 pulls a new connection edge between two nodes.
    - Cursor 3 clicks a node $\rightarrow$ node displays a glowing active selection ring.
  - **Presence Avatar Stack Header**:
    - Liveblocks-style `<AvatarStack>` in the top corner with active glowing green status rings and tooltips showing active user count (`"4 engineers collaborating in real time"`).

---

### Section 5: Deep-Dive Feature Bento Grid (Core Superpowers)

1. **Autonomous AI Browser & Web Agents**:
   - Mini terminal & web window showing Stagehand v4 `observe()`, `act()`, and `extract()` executing live DOM operations with session replay timestamps.
2. **Distributed Resilient Backend Workflows**:
   - DAG pipeline visualization with branching conditions, automatic retries, concurrency controls, and winner-takes-all Merge node synchronization.
3. **Multi-Tenant Encrypted Credential Vault**:
   - Interactive vault card demonstrating AES-256-GCM encryption with tenant-bound AAD keys and dynamic `{{ secrets.KEY }}` token resolution.
4. **Code Sandboxes (Python & TypeScript)**:
   - Live code editor simulation with syntax highlighting running safely in E2B cloud VMs.

---

### Section 6: Interactive Template Showcase Carousel
* **Component**: Built using `@/components/ui/carousel` (`Carousel`, `CarouselContent`, `CarouselItem`, `CarouselNext`, `CarouselPrevious`).
* **Content**: Showcase top production templates from `specs/template-workflows-registry.md`:
  - *Stripe Failed Payment Recovery & Churn Prevention*
  - *AI Job Application Submitter & Fit Scorer*
  - *Google Forms Inbound Lead Qualification*
  - *Competitor SaaS Price & Feature Watchdog*
* **Card Interactivity**: Hovering lifts the card (`-translate-y-1.5 transition-transform duration-300`), illuminates the category badge, and displays a **"1-Click Clone →"** button linking directly to `/templates?clone=[id]`.

---

### Section 7: Interactive Pricing Matrix
* **Billing Frequency Switch**: Animated pill toggle using `@/components/ui/tabs` or custom spring toggle: **Monthly** vs **Annual (Save 20%)**.
* **Three Pricing Cards (`Card` component)**:
  1. **Free Tier**: Free forever. 3 Workflows, 100 Runs/mo, Standard Nodes, Single User.
  2. **Pro Tier ($29/mo)** *(Featured with Radiant Border Beam)*: 20 Workflows, 5,000 Runs/mo, Pro Nodes (Stripe, Google Forms, E2B Code Sandboxes, Stagehand), Realtime Multiplayer.
  3. **Enterprise Tier (Custom)**: Unlimited Workflows, Dedicated Worker Concurrency, Custom SLA, Private Vault Encryption.
* **Direct Integration**: The Pro tier CTA connects directly to Clerk Billing in-app checkout.

---

### Section 8: Distributed Architecture & Tech Stack Banner
* **Visual**: Grid of branded vector tech logos with subtle monochrome-to-color hover transitions:
  - `Next.js 15` · `Trigger.dev v3` · `Stagehand v4` · `Liveblocks` · `Neon Postgres` · `E2B Sandboxes` · `Clerk` · `Resend` · `Stripe`

---

### Section 9: High-Converting Final CTA & Modern Footer
* **Final CTA Card**: Large ambient glow banner: *"Build Your First Autonomous Workflow in 60 Seconds."*
* **Footer**: Clean 4-column sitemap (Product, Templates, Developers, Company) + dark mode toggle + copyright.

---

## 6. What NOT to Do (Anti-Patterns & Critical Pitfalls)

- ❌ **DO NOT hardcode color codes**: Never use `#09090b`, `#18181b`, `zinc-900`, `zinc-100`. Only use `bg-background`, `bg-card`, `text-foreground`, `border-border`, etc.
- ❌ **DO NOT restrict messaging to Browser Automation**: Position Nodus as a complete workflow orchestration platform across backend, AI, commerce, and browser tasks.
- ❌ **DO NOT build custom buttons or cards from scratch**: Always import from `@/components/ui/button`, `@/components/ui/card`, `@/components/ui/badge`.
- ❌ **DO NOT break mobile responsiveness**: All 3D tilt effects, bento cards, and interactive canvas simulators must have CSS fallback styles for touch devices (`overflow-x-hidden`, responsive grid columns).
- ❌ **DO NOT use unescaped JSX quotes or apostrophes**: Use `&apos;` for apostrophes and `&quot;` for quotes to prevent lint errors.
