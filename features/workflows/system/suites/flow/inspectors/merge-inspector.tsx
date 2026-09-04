"use client"

import { GitMerge, Layers, ListFilter, Zap } from "lucide-react"
import { DefaultNodeInspector } from "@/features/workflows/system/inspectors/default-inspector"
import type { NodeInspectorProps } from "@/features/workflows/system/types/inspectors"

export function MergeInspector(props: NodeInspectorProps) {
  return (
    <div className="flex flex-col gap-3">
      <DefaultNodeInspector {...props} />
      <div className="flex flex-col gap-2 rounded-md border border-border bg-muted/30 p-2.5 text-xs text-muted-foreground">
      <div className="flex items-center gap-1.5 font-medium text-foreground">
        <GitMerge className="size-3.5 text-indigo-500" />
        <span>Merge Modes Guide</span>
      </div>
      <div className="flex flex-col gap-2 pt-0.5 text-[11px] leading-relaxed">
        <div className="flex items-start gap-1.5">
          <Layers className="mt-0.5 size-3.5 shrink-0 text-indigo-500" />
          <div>
            <span className="font-semibold text-foreground">
              Combine All Active:
            </span>{" "}
            Waits for all parallel steps to finish and bundles their outputs
            into a map (
            <code className="rounded bg-muted px-1 text-[10px] text-foreground">
              &#123;&#123; Merge.merged.&lt;nodeId&gt; &#125;&#125;
            </code>
            ).
          </div>
        </div>
        <div className="flex items-start gap-1.5">
          <ListFilter className="mt-0.5 size-3.5 shrink-0 text-indigo-500" />
          <div>
            <span className="font-semibold text-foreground">
              Flatten into Array:
            </span>{" "}
            Flattens lists and items from all incoming branches into a single
            array (
            <code className="rounded bg-muted px-1 text-[10px] text-foreground">
              &#123;&#123; Merge.items &#125;&#125;
            </code>
            ).
          </div>
        </div>
        <div className="flex items-start gap-1.5">
          <Zap className="mt-0.5 size-3.5 shrink-0 text-amber-500" />
          <div>
            <span className="font-semibold text-foreground">
              Pass-Through / Winner:
            </span>{" "}
            Ideal for{" "}
            <code className="rounded bg-muted px-1 text-[10px] text-foreground">
              If
            </code>{" "}
            and{" "}
            <code className="rounded bg-muted px-1 text-[10px] text-foreground">
              Switch
            </code>{" "}
            paths. Forwards whichever branch executed as{" "}
            <code className="rounded bg-muted px-1 text-[10px] text-foreground">
              &#123;&#123; Merge.result &#125;&#125;
            </code>
            .
          </div>
        </div>
      </div>
    </div>
  </div>
  )
}

export default MergeInspector
