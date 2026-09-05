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

# Adding a Workflow Node (System Architecture Framework)

> **SOURCE OF TRUTH**: The entire workflow node architecture is defined in `features/workflows/system/`.
> The execution engine, canvas, right sidebar, and inspector are **100% generic and registry-driven**.
> When adding or modifying a node, you **NEVER** modify canvas components, execution runners, sidebars, or token inputs. Follow the exact step-by-step instructions below.

---

## 1. Architectural Invariants & File Structure

All nodes live inside the modular taxonomy in `features/workflows/system/suites/`:
- **Flow Nodes** (`suites/flow/`): Graph topology, branching, loops, and control flow primitives (`start`, `if`, `switch`, `loop`, `merge`, `wait`, `throw-error`).
- **Core Nodes** (`suites/core/`): Compute sandboxes and network primitives (`js-code`, `python-code`, `http-request`).
- **App Nodes** (`suites/apps/categories/<category-id>/`): Third-party integrations and app tools (`browserbase`, `stripe`, `resend`, `google-form`, `slack`, `discord`, etc.).

### Directory Structure of a Node / Category:
Each node or integration category is completely self-contained:
```
features/workflows/system/suites/apps/categories/<category-id>/
├── icon.tsx                          # App brand icon component (Lucide or branded SVG)
├── index.ts                          # Re-exports category node modules
├── nodes/
│   └── <node-name>.ts                # Node definition module (manifest, icon, initial values)
├── executors/
│   └── <node-name>.ts                # Pure backend execution logic (isolated from React)
├── inspectors/                       # (OPTIONAL) Custom inspector if custom UI/docs needed
│   └── <node-name>-inspector.tsx
└── handles/                          # (OPTIONAL) Custom handles if non-standard topology needed
    └── <node-name>-handle.tsx
```

---

## 2. Adding an Action Node (`kind: "action"`)

Follow these exact 7 steps to add a new Action Node (e.g. `slack`, `resend`, `http-request`).

### Step 1: Register Taxonomy Types
1. Open `features/workflows/system/types/taxonomy.ts`:
   - If adding to an **existing App category**, add the node ID to `AppNodeId`:
     ```typescript
     export type AppNodeId =
       | ...
       | "my-action"
     ```
   - If adding a **new App category**, also add the category ID to `AppCategoryId`:
     ```typescript
     export type AppCategoryId =
       | ...
       | "my-app"
     ```
   - If adding a **Core node**, add to `CoreNodeId`.
2. Open `features/workflows/system/types/runtime.ts`:
   - Add the node ID string to the `ActionNodeType` type union:
     ```typescript
     export type ActionNodeType = {
       [K in NodeType]: K extends
         | ...
         | "my-action"
         ? K
         : never
     }[NodeType]
     ```

### Step 2: Create the Executor Function
Create `features/workflows/system/suites/apps/categories/<category-id>/executors/<node-name>.ts`:
- Export an async function taking a typed arguments object.
- Sanitize string inputs (strip zero-width spaces: `.trim().replace(/[\u200B\uFEFF\u00A0]/g, "")`).
- Retrieve API keys and tokens from the organization's encrypted vault (`secrets.MY_API_KEY`). **Never** read `process.env` in executors!
- Throw descriptive `Error` instances on failure (the Trigger.dev runner catches these, logs step failure, and highlights the canvas node in red).
- Return a serializable JSON object matching the outputs defined in the manifest.

**Reference Example (`executors/slack.ts`)**:
```typescript
export async function sendSlackMessage({
  webhookUrl,
  content,
  username,
}: {
  webhookUrl: string
  content: string
  username?: string
}) {
  if (!webhookUrl || !webhookUrl.trim()) {
    throw new Error("Slack node: Webhook URL is required")
  }
  if (!content || !content.trim()) {
    throw new Error("Slack node: Message content is required")
  }

  const cleanUrl = webhookUrl.trim().replace(/[\u200B\uFEFF\u00A0]/g, "")
  const cleanContent = content.trim()

  const response = await fetch(cleanUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: cleanContent }),
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => "")
    throw new Error(`Slack webhook failed with status ${response.status}: ${errorText.slice(0, 300)}`)
  }

  return {
    success: true,
    messageContent: cleanContent,
  }
}
```

### Step 3: Create the Node Module
Create `features/workflows/system/suites/apps/categories/<category-id>/nodes/<node-name>.ts`:
- Export a typed `ActionNodeModule<"my-action">`.
- Set `manifest`:
  - `id`: Unique node ID matching `ActionNodeType`.
  - `suiteId`: `"apps"` (or `"core"` / `"flow"`).
  - `categoryId`: Parent category ID (e.g. `"slack"`).
  - `kind`: `"action"`.
  - `label`: Human-readable name.
  - `description`: Action summary.
  - `accent`: Tailwind background + text class (e.g. `"bg-[#4A154B] text-white"`).
  - `fields`: Array of `NodeField` (`key`, `label`, `placeholder`, `multiline`, `required`, `options`). If `options` is supplied, the inspector automatically renders a shadcn `Select` dropdown.
  - `outputs`: Array of `NodeOutput` (`path`, `label`) that downstream nodes can reference using tokens (e.g. `{{ Slack · Message Content }}`).
  - `requiredSecrets`: (Optional) Array of vault secret requirements (e.g. `[{ key: "SLACK_BOT_TOKEN", label: "Slack Token" }]`).
- Set `icon`: React component or Lucide icon.
- Set `iconSvgPath`: SVG `<path .../>` string for dynamic variable pills in `TokenInput`.
- Set `handleTopology`: `{ type: "standard" }` (1 target on left, 1 source on right).
- Set `getInitialValues`: Function returning default field values.
- (Optional) `loadCustomInspector`: Lazy loader for a custom inspector (e.g. `() => import("../inspectors/my-inspector")`). If omitted, `DefaultNodeInspector` is used automatically!

**Reference Example (`nodes/slack.ts`)**:
```typescript
import { SlackIcon } from "../icon"
import type { ActionNodeModule } from "../../../../../types/module"

export const slackNodeModule: ActionNodeModule<"slack"> = {
  manifest: {
    id: "slack",
    suiteId: "apps",
    categoryId: "slack",
    kind: "action",
    label: "Slack",
    description: "Sends automated messages to a Slack channel",
    accent: "bg-[#4A154B] text-white",
    fields: [
      {
        key: "webhookUrl",
        label: "Webhook URL",
        placeholder: "https://hooks.slack.com/services/...",
        required: true,
      },
      {
        key: "content",
        label: "Message Content",
        placeholder: "Summary: {{ Extract · Result }}",
        multiline: true,
        required: true,
      },
    ],
    outputs: [
      { path: "messageContent", label: "Message Content" },
      { path: "success", label: "Success" },
    ],
  },
  icon: SlackIcon,
  iconSvgPath: `<path d="..." fill="#36C5F0"/>`,
  handleTopology: { type: "standard" },
  getInitialValues: () => ({
    webhookUrl: "",
    content: "",
  }),
}
```

### Step 4: Register in `systemNodeExecutors`
Open `features/workflows/system/executors/index.ts`:
1. Import the executor function.
2. Add the entry to `systemNodeExecutors`:
   ```typescript
   "my-action": async ({ values, secrets, getStagehand }) =>
     myAction({
       webhookUrl: values.webhookUrl,
       content: values.content,
       apiKey: secrets?.MY_API_KEY,
     }),
   ```
3. The TypeScript compiler enforces `satisfies Record<ActionNodeType, NodeExecutor>`. Forgetting to register an action node will cause compilation to fail immediately.

### Step 5: Export from Suite Index & Catalog
1. In `features/workflows/system/suites/apps/categories/<category-id>/index.ts`:
   - Export the node module and include it in `<category>Nodes`:
     ```typescript
     export const myCategoryNodes: readonly WorkflowNodeModule[] = [myActionNodeModule]
     export { myActionNodeModule }
     ```
2. In `features/workflows/system/suites/apps/index.ts`:
   - Export `<category>Nodes` and include in `appsNodes`.
3. In `features/workflows/system/catalog.ts`:
   - Add `<category>Nodes` to `systemPaletteCatalog` (under `directActions` or `categories[].actions`).

### Step 6: Register in `catalog-metadata.ts`
Open `features/workflows/system/catalog-metadata.ts`:
- If adding a node to an existing category, increment `nodeCount` (e.g. `nodeCount: 2`).
- If adding a **brand-new App category**:
  1. Add category definition in `features/workflows/system/suites/definitions.ts` (`appCategoriesCatalogDefinitions`).
  2. Add entry to `paletteCategoriesMetadata` in `catalog-metadata.ts`:
     ```typescript
     {
       id: appCategoriesCatalogDefinitions["my-app"].id,
       suiteId: "apps",
       label: appCategoriesCatalogDefinitions["my-app"].label,
       description: appCategoriesCatalogDefinitions["my-app"].description,
       icon: appCategoriesCatalogDefinitions["my-app"].icon,
       brandColor: appCategoriesCatalogDefinitions["my-app"].brandColor,
       nodeCount: 1,
     }
     ```
  3. Add entry to `paletteCategoryLoaders` in `catalog-metadata.ts`:
     ```typescript
     "my-app": async () => {
       const m = await import("./suites/apps/categories/my-app")
       return {
         triggers: m.myAppNodes.filter((n) => n.manifest.kind === "trigger"),
         actions: m.myAppNodes.filter((n) => n.manifest.kind === "action"),
       }
     },
     ```

### Step 7: Update Parity Test & Verify
1. Open `features/workflows/system/parity.test.ts`:
   - Add `"my-action"` to `EXPECTED_NODE_KEYS`.
   - Increment `assert.equal(systemNodeKeys.length, <N>)`.
2. Run tests and type check:
   - `npx tsc --noEmit`
   - `npm test`

---

## 3. Adding a Trigger Node (`kind: "trigger"`)

Trigger nodes initiate workflow executions from external events or webhooks (e.g. `start`, `stripe-trigger`, `google-form-trigger`).

### Step 1: Register Taxonomy Types
1. In `features/workflows/system/types/taxonomy.ts`, add the ID to `AppNodeId` (or `FlowNodeId`).

### Step 2: Create the Trigger Node Module
Create `features/workflows/system/suites/apps/categories/<category-id>/nodes/<node-name>.ts`:
- Export a typed `TriggerNodeModule<"my-trigger">`.
- Set `manifest`:
  - `kind`: `"trigger"`
  - `handleTopology`: `{ type: "source-only" }` (Triggers only output downstream data; no incoming target).
  - `fields`: Include a `secret` field (for webhook verification) and instructions.
  - `outputs`: Event payload fields (e.g. `eventType`, `payload`, `customerEmail`).
- Implement `getInitialValues`: Return an object with an auto-generated webhook secret:
  ```typescript
  getInitialValues: () => ({
    secret: `whsec_${crypto.randomUUID().slice(0, 16)}`,
  })
  ```
- Implement `getTriggerFallback`: Return a mock JSON payload used during canvas test runs when no live webhook payload is supplied:
  ```typescript
  getTriggerFallback: (values) => ({
    event: "mock_event",
    data: { id: "test_123" },
  })
  ```
- (Optional) Provide `loadCustomInspector`: To render setup instructions and copyable webhook URL.

### Step 3: Create Webhook Route (`app/api/webhooks/<provider>/route.ts`)
1. Parse query parameters: `workflowId`, `orgId`, `secret`.
2. Load workflow from database and verify secret matches `node.data.values.secret`.
3. Normalize incoming payload to a strongly-typed schema.
4. Dispatch the Trigger.dev task:
   ```typescript
   await tasks.trigger<typeof runWorkflowTask>(
     "run-workflow",
     { workflowId, orgId, triggerData: normalizedData },
     { tags: [`workflow:${workflowId}`, `org:${orgId}`, `trigger:<provider>`] }
   )
   ```

### Step 4: Export and Register
1. Export in category `index.ts` and add to `<category>Nodes`.
2. Register in `catalog.ts` and `catalog-metadata.ts`.
3. Add to `EXPECTED_NODE_KEYS` in `parity.test.ts`.

---

## 4. Custom Inspectors & Custom Handles (Optional Overrides)

The system automatically provides default UI for 90% of nodes:
- **Default Inspector**: If `loadCustomInspector` or `inspectorComponent` is omitted from `BaseNodeModule`, `DefaultNodeInspector` automatically renders all fields declared in `manifest.fields`.
- **Default Handles**: If `handleComponent` is omitted, `DefaultNodeHandles` automatically places target handles on the left and source handles on the right.

### When to Create a Custom Inspector
Create a custom inspector only when you need custom instructions, live credential validation, or complex custom inputs (e.g. code editors, branch rules):
- Create `inspectors/<node>-inspector.tsx` with `"use client"`.
- Wrap `DefaultNodeInspector` or render custom components.
- Export as default (`export default MyInspector`) and register via `loadCustomInspector: () => import("../inspectors/my-inspector")`.
- **Reference Example**: [`SlackInspector`](features/workflows/system/suites/apps/categories/slack/inspectors/slack-inspector.tsx).

### When to Create Custom Handles
Create custom handles only when a node has non-standard routing (e.g. `if` has `true`/`false` outputs, `switch` has dynamic case handles, `loop` has `loop-body` and `done` outputs):
- Create `handles/<node>-handle.tsx`.
- Register via `handleComponent: MyHandleComponent` on the node module.
- **Reference Example**: [`IfNodeHandles`](features/workflows/system/suites/flow/handles/if-handle.tsx).

---

## 5. Secret & Credential Vault Management

Workflows support multi-tenant, encrypted secret storage via the **Credential Vault** (`AES-256-GCM`). Follow these standards when adding nodes that require API keys or external authentication:

### 1. Declaring Secret Fields in Node Manifests
- Declare secret or API key fields with a helpful placeholder demonstrating vault token usage:
  ```typescript
  {
    key: "apiKey",
    label: "API Key",
    placeholder: "e.g. {{ secrets.MY_API_KEY }}",
    required: true,
  }
  ```
- **Do not** hardcode default API keys in `defaultValue`.
- (Optional) Use `requiredSecrets` in manifest:
  ```typescript
  requiredSecrets: [
    { key: "RESEND_API_KEY", label: "Resend API Key", description: "Required to dispatch transactional emails" }
  ]
  ```

### 2. Resolving Secrets in Executors
- Upstream template variables (e.g. `{{ secrets.STRIPE_SECRET_KEY }}`) are automatically decrypted and interpolated by the runner before the executor is called.
- Decrypted vault secrets are also passed in the `secrets` argument: `ctx.secrets?.RESEND_API_KEY`.
- Always validate that the key is non-empty and throw a descriptive error when missing:
  ```typescript
  const apiKey = (values.apiKey ?? secrets?.MY_API_KEY ?? "").trim().replace(/[\u200B\uFEFF\u00A0]/g, "")
  if (!apiKey) {
    throw new Error(
      "Missing API key. Please insert a secret from your Credential Vault (e.g. {{ secrets.MY_API_KEY }})."
    )
  }
  ```

### 3. Automatic Environment Variable Injection in Sandboxes
- In code execution sandboxes (`js-code` or `python-code`), all decrypted organization vault secrets are automatically injected as sandbox environment variables (`process.env.KEY` in JS / `os.environ["KEY"]` in Python).

### 4. Pre-Flight Validation Engine (`features/workflows/lib/validate-graph.ts`)
- The pre-flight `validateGraph(graph, availableSecretKeys)` engine scans all input strings for `{{ secrets.KEY }}` tokens.
- If a workflow references a secret that was deleted or does not exist in the active organization, execution is halted with an informative alert before background tasks are dispatched.

---

## 6. Strict Guardrails & Anti-Patterns (What NOT to Do)

- ❌ **DO NOT touch `run-workflow.ts` for action nodes**: The Trigger.dev execution runner automatically looks up and invokes `systemNodeExecutors[node.data.type]`. Adding an action node requires **zero** changes to `run-workflow.ts`.
- ❌ **DO NOT modify `step-node.tsx` or `canvas.tsx`**: The canvas step node is 100% generic and reads everything dynamically from `nodeRegistry` and `getSystemNodeHandle`. Never hardcode `if (type === "my-action")` in canvas components.
- ❌ **DO NOT modify `palette.tsx` or `right-sidebar.tsx`**: The Right Sidebar Command Palette reads pure metadata and dynamic chunk loaders from `catalog-metadata.ts`. Never hardcode node lists in the palette component.
- ❌ **DO NOT edit `token-input.tsx` for new node icons**: Dynamic token pills obtain their icon SVG directly from `iconSvgPath` on the node module via `systemNodeIconSvgPaths` in `registry.ts`.
- ❌ **DO NOT touch `AGENTS.md`**: `AGENTS.md` is a protected file.
- ❌ **DO NOT fallback to server `process.env` in action executors**: Never write `process.env.RESEND_API_KEY` inside action executors. All third-party credentials must be provided via node values or the organization's encrypted vault (`{{ secrets.KEY }}` / `secrets?.KEY`) to maintain multi-tenant organization isolation.
- ❌ **DO NOT create custom modal dialogs (`<Dialog>`) or form popups for node configuration**: Node properties are managed exclusively through the Right Sidebar Inspector (`DefaultNodeInspector` or a custom inspector declared on the module).
- ❌ **DO NOT use native HTML `<select>` / `<option>` or `<NativeSelect>`**: Always use shadcn/ui Select (`@/components/ui/select`).
- ❌ **DO NOT perform manual token substitution inside action executors**: Upstream template variables (e.g. `{{ Step 1 · URL }}` and `{{ secrets.KEY }}`) are already resolved by the runner before your executor function is called.
- ❌ **DO NOT silently catch and swallow errors in executors**: Always let errors bubble up or throw descriptive `Error` instances (e.g. `throw new Error("HTTP 404: Not Found")`). This ensures Trigger.dev logs the failure, marks the step as failed, and renders the red failure boundary on the canvas.
- ❌ **DO NOT bypass the `satisfies Record<ActionNodeType, NodeExecutor>` type contract**: Never use `as any` in `executors/index.ts`. The type contract guarantees every action node in `ActionNodeType` has a corresponding executor.
- ❌ **DO NOT use ad-hoc `any` for third-party SDK payloads**: Always import and use official SDK types to maintain compile-time safety.
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

# E2B — don't trust training data

This project uses E2B (`@e2b/code-interpreter` / `@e2b/desktop` / E2B SDK) for
secure cloud sandboxes and multi-language code execution (Python, JavaScript/TypeScript,
R, Bash). Its APIs, SDK methods (e.g., `Sandbox.create()`, `runCode()`, filesystem
methods, streaming, templates, and lifecycle management) evolve rapidly and may
differ from your training data. Before writing or changing any E2B integration
code, fetch and consult the official LLM docs index at https://docs.e2b.dev/llms.txt
and follow the linked documentation pages relevant to what you're building. Do
not rely on memory for SDK method names, parameter shapes, lifecycle hooks, or
execution patterns.

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
