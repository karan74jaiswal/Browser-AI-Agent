import { NextRequest, NextResponse } from "next/server"
import { clerkClient } from "@clerk/nextjs/server"
import { tasks } from "@trigger.dev/sdk"
import * as Sentry from "@sentry/nextjs"
import { getWorkflow } from "@/features/workflows/data"
import type { runWorkflowTask } from "@/features/workflows/tasks/run-workflow"
import type Stripe from "stripe"

export interface NormalizedStripeEventData {
  amount: string
  currency: string
  customerEmail: string
  customerId: string
  eventType: Stripe.Event.Type | string
  status: string
  paymentIntentId: string
  rawEvent: Stripe.Event
}

function normalizeStripeEvent(event: Stripe.Event): NormalizedStripeEventData {
  const eventType = event.type
  let amount = ""
  let currency = "USD"
  let customerEmail = ""
  let customerId = ""
  let status = "succeeded"
  let paymentIntentId = ""

  switch (event.type) {
    case "payment_intent.succeeded":
    case "payment_intent.created":
    case "payment_intent.payment_failed":
    case "payment_intent.canceled":
    case "payment_intent.processing":
    case "payment_intent.requires_action": {
      const pi = event.data.object as Stripe.PaymentIntent
      amount = (pi.amount / 100).toFixed(2)
      currency = pi.currency.toUpperCase()
      status = pi.status
      paymentIntentId = pi.id
      customerId =
        typeof pi.customer === "string"
          ? pi.customer
          : pi.customer?.id ?? ""
      customerEmail = pi.receipt_email ?? ""
      break
    }

    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded":
    case "checkout.session.async_payment_failed":
    case "checkout.session.expired": {
      const session = event.data.object as Stripe.Checkout.Session
      if (session.amount_total !== null && session.amount_total !== undefined) {
        amount = (session.amount_total / 100).toFixed(2)
      }
      currency = session.currency?.toUpperCase() ?? "USD"
      status = session.status ?? session.payment_status ?? "complete"
      customerId =
        typeof session.customer === "string"
          ? session.customer
          : session.customer?.id ?? ""
      customerEmail =
        session.customer_details?.email ?? session.customer_email ?? ""
      paymentIntentId =
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.payment_intent?.id ?? ""
      break
    }

    case "charge.succeeded":
    case "charge.failed":
    case "charge.refunded":
    case "charge.updated":
    case "charge.captured": {
      const charge = event.data.object as Stripe.Charge
      amount = (charge.amount / 100).toFixed(2)
      currency = charge.currency.toUpperCase()
      status = charge.status
      customerId =
        typeof charge.customer === "string"
          ? charge.customer
          : charge.customer?.id ?? ""
      customerEmail =
        charge.billing_details?.email ?? charge.receipt_email ?? ""
      paymentIntentId =
        typeof charge.payment_intent === "string"
          ? charge.payment_intent
          : charge.payment_intent?.id ?? ""
      break
    }

    case "invoice.payment_succeeded":
    case "invoice.paid":
    case "invoice.created":
    case "invoice.payment_failed":
    case "invoice.finalized": {
      const invoice = event.data.object as Stripe.Invoice
      if (invoice.amount_paid !== null && invoice.amount_paid !== undefined) {
        amount = (invoice.amount_paid / 100).toFixed(2)
      } else if (invoice.total !== null && invoice.total !== undefined) {
        amount = (invoice.total / 100).toFixed(2)
      }
      currency = invoice.currency?.toUpperCase() ?? "USD"
      status = invoice.status ?? "paid"
      customerId =
        typeof invoice.customer === "string"
          ? invoice.customer
          : invoice.customer?.id ?? ""
      customerEmail = invoice.customer_email ?? ""
      paymentIntentId = invoice.id
      break
    }

    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
    case "customer.subscription.paused":
    case "customer.subscription.resumed": {
      const sub = event.data.object as Stripe.Subscription
      status = sub.status
      customerId =
        typeof sub.customer === "string"
          ? sub.customer
          : sub.customer?.id ?? ""
      const firstItem = sub.items?.data?.[0]
      if (
        firstItem?.price?.unit_amount !== null &&
        firstItem?.price?.unit_amount !== undefined
      ) {
        amount = (firstItem.price.unit_amount / 100).toFixed(2)
        currency = firstItem.price.currency?.toUpperCase() ?? "USD"
      }
      break
    }

    default: {
      const generic = event.data.object as Stripe.Event.Data.Object
      if (generic && typeof generic === "object") {
        if (
          "amount" in generic &&
          typeof (generic as { amount?: number }).amount === "number"
        ) {
          amount = (
            (generic as { amount: number }).amount / 100
          ).toFixed(2)
        }
        if (
          "currency" in generic &&
          typeof (generic as { currency?: string }).currency === "string"
        ) {
          currency = (
            generic as { currency: string }
          ).currency.toUpperCase()
        }
        if (
          "customer" in generic &&
          typeof (generic as { customer?: string }).customer === "string"
        ) {
          customerId = (generic as { customer: string }).customer
        }
        if (
          "status" in generic &&
          typeof (generic as { status?: string }).status === "string"
        ) {
          status = (generic as { status: string }).status
        }
      }
      break
    }
  }

  return {
    amount,
    currency,
    customerEmail,
    customerId,
    eventType,
    status,
    paymentIntentId,
    rawEvent: event,
  }
}

export async function POST(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const workflowId = searchParams.get("workflowId")
    const orgId = searchParams.get("orgId")
    const secret = searchParams.get("secret")

    if (!workflowId || !orgId) {
      return NextResponse.json(
        { error: "Missing required workflowId or orgId query parameters" },
        { status: 400 }
      )
    }

    if (!secret) {
      return NextResponse.json(
        { error: "Missing required secret authentication token" },
        { status: 401 }
      )
    }

    // 1. Fetch and verify the workflow scoped to the organization
    const workflow = await getWorkflow(orgId, workflowId)
    if (!workflow) {
      return NextResponse.json(
        { error: "Workflow not found for the specified organization" },
        { status: 404 }
      )
    }

    // 2. Locate the Stripe trigger node on the canvas
    const triggerNode = workflow.graph?.nodes.find(
      (node) => node.data?.type === "stripe-trigger"
    )

    if (!triggerNode) {
      return NextResponse.json(
        { error: "This workflow does not contain an active Stripe trigger" },
        { status: 400 }
      )
    }

    // 3. Verify the secret token
    const expectedSecret = triggerNode.data.values?.secret
    if (!expectedSecret || expectedSecret !== secret) {
      return NextResponse.json(
        { error: "Unauthorized: Invalid secret token" },
        { status: 401 }
      )
    }

    // 4. Verify Organization exists in Clerk
    const client = await clerkClient()
    const org = await client.organizations.getOrganization({
      organizationId: orgId,
    })

    if (!org) {
      return NextResponse.json(
        { error: "Organization not found for the specified orgId" },
        { status: 404 }
      )
    }

    // 5. Parse the incoming Stripe Event payload
    const rawBody = await req.json().catch(() => null)
    if (!rawBody || typeof rawBody !== "object" || !("type" in rawBody)) {
      return NextResponse.json(
        { error: "Invalid Stripe event payload: missing event type" },
        { status: 400 }
      )
    }

    const event = rawBody as Stripe.Event
    const configuredEventType =
      triggerNode.data.values?.eventType || "payment_intent.succeeded"

    // 6. Check event type filter
    if (configuredEventType !== "all" && event.type !== configuredEventType) {
      return NextResponse.json({
        success: true,
        ignored: true,
        message: `Event '${event.type}' received but ignored (configured filter is '${configuredEventType}')`,
      })
    }

    // 7. Normalize the event data for downstream nodes
    const normalizedData = normalizeStripeEvent(event)

    Sentry.logger.info("Stripe webhook received", {
      "workflow.id": workflowId,
      "org.id": orgId,
      eventType: event.type,
      amount: normalizedData.amount,
      customerEmail: normalizedData.customerEmail,
    })

    // 8. Trigger the background workflow run via Trigger.dev
    const handle = await tasks.trigger<typeof runWorkflowTask>(
      "run-workflow",
      {
        workflowId: workflow.id,
        orgId: workflow.orgId,
        triggerData: normalizedData as unknown as Record<string, unknown>,
      },
      {
        tags: [
          `workflow:${workflow.id}`,
          `org:${workflow.orgId}`,
          `trigger:stripe`,
          `stripe:event:${event.type}`,
        ],
      }
    )

    return NextResponse.json({
      success: true,
      runId: handle.id,
      eventType: event.type,
      message: `Workflow triggered for Stripe event: ${event.type}`,
    })
  } catch (error) {
    Sentry.captureException(error)
    const message =
      error instanceof Error ? error.message : "Internal server error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
