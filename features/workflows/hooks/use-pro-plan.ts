"use client"

import { useCallback } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@clerk/nextjs"
import {
  nodeRegistry,
  type NodeDefinition,
  type NodeType,
} from "@/features/workflows/system"
import {
  getWorkflowLimit,
  PLAN_LIMITS,
} from "@/features/workflows/lib/plan-limits"

export interface UseProPlanReturn {
  /** Whether the active organization has an active Pro subscription */
  isPro: boolean
  /** Whether Clerk auth state has finished loading */
  isLoaded: boolean
  /** Whether Clerk auth state is currently loading */
  isLoading: boolean
  /** Active organization ID, if any */
  orgId: string | null | undefined
  /** Maximum number of workflows allowed on the active plan */
  maxWorkflows: number
  /** Navigates the user to the organization pricing page */
  redirectToPricing: () => void
  /** URL to the pricing page */
  pricingUrl: string
  /** Raw `has` authorization helper from Clerk `useAuth` */
  has: ReturnType<typeof useAuth>["has"]
  /** Checks if the active organization has access to a given node definition or type based on its registry requirements */
  canAccessNode: (nodeOrType: NodeDefinition | NodeType | string) => boolean
  /** Checks if a node definition or type is locked for the active organization */
  isNodeLocked: (nodeOrType: NodeDefinition | NodeType | string) => boolean
  /** Checks if the active organization has a specific plan */
  hasPlan: (plan: string) => boolean
  /** Checks if the active organization has a specific feature entitlement */
  hasFeature: (feature: string) => boolean
  /** Helper to get workflow limit for any plan */
  getWorkflowLimit: (plan?: string | null) => number
}

/**
 * Hook to inspect whether the currently active organization has access to specific plans,
 * features, or node definitions, and provide helper functions to navigate to pricing for upgrades.
 */
export function useProPlan(): UseProPlanReturn {
  const { has, isLoaded, orgId } = useAuth()
  const router = useRouter()

  const hasPlan = useCallback(
    (plan: string): boolean => {
      if (!isLoaded) return false
      return Boolean(has?.({ plan }) || has?.({ plan: `org:${plan}` }))
    },
    [has, isLoaded]
  )

  const hasFeature = useCallback(
    (feature: string): boolean => {
      if (!isLoaded) return false
      return Boolean(has?.({ feature }))
    },
    [has, isLoaded]
  )

  const isPro = isLoaded ? hasPlan("pro") : false
  const maxWorkflows = isPro
    ? PLAN_LIMITS.pro.maxWorkflows
    : PLAN_LIMITS.free.maxWorkflows

  const canAccessNode = useCallback(
    (nodeOrType: NodeDefinition | NodeType | string): boolean => {
      if (!isLoaded) return false

      const def: NodeDefinition | undefined =
        typeof nodeOrType === "string"
          ? nodeRegistry[nodeOrType as NodeType]
          : nodeOrType

      if (!def) return true

      if (def.requiredFeature && !hasFeature(def.requiredFeature)) {
        return false
      }

      if (def.requiredPlan && !hasPlan(def.requiredPlan)) {
        return false
      }

      return true
    },
    [isLoaded, hasFeature, hasPlan]
  )

  const isNodeLocked = useCallback(
    (nodeOrType: NodeDefinition | NodeType | string): boolean => {
      return !canAccessNode(nodeOrType)
    },
    [canAccessNode]
  )

  const redirectToPricing = useCallback(() => {
    router.push("/pricing")
  }, [router])

  return {
    isPro,
    isLoaded,
    isLoading: !isLoaded,
    orgId,
    maxWorkflows,
    redirectToPricing,
    pricingUrl: "/pricing",
    has,
    canAccessNode,
    isNodeLocked,
    hasPlan,
    hasFeature,
    getWorkflowLimit,
  }
}

export const usePro = useProPlan
export const usePlanGate = useProPlan
