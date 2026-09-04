"use client"

import { DefaultNodeInspector } from "@/features/workflows/system/inspectors/default-inspector"
import type { NodeInspectorProps } from "@/features/workflows/system/types/inspectors"

export function DiscordInspector(props: NodeInspectorProps) {
  return (
    <div className="flex flex-col gap-3">
      <DefaultNodeInspector {...props} />
      <div className="rounded-md border border-border bg-muted/30 p-2.5 text-xs text-muted-foreground">
        <div className="mb-1.5 font-semibold text-foreground">
          How to get a Discord Webhook URL
        </div>
        <ol className="list-inside list-decimal space-y-1 text-[11px] leading-relaxed">
          <li>Open Discord and go to your server</li>
          <li>
            Hover over your target channel &rarr; click <b>Edit Channel (⚙️)</b>
          </li>
          <li>
            Navigate to <b>Integrations</b> &rarr; <b>Webhooks</b>
          </li>
          <li>
            Click <b>New Webhook</b> (or select an existing one)
          </li>
          <li>
            Click <b>Copy Webhook URL</b> and paste it into the Webhook URL field
            above
          </li>
        </ol>
      </div>
    </div>
  )
}

export default DiscordInspector

