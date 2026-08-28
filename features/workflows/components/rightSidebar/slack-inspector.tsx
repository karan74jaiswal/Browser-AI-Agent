export default function SlackInspector() {
  return (
    <div className="rounded-md border border-border bg-muted/30 p-2.5 text-xs text-muted-foreground">
      <div className="mb-1.5 font-semibold text-foreground">
        How to get a Slack Webhook URL
      </div>
      <ol className="list-inside list-decimal space-y-1 text-[11px] leading-relaxed">
        <li>
          Go to <b>api.slack.com/apps</b> and select or create your App
        </li>
        <li>
          Click <b>Incoming Webhooks</b> in the left sidebar and toggle it{" "}
          <b>On</b>
        </li>
        <li>
          Click <b>Add New Webhook to Workspace</b> at the bottom
        </li>
        <li>
          Choose the channel you want messages posted to &rarr; <b>Allow</b>
        </li>
        <li>
          Copy the generated <b>Webhook URL</b> and paste it into the Webhook
          URL field above
        </li>
      </ol>
    </div>
  )
}
