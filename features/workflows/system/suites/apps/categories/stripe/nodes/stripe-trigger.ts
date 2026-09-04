import { CreditCard } from "lucide-react"
import type { TriggerNodeModule } from "../../../../../types/module"

export const stripeTriggerNodeModule: TriggerNodeModule<"stripe-trigger"> = {
  manifest: {
    id: "stripe-trigger",
    suiteId: "apps",
    categoryId: "stripe",
    kind: "trigger",
    label: "Stripe",
    description: "Listens for real-time Stripe billing, payment, and subscription webhooks",
    accent: "bg-[#635BFF] text-white",
    requiredPlan: "pro",
    fields: [
      {
        key: "eventType",
        label: "Event Type",
        defaultValue: "payment_intent.succeeded",
        options: [
          {
            label: "Payment Succeeded (payment_intent.succeeded)",
            value: "payment_intent.succeeded",
          },
          {
            label: "Checkout Session Completed (checkout.session.completed)",
            value: "checkout.session.completed",
          },
          {
            label: "Subscription Created (customer.subscription.created)",
            value: "customer.subscription.created",
          },
          {
            label: "Invoice Paid (invoice.payment_succeeded)",
            value: "invoice.payment_succeeded",
          },
          {
            label: "Charge Succeeded (charge.succeeded)",
            value: "charge.succeeded",
          },
          {
            label: "All Events (Listen to any Stripe event)",
            value: "all",
          },
        ],
      },
    ],
    outputs: [
      { path: "amount", label: "Amount" },
      { path: "currency", label: "Currency" },
      { path: "customerEmail", label: "Customer Email" },
      { path: "customerId", label: "Customer ID" },
      { path: "eventType", label: "Event Type" },
      { path: "status", label: "Payment Status" },
      { path: "paymentIntentId", label: "Payment Intent ID" },
      { path: "rawEvent", label: "Raw Event Data" },
    ],
  },
  icon: CreditCard,
  iconSvgPath: `<rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/>`,
  handleTopology: { type: "standard" },
  loadCustomInspector: () =>
    import("@/features/workflows/components/rightSidebar/stripe-trigger-inspector"),
  getInitialValues: () => ({
    eventType: "payment_intent.succeeded",
    secret: `whsec_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`,
  }),
  getTriggerFallback: (values) =>
    values && Object.keys(values).length > 1 && values.paymentIntentId
      ? values
      : {
          amount: "49.00",
          currency: "USD",
          customerEmail: "customer@example.com",
          customerId: "cus_sample12345",
          eventType: values?.eventType || "payment_intent.succeeded",
          status: "succeeded",
          paymentIntentId: "pi_sample12345",
          rawEvent: {
            id: "evt_sample12345",
            type: values?.eventType || "payment_intent.succeeded",
          },
        },
}
