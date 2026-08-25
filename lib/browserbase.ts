import { Browserbase } from "@browserbasehq/sdk"

/**
 * Centralized Browserbase REST SDK client.
 * Safe for Next.js App Router (API routes, Server Actions, Server Components)
 * and Trigger.dev tasks.
 */
export const browserbase = new Browserbase({
  apiKey: process.env.BROWSERBASE_API_KEY || "",
})
