import type { NextConfig } from "next"
import { withSentryConfig } from "@sentry/nextjs"

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/template",
        destination: "/templates",
        permanent: true,
      },
    ]
  },
}

export default withSentryConfig(nextConfig, {
  org: "personal-0e7",
  project: "browser-ai-agent",

  // Source map upload auth token (set SENTRY_AUTH_TOKEN for production builds)
  authToken: process.env.SENTRY_AUTH_TOKEN,

  // Upload a wider set of client source files for better stack traces
  widenClientFileUpload: true,

  // Proxy events through the app to bypass ad-blockers
  tunnelRoute: "/monitoring",

  // Suppress non-CI build output
  silent: !process.env.CI,
})
