import type { Metadata } from "next"
import { PricingTable } from "@clerk/nextjs"

export const metadata: Metadata = {
  title: "Plans & Pricing",
  description: "Choose a plan that fits your organization's workflow automation needs.",
}

export default function PricingPage() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-start overflow-y-auto p-6 md:p-10">
      <div className="w-full max-w-5xl space-y-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Plans &amp; Pricing
          </h1>
          <p className="text-sm text-muted-foreground">
            Choose a plan that fits your organization&apos;s workflow automation
            needs.
          </p>
        </div>
        <div className="w-full">
          <PricingTable
            for="organization"
            newSubscriptionRedirectUrl="/pricing"
          />
        </div>
      </div>
    </div>
  )
}
