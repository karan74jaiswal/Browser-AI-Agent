export default function DiscordInspector() {
  return (
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
  )
}
