export interface PlanLimit {
  name: string
  maxWorkflows: number
}

export const PLAN_LIMITS: Record<string, PlanLimit> = {
  free: {
    name: "Free",
    maxWorkflows: 5,
  },
  pro: {
    name: "Pro",
    maxWorkflows: 20,
  },
  enterprise: {
    name: "Enterprise",
    maxWorkflows: Infinity,
  },
}

/**
 * Returns the maximum number of workflows allowed for a given plan slug.
 */
export function getWorkflowLimit(plan?: string | null): number {
  if (!plan) return PLAN_LIMITS.free.maxWorkflows
  const normalized = plan.replace(/^org:/, "").toLowerCase()
  return PLAN_LIMITS[normalized]?.maxWorkflows ?? PLAN_LIMITS.free.maxWorkflows
}
