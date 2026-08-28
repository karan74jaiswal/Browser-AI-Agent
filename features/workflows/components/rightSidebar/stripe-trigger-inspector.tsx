"use client"
import { useOrganization } from "@clerk/nextjs"
import { useReactFlow } from "@xyflow/react"
import { Check, Copy, RefreshCw, Terminal } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { toast } from "sonner"
import { StepNodeType } from "../../nodes/node-registry"

export default function StripeTriggerInspector({
  node,
  workflowId,
}: {
  node: StepNodeType
  workflowId: string
}) {
  const { updateNodeData } = useReactFlow<StepNodeType>()
  const { organization } = useOrganization()
  const [copiedUrl, setCopiedUrl] = useState(false)
  const [copiedCli, setCopiedCli] = useState(false)

  const orgId = organization?.id || ""
  const secret = node.data.values?.secret || ""

  const baseUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

  const webhookUrl = `${baseUrl}/api/webhooks/stripe?workflowId=${workflowId}&orgId=${orgId}&secret=${secret}`
  const cliCommand = `stripe listen --forward-to "${webhookUrl}"`

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(webhookUrl)
      setCopiedUrl(true)
      toast.success("Stripe Webhook URL copied to clipboard")
      setTimeout(() => setCopiedUrl(false), 2000)
    } catch {
      toast.error("Failed to copy URL")
    }
  }

  const handleCopyCli = async () => {
    try {
      await navigator.clipboard.writeText(cliCommand)
      setCopiedCli(true)
      toast.success("Stripe CLI command copied to clipboard")
      setTimeout(() => setCopiedCli(false), 2000)
    } catch {
      toast.error("Failed to copy CLI command")
    }
  }

  const handleRegenerateSecret = () => {
    const newSecret = `whsec_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`
    updateNodeData(node.id, {
      values: { ...node.data.values, secret: newSecret },
    })
    toast.success("Webhook secret regenerated")
  }

  return (
    <div className="flex flex-col gap-3 border-t border-border pt-3">
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs font-medium">Webhook URL</Label>
        <div className="flex items-center gap-1.5">
          <Input
            readOnly
            value={webhookUrl}
            className="h-8 font-mono text-[11px] text-muted-foreground"
          />
          <Button
            type="button"
            size="icon"
            variant="outline"
            className="size-8 shrink-0"
            onClick={handleCopyUrl}
            title="Copy Webhook URL"
          >
            {copiedUrl ? (
              <Check className="size-3.5 text-emerald-500" />
            ) : (
              <Copy className="size-3.5" />
            )}
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-[11px] text-muted-foreground">
          Webhook Secret
        </span>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={handleRegenerateSecret}
          className="h-6 gap-1 px-1.5 text-[11px] text-muted-foreground hover:text-foreground"
        >
          <RefreshCw className="size-3" />
          <span>Regenerate</span>
        </Button>
      </div>

      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={handleCopyCli}
        className="w-full cursor-pointer gap-2 text-xs"
      >
        {copiedCli ? (
          <Check className="size-3.5 text-emerald-500" />
        ) : (
          <Terminal className="size-3.5" />
        )}
        <span>Copy Stripe CLI Test Command</span>
      </Button>

      <div className="rounded-md border border-border bg-muted/30 p-2.5 text-xs text-muted-foreground">
        <div className="mb-1.5 font-semibold text-foreground">
          Setup Instructions
        </div>
        <ol className="list-inside list-decimal space-y-1 text-[11px] leading-relaxed">
          <li>
            Open <b>Stripe Dashboard</b> &rarr; <b>Developers</b> &rarr;{" "}
            <b>Webhooks</b>
          </li>
          <li>
            Click <b>Add destination / Add endpoint</b>
          </li>
          <li>Paste the Webhook URL above</li>
          <li>
            Select the event(s) to listen for (e.g.{" "}
            <code>payment_intent.succeeded</code>)
          </li>
          <li>Save the endpoint</li>
        </ol>
      </div>
    </div>
  )
}
