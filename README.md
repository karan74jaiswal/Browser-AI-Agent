<div align="center">

<br />

# ⚡ Nodus

### The Next-Gen Autonomous AI Workflow & Browser Orchestration Platform

<p><strong>The power of n8n & Zapier, supercharged with autonomous AI browser agents, multi-language cloud sandboxes, durable DAG execution, and real-time multiplayer collaboration.</strong></p>

<p>
  <a href="#-the-4-pillars-of-nodus">Core Pillars</a>&nbsp;&nbsp;&bull;&nbsp;&nbsp;
  <a href="#-nodus-vs-traditional-platforms">Comparison</a>&nbsp;&nbsp;&bull;&nbsp;&nbsp;
  <a href="#-workflow-node-ecosystem">Node Ecosystem</a>&nbsp;&nbsp;&bull;&nbsp;&nbsp;
  <a href="#-system-architecture">Architecture</a>&nbsp;&nbsp;&bull;&nbsp;&nbsp;
  <a href="#-engineering-highlights">Engineering</a>&nbsp;&nbsp;&bull;&nbsp;&nbsp;
  <a href="#-quick-start">Quick Start</a>&nbsp;&nbsp;&bull;&nbsp;&nbsp;
  <a href="#-product-roadmap">Roadmap</a>
</p>

<br />

<p>
  <img src="https://img.shields.io/badge/Next.js_16-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" alt="Next.js 16" />&nbsp;
  <img src="https://img.shields.io/badge/React_19-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React 19" />&nbsp;
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />&nbsp;
  <img src="https://img.shields.io/badge/Trigger.dev_v4-635BFF?style=for-the-badge&logo=triggerdotdev&logoColor=white" alt="Trigger.dev" />&nbsp;
  <img src="https://img.shields.io/badge/E2B_Sandboxes-FFD500?style=for-the-badge" alt="E2B" />&nbsp;
  <img src="https://img.shields.io/badge/Stagehand_v4-FF4F00?style=for-the-badge" alt="Stagehand" />&nbsp;
  <img src="https://img.shields.io/badge/Browserbase-0A0A0A?style=for-the-badge" alt="Browserbase" />&nbsp;
  <img src="https://img.shields.io/badge/Liveblocks-111111?style=for-the-badge&logo=liveblocks&logoColor=white" alt="Liveblocks" />&nbsp;
  <img src="https://img.shields.io/badge/Neon_Postgres-00E599?style=for-the-badge&logo=neon&logoColor=black" alt="Neon" />&nbsp;
  <img src="https://img.shields.io/badge/Drizzle_ORM-C5F74F?style=for-the-badge&logo=drizzle&logoColor=black" alt="Drizzle" />&nbsp;
  <img src="https://img.shields.io/badge/Clerk_Auth_%26_Billing-6C47FF?style=for-the-badge&logo=clerk&logoColor=white" alt="Clerk" />&nbsp;
  <img src="https://img.shields.io/badge/Sentry-362D59?style=for-the-badge&logo=sentry&logoColor=white" alt="Sentry" />
</p>

</div>

<br />

![Nodus Visual Workflow Canvas](./design/canvas-2.png)

<p align="center"><sub>Design complex automations together on a real-time multiplayer canvas, execute isolated Python/JS scripts in secure cloud sandboxes, and observe step-by-step video replays.</sub></p>

<br />

---

## 🌟 The Vision

Traditional automation tools like **Zapier** and **Make** excel at standard API webhooks, but break whenever a website lacks a public API or requires custom code and human-like interactions. On the other hand, classic browser automation scripts (Puppeteer, Playwright) break the moment a CSS selector changes and lack visual workflow management.

**Nodus bridges this gap completely.**

It combines:
1. **Visual DAG Flow Control & Data Routing** (like *n8n*)
2. **Universal Triggers & Webhook Integrations** (like *Zapier*)
3. **Isolated Multi-Language Cloud Sandboxes** (*E2B Python & JavaScript*)
4. **Autonomous AI-Driven Browser Infrastructure** (*Stagehand + Browserbase*)
5. **Real-time Multiplayer Collaboration** (*Figma for Automations*)
6. **Fault-Tolerant Background Execution** (*Trigger.dev v4*)

Whether you are scraping dynamic SPAs behind logins, running data processing scripts in isolated sandboxes, automating enterprise SaaS workflows without APIs, or orchestrating multi-step AI pipelines—Nodus provides a single, unified visual platform.

---

## 💎 The 4 Pillars of Nodus

```mermaid
mindmap
  root((⚡ NODUS))
    Visual DAG Engine (n8n)
      Multi-branch Parallel Forks
      Diamond Convergence (Merge/Join)
      Winner-Takes-All Branch Pruning
      Multi-Condition If/Else & Switch
    Cloud Code & Sandbox Execution (E2B)
      JavaScript & TypeScript Sandbox
      Python 3 Data Processing
      Real-Time Infinite Loop Detection
      Custom Theme-Matched CodeMirror
    Autonomous AI Browser Agents
      Natural Language Browser Actions
      Schema-Driven AI Extraction
      Dynamic Element Observation
      Full Video Session Replays
    Multiplayer Realtime Collaboration
      Live Collaborative Canvas (Liveblocks)
      Real-Time Cursors & Presence
      Instant State Conflict Resolution
      Multi-Tenant Org Isolation (Clerk)
```

---

## 📊 Nodus vs. Traditional Platforms

| Capability | Zapier / Make | n8n | Raw Selenium / Playwright | ⚡ **Nodus** |
| :--- | :---: | :---: | :---: | :---: |
| **Visual Flow Canvas** | ✅ | ✅ | ❌ | 🟢 **Yes (React Flow)** |
| **Real-time Multiplayer Collaboration** | ❌ | ❌ | ❌ | 🟢 **Yes (Liveblocks Cursors & Sync)** |
| **Multi-Language Cloud Sandboxes** | ⚠️ Basic JS | ⚠️ Local node | ❌ | 🟢 **Yes (E2B Isolated JS & Python)** |
| **Live Infinite Loop Analysis** | ❌ | ❌ | ❌ | 🟢 **Yes (Real-time AST Linter)** |
| **AI Autonomous Browser Actions** | ❌ | ❌ | ❌ | 🟢 **Yes (Stagehand v4 AI)** |
| **Handling Sites Without APIs** | ❌ | ❌ | ⚠️ Brittle selectors | 🟢 **Yes (Natural Language & Vision)** |
| **Video Session Replays of Runs** | ❌ | ❌ | ❌ | 🟢 **Yes (Browserbase HLS Replays)** |
| **Multi-Branch DAG & Sibling Pruning** | ⚠️ Limited | ✅ | ⚠️ Code only | 🟢 **Yes (Topological DAG Engine)** |
| **Workflow Portability (JSON Export/Import)**| ⚠️ Proprietary | ✅ | ❌ | 🟢 **Yes (Validated Zod Schema)** |
| **Durable Long-Running Cloud Tasks** | ⚠️ Timeout caps | ⚠️ Self-hosted | ⚠️ DIY Infra | 🟢 **Yes (Trigger.dev v4 Workers)** |

---

## 🧩 Workflow Node Ecosystem

Nodus includes 19 production-ready nodes organized into modular categories:

### 1. Trigger Nodes (Webhook & Schedule Ingestion)
| Node | Type | Kind | Description | Key Outputs |
| :--- | :--- | :--- | :--- | :--- |
| **Start** | `start` | `trigger` | Manual or scheduled trigger to initiate workflow runs. | `timestamp` |
| **Stripe Webhook** | `stripe-trigger` | `trigger` | Listens for real-time Stripe billing events (`payment_intent.succeeded`, `subscription.created`). | `event`, `customerId`, `amount`, `currency` |
| **Google Forms Webhook** | `google-form-trigger` | `trigger` | Receives live Google Forms submissions via webhook payloads. | `responses`, `email`, `timestamp` |

### 2. Multi-Language Code Execution Nodes (E2B Sandboxes)
| Node | Type | Kind | Description | Key Outputs |
| :--- | :--- | :--- | :--- | :--- |
| **JavaScript** | `js-code` | `action` | Executes JavaScript / TypeScript in an isolated E2B cloud sandbox. Features live AST infinite loop detection, smart async IIFE wrapping, and token interpolation. | `result`, `stdout`, `stderr` |
| **Python** | `python-code` | `action` | Executes Python 3 in an isolated E2B cloud sandbox with math, data transformation, and scripting capabilities. | `result`, `stdout`, `stderr` |

### 3. Control Flow & Logic Nodes (n8n-Grade Flow Management)
| Node | Type | Kind | Description | Key Outputs |
| :--- | :--- | :--- | :--- | :--- |
| **If / Else** | `if` | `action` | Evaluates multi-condition rule sets (`AND`/`OR`, regex, numeric comparisons, null checks) and splits into `True` / `False` branches. | `result`, `matchedRule` |
| **Switch** | `switch` | `action` | Multi-handle router directing execution across custom case branches or a default fallback branch. | `routeIndex`, `matchedValue` |
| **Merge / Join** | `merge` | `action` | Synchronizes parallel branch convergence supporting `first` (winner-takes-all), `combine` (map results), and `array` (flatten) modes. | `mergedData`, `branchCount`, `winner` |
| **Wait / Delay** | `wait` | `action` | Suspends execution durably for a specified duration in seconds before resuming. | `waitedSeconds`, `resumedAt` |
| **Throw Error** | `throw-error` | `action` | Intentionally halts workflow execution with a custom error message for dead-letter handling. | `errorMessage`, `failedAt` |

### 4. Autonomous AI & Cloud Browser Nodes
| Node | Type | Kind | Description | Key Outputs |
| :--- | :--- | :--- | :--- | :--- |
| **Open URL** | `open-url` | `action` | Navigates the isolated cloud browser session to a destination URL. | `url`, `pageTitle`, `status` |
| **Act** | `act` | `action` | Executes natural-language actions (*"Click the Sign In button"*, *"Type %password% into input"*). | `success`, `message`, `currentUrl` |
| **Extract** | `extract` | `action` | Extracts structured data from web pages using natural language and strict Zod JSON schemas. | `extraction`, `itemCount` |
| **Observe** | `observe` | `action` | Discovers interactive elements matching a description and returns candidate selectors. | `matches`, `selector`, `description` |
| **Agent** | `agent` | `action` | Autonomous multi-step agent that plans and executes complex end-to-end web tasks. | `success`, `message`, `completedSteps` |

### 5. Integration & Communication Nodes (Zapier Connectivity)
| Node | Type | Kind | Description | Key Outputs |
| :--- | :--- | :--- | :--- | :--- |
| **HTTP Request** | `http-request` | `action` | Performs REST API requests (`GET`, `POST`, `PUT`, `DELETE`, `PATCH`) with custom headers, query params, and JSON payloads. | `status`, `data`, `headers` |
| **Send Email** | `send-email` | `action` | Delivers transactional HTML emails via Resend. | `emailId`, `status` |
| **Discord Webhook** | `discord` | `action` | Sends rich formatted messages and alerts directly to Discord channels. | `status`, `messageId` |
| **Slack Webhook** | `slack` | `action` | Sends notification messages and structured payloads to Slack channels. | `status`, `ok` |

---

## 🏗️ System Architecture

```mermaid
flowchart TD
    subgraph Client["Frontend Layer (Next.js 16 + React 19)"]
        UI["Visual Canvas (React Flow)"]
        Inspector["Right Sidebar Inspector & CodeMirror 6"]
        LB_Client["Liveblocks Real-Time Client"]
        Console["Live Run Console & Video Replay"]
    end

    subgraph Auth_Data["Auth & Persistence Layer"]
        Clerk["Clerk Auth & Billing (RBAC & Plans)"]
        Postgres[("Neon Serverless Postgres\n(Drizzle ORM)")]
        LB_Cloud["Liveblocks Cloud (Presence & Room Storage)"]
    end

    subgraph Execution["Durable Execution Engine (Trigger.dev v4)"]
        Runner["runWorkflowTask (Topological DAG Runner)"]
        MergeSync["Merge Synchronizer & Branch Pruner"]
        Executors["Node Executors Registry"]
    end

    subgraph Cloud_Sandboxes["E2B Code Sandboxes"]
        E2B_JS["E2B JavaScript / TypeScript Sandbox"]
        E2B_PY["E2B Python 3 Sandbox"]
    end

    subgraph Browser_Infra["Autonomous Cloud Browser Layer"]
        BB["Browserbase Cloud Sessions"]
        Stagehand["Stagehand v4 AI Engine"]
    end

    UI <-->|Real-time Sync| LB_Client
    LB_Client <--> LB_Cloud
    UI -->|Mutations & Auth| Clerk
    UI -->|Persist Graph| Postgres

    UI -->|Trigger Run| Runner
    Runner --> MergeSync
    Runner --> Executors
    Executors -->|Code Execution| E2B_JS
    Executors -->|Code Execution| E2B_PY
    Executors -->|Browser Automation| Stagehand
    Stagehand -->|Managed Browser & Recording| BB
    Runner -.->|Live SSE Step Events| Console
    BB -.->|Proxied HLS Video Replay| Console
```

---

## ⚡ Technical & Engineering Innovations

### 1. Isolated Cloud Sandboxes with Smart Code Wrapping
Rather than executing arbitrary code on worker instances, scripts execute inside isolated **E2B microVMs**:
- **Smart Wrapper**: Automatically wraps top-level `return` statements in async IIFEs while preserving root-level ES `import` statements.
- **Strict Teardown**: Sandbox destruction is guaranteed via `finally { await sandbox.kill() }`, preventing leaked cloud containers.
- **User-Friendly Error Formatting**: Replaces raw internal timeout flags with clear error explanations pointing to potential infinite loops.

### 2. Real-Time AST Infinite Loop Detection
An integrated client-side static analyzer inspects code as the user types in CodeMirror:
- Detects unbounded `while (true)` / `while True:`, `for (;;)`, and invariant loop variables.
- Renders non-intrusive amber warning banners with line numbers before execution occurs.

### 3. Structural Digest Hashing for Zero-Lag Dragging
React Flow triggers canvas updates on every mouse coordinate change (60fps). To eliminate costly graph re-traversals during dragging:
- We compute a deterministic **structural fingerprint** (`nodeId#nodesDigest#edgesDigest`).
- BFS traversal, upstream token generation, and switch edge pruning are completely decoupled from `(x, y)` coordinates, maintaining buttery-smooth 60fps canvas performance even with hundreds of nodes.

### 4. Single-Winner Branch Pruning
When workflows split into parallel execution paths (e.g. attempting 3 fallback login methods), the `MergeSynchronizer` dynamically tracks sibling branch lifecycles:
- As soon as the first winning branch finishes, all sibling branches in the queue are cancelled in real time.
- Prevents wasteful compute and eliminates race conditions.

### 5. Dynamic Zero-Width Token Interpolation
Workflow variables (`{{ NodeId.output }}`) support deep nested properties (`{{ Extract.items[0].price }}`). All string parameters are automatically scrubbed for zero-width characters (`[\u200B\uFEFF\u00A0]`), ensuring clean JSON serialization during third-party API calls.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, React 19 Server Actions, Turbopack)
- **Visual Canvas**: [React Flow / @xyflow/react](https://reactflow.dev/)
- **Code Editor**: [CodeMirror 6](https://codemirror.net/) (`@uiw/react-codemirror` + `@codemirror/lang-javascript` + `@codemirror/lang-python`)
- **Cloud Code Sandboxes**: [E2B](https://e2b.dev/) (`@e2b/code-interpreter`)
- **Multiplayer State**: [Liveblocks](https://liveblocks.io/) (Real-time CRDTs, Cursors, Presence)
- **Durable Task Engine**: [Trigger.dev v4](https://trigger.dev/)
- **AI Browser Framework**: [Stagehand v4](https://docs.stagehand.dev/)
- **Autonomous Browser Infrastructure**: [Browserbase](https://browserbase.com/) (HLS Video Replays, Cloud Chromium)
- **AI Model Provider**: [Google Gemini](https://ai.google.dev/) (Powers Stagehand Vision & Natural Language Agents)
- **Database & ORM**: [Neon Serverless Postgres](https://neon.tech/) + [Drizzle ORM](https://orm.drizzle.team/)
- **Authentication & Monetization**: [Clerk](https://clerk.com/) (Organizations, RBAC, Billing & Pricing Tables)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/)
- **Email Service**: [Resend](https://resend.com/)
- **Telemetry & Monitoring**: [Sentry](https://sentry.io/)

---

## 🏁 Quick Start

### Prerequisites
- **Node.js** (v20+) and **npm**
- Accounts for: [Clerk](https://clerk.com/), [Neon](https://neon.tech/), [Trigger.dev](https://trigger.dev/), [E2B](https://e2b.dev/), [Liveblocks](https://liveblocks.io/), [Browserbase](https://browserbase.com/), [Google AI Studio](https://aistudio.google.com/), and [Resend](https://resend.com/).

### 1. Clone & Install
```bash
git clone https://github.com/your-username/nodus.git
cd nodus
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env.local
```

Ensure all keys are provided in `.env.local`:
```env
# App URL (Used for webhook destination URLs)
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Clerk Authentication & Billing
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/

# Neon Serverless Postgres Database
DATABASE_URL=postgres://...
DATABASE_URL_UNPOOLED=postgres://...

# Trigger.dev Background Worker
TRIGGER_SECRET_KEY=tr_dev_...

# E2B Cloud Code Sandbox (JavaScript & Python)
E2B_API_KEY=e2b_...

# Liveblocks Real-Time Collaboration
NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY=pk_liveblocks_...
LIVEBLOCKS_SECRET_KEY=sk_liveblocks_...

# Browserbase Cloud Browsers & Replays
BROWSERBASE_API_KEY=bb_...
BROWSERBASE_PROJECT_ID=...

# Gemini AI (Powers Stagehand Browser Automation)
GEMINI_API_KEY=AIzaSy...

# Resend Email Integration
RESEND_API_KEY=re_...

# Sentry Monitoring (Optional)
NEXT_PUBLIC_SENTRY_DSN=https://...
SENTRY_DSN=https://...
SENTRY_AUTH_TOKEN=...
SENTRY_ORG=...
SENTRY_PROJECT=...
```

### 3. Push Database Schema
```bash
npm run db:push
```

### 4. Start the Trigger.dev Task Runner
```bash
npx trigger.dev dev
```

### 5. Start the Web App
```bash
npm run dev
```
Navigate to [http://localhost:3000](http://localhost:3000) and build your first workflow.

---

## 🗺️ Product Roadmap

- [x] **Core Visual Canvas with React Flow & Liveblocks**
- [x] **Stagehand v4 AI Browser Actions & Autonomous Agent**
- [x] **Browserbase Video Session Replays**
- [x] **Control Flow Suite (`If/Else`, `Switch`, `Merge/Join`, `Wait`, `Throw Error`)**
- [x] **Multi-Language Cloud Code Sandboxes (`JavaScript`, `Python` via E2B)**
- [x] **Real-Time Static Infinite Loop Detection & CodeMirror 6 Editor**
- [x] **Universal JSON Workflow Import / Export Engine**
- [ ] **Credential Vault (AES-256-GCM Encrypted Secret Manager)**
- [ ] **Loop & Batch Iteration Nodes (`forEach`, `while`)**
- [ ] **Multi-Agent Orchestration Teams (Supervisor + Specialized Subagents)**
- [ ] **Pre-built Connector Marketplace (Notion, GitHub, PostgreSQL, Linear)**

---

## 🧪 Verification & Test Suite

```bash
# Run all unit and integration tests (100+ tests passing)
npm test

# Run TypeScript typecheck
npm run typecheck

# Run Next.js production build
npm run build
```

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

<br />

<div align="center">
  <sub>Designed & Developed with ❤️. Star ⭐ the repository if you find it inspiring!</sub>
</div>
