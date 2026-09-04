"use client"
import { useAuth } from "@clerk/nextjs"
import { useReactFlow } from "@xyflow/react"
import { Check, Copy, RefreshCw, Code2 } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import { generateGoogleFormScript } from "@/features/workflows/lib/google-form-script"
import { type StepNodeType } from "@/features/workflows/system"
import { DefaultNodeInspector } from "@/features/workflows/system/inspectors/default-inspector"
import type { NodeInspectorProps } from "@/features/workflows/system/types/inspectors"

export function GoogleFormTriggerInspector(props: NodeInspectorProps) {
  const { node, workflowId } = props
  const { orgId } = useAuth()
  const { updateNodeData } = useReactFlow<StepNodeType>()
  const [copiedUrl, setCopiedUrl] = useState(false)
  const [copiedScript, setCopiedScript] = useState(false)

  // Ensure secret token is generated
  const secret = node.data.values?.secret || ""
  useEffect(() => {
    if (!node.data.values?.secret) {
      const generated = `whsec_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`
      updateNodeData(node.id, {
        values: { ...node.data.values, secret: generated },
      })
    }
  }, [node.id, node.data.values, updateNodeData])

  const handleRegenerateSecret = () => {
    const generated = `whsec_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`
    updateNodeData(node.id, {
      values: { ...node.data.values, secret: generated },
    })
    toast.success("Webhook secret regenerated")
  }

  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL || ""

  const webhookUrl = `${origin}/api/webhooks/google-form?orgId=${orgId ?? ""}&workflowId=${workflowId}&secret=${secret}`

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(webhookUrl)
      setCopiedUrl(true)
      toast.success("Webhook URL copied to clipboard")
      setTimeout(() => setCopiedUrl(false), 2000)
    } catch {
      toast.error("Failed to copy URL")
    }
  }

  const handleCopyScript = async () => {
    try {
      const script = generateGoogleFormScript(webhookUrl)
      await navigator.clipboard.writeText(script)
      setCopiedScript(true)
      toast.success("Google Apps Script copied to clipboard")
      setTimeout(() => setCopiedScript(false), 2000)
    } catch {
      toast.error("Failed to copy script")
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <DefaultNodeInspector {...props} />
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
        onClick={handleCopyScript}
        className="w-full gap-2 text-xs"
      >
        {copiedScript ? (
          <Check className="size-3.5 text-emerald-500" />
        ) : (
          <Code2 className="size-3.5" />
        )}
        <span>Copy Google Apps Script</span>
      </Button>

      <div className="rounded-md border border-border bg-muted/30 p-2.5 text-xs text-muted-foreground">
        <div className="mb-1.5 font-semibold text-foreground">
          Setup Instructions
        </div>
        <ol className="list-inside list-decimal space-y-1 text-[11px] leading-relaxed">
          <li>Open your form on Google Forms</li>
          <li>
            Click the three dots (&vellip;) menu &rarr; <b>Apps Script</b>
          </li>
          <li>
            Paste the copied script and click <b>Save</b>
          </li>
          <li>
            Click <b>Triggers</b> (alarm icon) &rarr; <b>Add Trigger</b>
          </li>
          <li>
            Select &quot;On form submit&quot; &rarr; <b>Save</b>
          </li>
        </ol>
      </div>
    </div>
  </div>
  )
}

export default GoogleFormTriggerInspector

