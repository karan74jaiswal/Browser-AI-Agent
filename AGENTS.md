<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Browserbase observability

Session recordings, replays, live view, and logs come from the core Browserbase SDK
(`@browserbasehq/sdk`) — not Stagehand. Before building any observability feature, consult
Browserbase's observability docs:
https://docs.browserbase.com/platform/browser/observability

Session replay specifically — retrieving a session's recording as an HLS playlist — is
documented here:
https://docs.browserbase.com/platform/browser/observability/session-replay
The retrieval needs the secret API key, so it must be proxied server-side.

# Adding a workflow node

Workflows distinguish between two kinds of nodes: **Action Nodes** (execute during a run) and **Trigger Nodes** (initiate runs from webhooks or events). Follow the exact step-by-step instructions below based on which kind you are adding.

---

## 1. Adding an Action Node (`kind: "action"`)

Action nodes perform an operation during workflow execution (e.g. `open-url`, `act`, `extract`, `observe`, `agent`, `send-email`, `http-request`).

### Step 1: Create the Executor File (`features/workflows/nodes/<node-name>.ts`)
- Export an async executor function (e.g., `export async function httpRequest({ ... })`).
- Sanitize string inputs if URLs or tokens might contain zero-width spaces: `.trim().replace(/[\u200B\uFEFF\u00A0]/g, "")`.
- Return a serializable object containing the output variables defined in the manifest.
- Throw descriptive `Error` instances on failure (these are caught by the execution runner and recorded in the step log).

### Step 2: Register in `features/workflows/nodes/node-executors.ts`
- Import the executor function.
- Add the entry to `nodeExecutors`:
  ```typescript
  "my-action": async ({ values, getStagehand }) =>
    myAction({
      /* map values */
    }),
  ```
- The `satisfies Record<ActionNodeType, NodeExecutor>` contract enforces compile-time safety: forgetting to register an action node will cause TypeScript compilation to fail.

### Step 3: Register Manifest in `features/workflows/nodes/node-registry.ts`
- Import the relevant Lucide icon from `lucide-react`.
- Add an entry to `nodeRegistry` with:
  - `type`: string key matching the executor name (e.g. `"my-action"`).
  - `kind`: `"action"`.
  - `label`: Human-readable label (e.g. `"My Action"`).
  - `icon`: Lucide icon component.
  - `accent`: Tailwind background + text class (e.g. `"bg-teal-600 text-white"`).
  - `fields`: Array of `NodeField` (`key`, `label`, `placeholder`, `multiline`, `required`, `defaultValue`, `options`). If `options` is supplied, the inspector automatically renders a shadcn `Select` dropdown.
  - `outputs`: Array of `NodeOutput` (`path`, `label`) that downstream nodes can reference using tokens (e.g. `{{ My Action · Result }}`).
  - `requiredPlan`: Optional plan gating (`"pro"` or `"enterprise"`).

### Step 4: Register Icon SVG Path in `features/workflows/components/token-input.tsx`
- Add the node's SVG path to `nodeIconSvgPaths` so dynamic token pills in input fields display the branded icon badge.

---

## 2. Adding a Trigger Node (`kind: "trigger"`)

Trigger nodes initiate workflow runs (e.g. `start`, `google-form-trigger`, `stripe-trigger`).

### Step 1: Register Manifest in `features/workflows/nodes/node-registry.ts`
- Add an entry to `nodeRegistry` with `kind: "trigger"`, `icon`, `accent`, `fields`, and `outputs`.

### Step 2: Configure Inspector & Palette in `features/workflows/components/right-sidebar.tsx`
- **Initial Values**: In `Palette.add()`, initialize default values or generated secrets (e.g., `whsec_${crypto.randomUUID()}`).
- **Inspector Panel**: If the trigger requires webhook URLs or setup instructions, create a dedicated inspector component (e.g., `<StripeTriggerInspector>`, `<GoogleFormTriggerInspector>`) and render it in `Inspector` when `type === "<your-trigger>"`.

### Step 3: Create Webhook Route (`app/api/webhooks/<provider>/route.ts`)
- Parse query parameters: `workflowId`, `orgId`, `secret`.
- Verify workflow existence via `getWorkflow(orgId, workflowId)`.
- Verify secret authentication token against `node.data.values.secret`.
- Normalize incoming payload to a strongly typed schema.
- Dispatch Trigger.dev task:
  ```typescript
  await tasks.trigger<typeof runWorkflowTask>(
    "run-workflow",
    { workflowId, orgId, triggerData: normalizedData },
    { tags: [`workflow:${workflowId}`, `org:${orgId}`, `trigger:<provider>`] }
  )
  ```

### Step 4: Add Trigger Handling in `features/workflows/tasks/run-workflow.ts`
- In the execution loop, handle `node.data.type === "<your-trigger>"` by populating `results[id]` with `triggerData ?? { /* fallback mock data for canvas test runs */ }`.

### Step 5: Register Icon SVG Path in `features/workflows/components/token-input.tsx`
- Add the trigger's SVG path to `nodeIconSvgPaths`.

---

## 3. Architecture Rules & Guardrails

- **Registry-driven**: The canvas step node (`step-node.tsx`) and the run loop (`run-workflow.ts`) are registry-driven. Never hardcode node-specific UI or execution logic inside the canvas components.
- **Variable Interpolation**: Token inputs automatically support `{{ <nodeId>.<output-path> }}` variable references. Downstream executors receive interpolated string values.
- **Select Dropdowns**: Always use shadcn/ui components (`@/components/ui/select`), never native OS `<select>`/`<option>`.

---

## 4. What NOT to Do (Anti-Patterns & Pitfalls)

- ❌ **DO NOT modify `step-node.tsx` or `canvas.tsx` for new action nodes**: The canvas node component is 100% generic and reads everything dynamically from `nodeRegistry`. Never hardcode `if (type === "my-action")` in canvas components.
- ❌ **DO NOT touch `run-workflow.ts` for action nodes**: The Trigger.dev execution runner automatically looks up and invokes `nodeExecutors[node.data.type]`. You only ever add a branch to `run-workflow.ts` for **trigger** nodes (to handle `triggerData`).
- ❌ **DO NOT create custom modal dialogs (`<Dialog>`) or form popups for node configuration**: Node properties are managed exclusively through the Right Sidebar Inspector. When you declare `fields` in `nodeRegistry`, the inspector automatically renders corresponding inputs and handles state persistence.
- ❌ **DO NOT use native HTML `<select>` / `<option>` or `<NativeSelect>`**: Always use shadcn/ui Select (`@/components/ui/select`). Native OS dropdowns break dark mode, theme consistency, and custom styling.
- ❌ **DO NOT perform manual token substitution inside action executors**: Upstream template variables (e.g. `{{ Step 1 · URL }}`) are already resolved by the runner before your executor function is called. Executors always receive cleanly interpolated string values.
- ❌ **DO NOT silently catch and swallow errors in executors**: Always let errors bubble up or throw descriptive `Error` instances (e.g. `throw new Error("HTTP 404: Not Found")`). This ensures Trigger.dev logs the failure, marks the step as failed, and renders the red failure boundary on the canvas.
- ❌ **DO NOT bypass the `satisfies Record<ActionNodeType, NodeExecutor>` type contract**: Never use `as any` in `node-executors.ts`. The type contract guarantees every action node in `nodeRegistry` has a corresponding executor.
- ❌ **DO NOT use ad-hoc `any` or untyped `Record<string, unknown>` for third-party SDK payloads**: Always import and use official SDK types (e.g. `Stripe.Event`, `Stripe.PaymentIntent`, etc.) to maintain type safety.
- ❌ **DO NOT omit SVG paths in `token-input.tsx`**: Always add the node's SVG path in `nodeIconSvgPaths`. Forgetting this causes variable chips in downstream inputs to render without their branded icon badge.
- ❌ **DO NOT trigger background tasks directly from client components**: Always route webhook triggers and background task executions through secure server-side API routes (`/api/webhooks/...`) with proper authentication and organization scoping.

# JSX text escaping

Escape apostrophes and quotes in JSX text content — raw `'` and `"` trip the
`react/no-unescaped-entities` lint rule. Use `'` for apostrophes and
`"` for quotes (e.g. `you're`, `doesn't`). This applies only to
literal text between JSX tags, not to string attribute values or JS strings.

# ReactFlow — don't trust training data

This project uses ReactFlow (React Flow / `@xyflow/react`) for the canvas. Its
APIs, components, hooks, and props change across versions and may differ from
your training data. Before writing or changing any ReactFlow code, fetch and
consult the official LLM docs index at https://reactflow.dev/llms.txt and follow
the linked pages relevant to what you're building. Do not rely on memory for
component names, props, hook signatures, or usage patterns.

# Database types

Derive database types from the Drizzle schema — never hand-write custom or partial
shapes for table rows. Export `typeof table.$inferSelect` (and `$inferInsert` when
needed) from `db/schema.ts` and import it. When a consumer needs only some
columns, narrow with `Pick<Row, ...>` / `Omit<Row, ...>` rather than redeclaring a
literal type. Don't add an insert type where `db.insert(...).values()` already
enforces the shape.

<!-- STRIPE SKILLS START -->

## Stripe agent skills

This project has Strip agent skills installed in `.agents/skills/`. Before writing or changing Stripe code, load the most relevant skill: `sentry-setup-releases`, `stripe-apps`, `stripe-best-practices`, `stripe-directory`, `stripe-docs`, `stripe-projects`, `upgrade-stripe`, `connect-recommend`, `connect-required-verification-information`.
<!-- STRIPE SKILLS END -->

<!-- TRIGGER.DEV SKILLS START -->

## Trigger.dev agent skills

This project has Trigger.dev agent skills installed in `.agents/skills/`. Before writing or changing Trigger.dev code (background tasks, scheduled tasks, realtime, or chat.agent AI agents), load the most relevant skill: `trigger-authoring-chat-agent`, `trigger-authoring-tasks`, `trigger-chat-agent-advanced`, `trigger-cost-savings`, `trigger-getting-started`, `trigger-realtime-and-frontend`.
<!-- TRIGGER.DEV SKILLS END -->

# Stagehand Project

This is a project that uses Stagehand v4, a browser automation framework with AI-powered `act`, `extract`, and `observe` methods.

The main class can be imported as `Stagehand` from `@browserbasehq/stagehand`.

**Key Classes:**

- `Stagehand`: Main orchestrator class providing `act`, `extract`, and `observe` methods
- `browser.context`: A `BrowserContext` object that manages pages, cookies, and the clipboard
- `page`: Individual page objects accessed via `browser.context.activePage()`, `browser.context.pages()`, or created with `browser.context.newPage()`

There is no `agent` API in v4. Compose `observe`, `act`, and `extract` in your own control flow instead.

## Initialize

```typescript
import { browserbase, localBrowser, Stagehand } from "@browserbasehq/stagehand";

const browser = await localBrowser.launch({ headless: true });
const stagehand = await Stagehand.create({
  browser,
  model: {
    modelName: "openai/gpt-5.4-mini",
    apiKey: process.env.OPENAI_API_KEY,
  },
  logging: { level: "info", format: "pretty" },
});

// Access the browser context and pages
const [page] = await browser.context.pages();
const context = browser.context;

// Create new pages if needed
const page2 = await browser.context.newPage();
```

For Browserbase cloud browsers, pass the Browserbase API key to `browserbase.launch()`:

```typescript
const browser = await browserbase.launch({
  apiKey: process.env.BROWSERBASE_API_KEY,
});
const stagehand = await Stagehand.create({
  browser,
  model: { modelName: "openai/gpt-5.4-mini", apiKey: process.env.OPENAI_API_KEY },
});
```

Stagehand never reads environment variables for you. Always pass keys explicitly.

## Act

Actions are called on the `stagehand` instance (not the page). `act` takes either a string instruction or an `Action` from `observe`. Use atomic, specific instructions:

```typescript
// Act on the current active page
await stagehand.act("click the sign in button");

// Act on a specific page (when you need to target a page that isn't currently active)
await stagehand.act("click the sign in button", { page: page2 });
```

**Important:** Act instructions should be atomic and specific:

- Good: "Click the sign in button" or "Type 'hello' into the search input"
- Bad: "Order me pizza" or "Type in the search bar and hit enter" (multi-step)

Use `variables` for secrets. Values are substituted locally and never sent to the model:

```typescript
await stagehand.act("type %password% into the password field", {
  variables: { password: process.env.USER_PASSWORD },
});
```

### Observe Then Act Pattern (Recommended)

`act` accepts either a string instruction or an `Action` returned by `observe`. Use `observe` to inspect the candidate action, then pass it back to `act` for deterministic replay with no inference:

```typescript
const { data: actions } = await stagehand.observe("Click the sign in button");
const [action] = actions;

if (action?.method === "click") {
  await stagehand.act(action);
}
```

To target a specific page:

```typescript
const { data: actions } = await stagehand.observe("select blue as the favorite color", {
  page: page2,
});
const [action] = actions;

if (action) {
  await stagehand.act(action, { page: page2 });
}
```

## Extract

Extract data from pages using natural language instructions. The `extract` method is called on the `stagehand` instance and always takes both an instruction and a schema.

Every primitive returns `{ data, metadata }`. Your extracted value is on `data`; `metadata` carries the action ID and server-side cache status.

### Basic Extraction (with schema)

```typescript
import { z } from "zod/v4";

const { data } = await stagehand.extract(
  "extract all apartment listings with prices and addresses",
  z.object({
    listings: z.array(
      z.object({
        price: z.string(),
        address: z.string(),
      }),
    ),
  }),
);

console.log(data.listings);
```

### Simple Extraction

A schema is always required, so wrap single values in an object:

```typescript
const { data } = await stagehand.extract(
  "extract the sign in button text",
  z.object({ buttonText: z.string() }),
);

console.log(data.buttonText); // "Sign in"
```

### Targeted Extraction

Scope extraction to a specific element with `locator`, and prune noise with `ignoreLocators`:

```typescript
const { data } = await stagehand.extract(
  "extract the reason why script injection fails",
  z.object({ reason: z.string() }),
  {
    locator: page.locator("#main-content"),
    ignoreLocators: [page.locator("nav"), page.locator(".cookie-banner")],
  },
);
```

### URL Extraction

When extracting links or URLs, use `z.url()`:

```typescript
const { data } = await stagehand.extract(
  "extract all navigation links",
  z.object({
    links: z.array(z.url()),
  }),
);
```

### Extracting from a Specific Page

```typescript
const { data } = await stagehand.extract(
  "extract the placeholder text on the name field",
  z.object({ placeholder: z.string() }),
  { page: page2 },
);
```

### Inspecting Metadata

```typescript
const TitleSchema = z.object({ title: z.string() });

const result = await stagehand.extract("extract the page title", TitleSchema);

console.log(result.data.title);
console.log(result.metadata.actionId); // Action ID for tracing this call
console.log(result.metadata.cache.status); // "HIT", "MISS", or "DISABLED"
```

## Observe

Plan actions before executing them. Candidate actions are returned on `data`:

```typescript
// Get candidate actions on the current active page
const { data: actions } = await stagehand.observe("Click the sign in button");
const [action] = actions;

if (action) {
  console.log(action.selector, action.method, action.arguments);
}
```

Observing on a specific page:

```typescript
const { data: actions } = await stagehand.observe("find the next page button", {
  page: page2,
});
await stagehand.act(actions[0], { page: page2 });
```

## Advanced Features

### Locators

Use `page.locator(selector)` for deterministic, non-AI interactions. Selectors returned by `observe` are XPath strings prefixed with `xpath=`:

```typescript
await page.locator("xpath=/html/body/div[2]/button").click();
await page.locator("#email").fill("user@example.com");
const count = await page.locator("li.result").count();
```

### Multi-Page Workflows

```typescript
const page1 = await browser.context.newPage("https://example.com");

const page2 = await browser.context.newPage("https://example2.com");

// Act/extract/observe operate on the current active page by default
// Pass { page } option to target a specific page
await stagehand.act("click button", { page: page1 });
await stagehand.extract("get title", z.object({ title: z.string() }), { page: page2 });
```

### Caching

Server-side caching requires a Browserbase browser and a Browserbase API key:

```typescript
const browser = await browserbase.launch({
  apiKey: process.env.BROWSERBASE_API_KEY,
});
const stagehand = await Stagehand.create({
  browser,
  cache: true, // or { threshold: 1 }
});
```

## Cleanup

Close Stagehand before closing its browser:

```typescript
try {
  const stagehand = await Stagehand.create({ browser });
  try {
    // ...
  } finally {
    await stagehand.close();
  }
} finally {
  await browser.close();
}
```

## Project Structure Best Practices

- Read configuration from environment variables and pass it explicitly to the `Stagehand` constructor
- Create the browser first, pass it to `Stagehand.create()`, then pass the instance into your automation functions
- Use `async`/`await` consistently; `create`, `act`, `extract`, `observe`, and `close` all return promises
- Keep Zod schemas next to the code that consumes them and reuse `z.infer` for the decoded type
- Wrap every workflow in `try`/`finally` so `close` runs even when a step throws
- Prefer narrow, atomic instructions over one instruction that describes a whole workflow

## Security Notes

- Never hard-code API keys. Read them from `process.env` and pass them explicitly; Stagehand reads no environment variables for you
- Pass secrets through `variables` so they are substituted locally and never sent to the model provider
- Set `logging: { level: "off" }` when handling sensitive data so nothing sensitive reaches your logs
- Avoid broad instructions that may trigger unintended navigation; call `observe` first, then replay the returned `Action`

## Resources/References

- TypeScript SDK: `@browserbasehq/stagehand` on npm
- Stagehand documentation: https://docs.stagehand.dev
- Stagehand Docs MCP (Mintlify): https://docs.stagehand.dev/mcp
- Context7 MCP (Upstash): https://github.com/upstash/context7
- DeepWiki MCP: https://mcp.deepwiki.com/
