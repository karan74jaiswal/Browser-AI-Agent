# Specification: Product Demo, Interactive Showcase & Hiring Assets

## 1. Feature Overview & Objectives
Provide a foolproof, high-impact demonstration system that guarantees an unforgettable interview walkthrough or viral social demonstration. 

This ensures that within **60 seconds**, any interviewer, hiring manager, or prospective user sees the platform's multi-tenant power, real-time multiplayer engine, and durable AI browser execution without relying on live external third-party service latency.

---

## 2. The 3 Star Demo Scenarios

### Scenario A: The 10-Second Real-Time Multiplayer Demo (The "Wow" Factor)
* **Goal**: Prove you mastered WebSockets, CRDTs, and distributed state management with Liveblocks and ReactFlow.
* **Execution**:
  1. Open two browser windows side-by-side (Window 1: Normal Chrome, Window 2: Incognito or second account).
  2. Open the same workflow `/workflows/[id]` in both windows.
  3. Move the cursor in Window 1 $\rightarrow$ Window 2 instantly shows the glowing branded cursor with the user's name moving across the canvas.
  4. Drag a node or connect an edge in Window 1 $\rightarrow$ Window 2 updates at 60 FPS without layout shift or dropped connections.
  5. Select a node in Window 1 $\rightarrow$ Window 2 shows a live highlight boundary indicating active remote selection.

---

### Scenario B: 1-Click Template to Live AI Execution (The "Business Value" Demo)
* **Goal**: Show how a non-technical user or business operations team solves a real problem in 30 seconds.
* **Execution**:
  1. Navigate to `/templates` and select **"Stripe Failed Payment Recovery & Smart Churn Prevention"**.
  2. Click **"Use This Template"** $\rightarrow$ Instantly redirected to the populated canvas with `stripe-trigger` $\rightarrow$ `if (Amount > $50)` $\rightarrow$ `send-email`.
  3. Click **"Run"** in the top right.
  4. Watch Trigger.dev dispatch the background task in real-time:
     - The canvas node headers turn blue (`RUNNING`) $\rightarrow$ green (`DONE`).
     - Realtime glowing pulses travel through the active branch edges.
     - The bottom **Logs Panel** live-streams step durations, input parameters, and serialized output payloads.
     - Show the Browserbase session replay or live log output.

---

### Scenario C: Multi-Tenant Zero-Knowledge Security Demo (The "Enterprise Ready" Proof)
* **Goal**: Prove deep security engineering and cryptographic domain knowledge.
* **Execution**:
  1. Open the **Credential Vault** dialog (`/workflows/[id]`).
  2. Add an API key: `STRIPE_SECRET_KEY = sk_test_...`.
  3. Explain to the interviewer:
     - The key is encrypted locally with `AES-256-GCM` using an HKDF-derived key and the organization's unique `orgId` as Additional Authenticated Data (AAD).
     - Show that even if the Postgres database is dumped, secrets cannot be decrypted under any other organization's tenant context.
     - Show how canvas token inputs automatically autocomplete `{{ secrets.STRIPE_SECRET_KEY }}` and interpolate in-memory inside Trigger.dev workers.

---

## 3. Seeded Demo Workspace Architecture

To ensure zero risk of failure during live interviews (e.g. expired third-party API keys or rate limits), create a database seed script:

```
scripts/
└── seed-demo-workspace.ts       # Seeds 5 pre-built workflows with sample run histories
```

- When run, seeds an organization with realistic run histories, passed steps, execution durations (e.g. `1.2s`, `840ms`), and pre-linked nodes.
- Gives you an instant fallback if an interviewer asks to see historical analytics or complex DAG logs.

---

## 4. Media & Video Asset Specifications for GitHub & Portfolio

### 1. Hero GIF / Video for README (`assets/demo-hero.mp4` & `.gif`)
- **Length**: 30–45 seconds.
- **Resolution**: 1920x1080 (60fps) compressed to lightweight WebM / MP4.
- **Sequence**:
  - `0:00 - 0:10`: Split screen showing 2 multiplayer cursors creating nodes.
  - `0:10 - 0:25`: Clicking Run and watching live edge animations and log streams.
  - `0:25 - 0:40`: Stagehand AI browser automation extracting listings in Browserbase.

### 2. High-Resolution Architecture Diagram (`assets/architecture-diagram.png`)
- Vector diagram showing Next.js Edge $\leftrightarrow$ Liveblocks $\leftrightarrow$ Trigger.dev $\leftrightarrow$ Neon Postgres $\leftrightarrow$ Browserbase / E2B.
