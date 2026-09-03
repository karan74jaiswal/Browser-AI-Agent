import { createRouteMatcher } from "@clerk/nextjs/server"

export const PUBLIC_ROUTE_PATTERNS = [
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/choose-organization(.*)",
  "/sso-callback(.*)",
  "/api/webhooks(.*)",
  "/templates(.*)",
  "/pricing(.*)",
] as const

export const isPublicRoute = createRouteMatcher([...PUBLIC_ROUTE_PATTERNS])
