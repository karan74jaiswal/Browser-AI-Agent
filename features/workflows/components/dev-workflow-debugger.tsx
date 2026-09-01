"use client"

import * as React from "react"
import { useReactFlow, type Node } from "@xyflow/react"
import { Bug, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { useLatestRunSteps } from "./workflow-runs-provider"
import type { StepNodeType } from "../nodes/node-registry"

interface TimelineEvent {
  timestamp: number
  relativeTime: string
  text: string
}

interface ItemGlowRecord {
  id: string
  title: string
  type: "node" | "edge"
  blueGlowSeen: boolean
  firstBlueAt?: string
  greenSeen: boolean
  firstGreenAt?: string
  failedSeen?: boolean
  firstFailedAt?: string
  lastStatus?: string
  transitionHistory: string[]
}

export function DevWorkflowDebugger() {
  const isDev = process.env.NODE_ENV === "development"
  const { getNodes, getEdges } = useReactFlow()
  const { steps, isLive, latestRun, cancelingRunId } = useLatestRunSteps()
  const [copied, setCopied] = React.useState(false)

  const runStartTimeRef = React.useRef<number | null>(null)
  const lastRunIdRef = React.useRef<string | null>(null)
  const timelineEventsRef = React.useRef<TimelineEvent[]>([])
  const glowHistoryRef = React.useRef<Map<string, ItemGlowRecord>>(new Map())
  const prevStatesRef = React.useRef<Map<string, string>>(new Map())

  // Reset timeline when a new run ID begins
  React.useEffect(() => {
    if (!latestRun?.id) return

    if (latestRun.id !== lastRunIdRef.current) {
      lastRunIdRef.current = latestRun.id
      runStartTimeRef.current = Date.now()
      timelineEventsRef.current = []
      glowHistoryRef.current.clear()
      prevStatesRef.current.clear()

      timelineEventsRef.current.push({
        timestamp: Date.now(),
        relativeTime: "+0.00s",
        text: `🚀 [Run Started] ID: ${latestRun.id}`,
      })
    }
  }, [latestRun?.id])

  // Track live state changes and record blue/green/gray transitions
  React.useEffect(() => {
    if (!latestRun || !steps) return

    const startTime = runStartTimeRef.current || Date.now()
    const getRelTime = () => {
      const diffMs = Math.max(0, Date.now() - startTime)
      return `+${(diffMs / 1000).toFixed(2)}s`
    }

    const nodes = getNodes() as Node<StepNodeType["data"]>[]
    const edges = getEdges()

    // 1. Evaluate Nodes
    nodes.forEach((n) => {
      const nodeKey = `node:${n.id}`
      const nodeSteps = steps.filter((s) => s.nodeId === n.id || s.id === n.id)
      const hasRunning = nodeSteps.some((s) => s.status === "running")
      const hasDone = nodeSteps.some((s) => s.status === "done")
      const hasPending = nodeSteps.some((s) => s.status === "pending")
      const hasFailed = nodeSteps.some((s) => s.status === "failed")
      const failedStep = nodeSteps.find((s) => s.status === "failed")

      const isRunning =
        isLive &&
        (hasRunning || (n.data?.kind === "trigger" && !hasDone && !hasFailed))
      const isDone = hasDone && !isRunning
      const isPending = hasPending && !isRunning && !isDone

      const currentState = isRunning
        ? "RUNNING"
        : hasFailed && !isRunning
          ? "FAILED"
          : isDone
            ? "DONE"
            : isPending
              ? "PENDING"
              : "IDLE"
      const prevState = prevStatesRef.current.get(nodeKey)

      if (currentState !== prevState) {
        prevStatesRef.current.set(nodeKey, currentState)

        let record = glowHistoryRef.current.get(nodeKey)
        if (!record) {
          record = {
            id: n.id,
            title: n.data?.title || n.id,
            type: "node",
            blueGlowSeen: false,
            greenSeen: false,
            transitionHistory: [],
          }
          glowHistoryRef.current.set(nodeKey, record)
        }
        record.lastStatus = currentState
        record.transitionHistory.push(`${getRelTime()}: ${currentState}`)

        const doneCount = nodeSteps.filter((s) => s.status === "done").length
        const totalPasses = nodeSteps.length

        if (isRunning) {
          record.blueGlowSeen = true
          if (!record.firstBlueAt) record.firstBlueAt = getRelTime()
          timelineEventsRef.current.push({
            timestamp: Date.now(),
            relativeTime: getRelTime(),
            text: `🔵 [Node: ${n.data?.title || n.id}] Blue Orbit Glow STARTED (Running Pass ${doneCount + 1}/${totalPasses})`,
          })
        } else if (currentState === "FAILED") {
          record.failedSeen = true
          if (!record.firstFailedAt) record.firstFailedAt = getRelTime()
          timelineEventsRef.current.push({
            timestamp: Date.now(),
            relativeTime: getRelTime(),
            text: `🔴 [Node: ${n.data?.title || n.id}] FAILED: "${failedStep?.error || "Step failed"}"`,
          })
        } else if (isDone) {
          record.greenSeen = true
          if (!record.firstGreenAt) record.firstGreenAt = getRelTime()
          timelineEventsRef.current.push({
            timestamp: Date.now(),
            relativeTime: getRelTime(),
            text: `🟢 [Node: ${n.data?.title || n.id}] Turned Green (Pass ${doneCount}/${totalPasses} Done)`,
          })
        } else if (isPending) {
          timelineEventsRef.current.push({
            timestamp: Date.now(),
            relativeTime: getRelTime(),
            text: `⏳ [Node: ${n.data?.title || n.id}] Reverted to PENDING / Gray (Waiting for next branch pass, ${doneCount}/${totalPasses} done)`,
          })
        } else if (currentState === "IDLE") {
          timelineEventsRef.current.push({
            timestamp: Date.now(),
            relativeTime: getRelTime(),
            text: `⚪ [Node: ${n.data?.title || n.id}] Idle Neutral Gray`,
          })
        }
      }
    })

    // 2. Evaluate Edges
    edges.forEach((e) => {
      const edgeKey = `edge:${e.id}`
      const edgeSteps = steps.filter((s) => s.edgeId === e.id)
      const edgeRunning = edgeSteps.find((s) => s.status === "running")
      const edgePending = edgeSteps.find((s) => s.status === "pending")
      const edgeDone = [...edgeSteps].reverse().find((s) => s.status === "done")
      const edgeStep =
        edgeRunning ??
        edgePending ??
        edgeDone ??
        edgeSteps[edgeSteps.length - 1]

      const sourceSteps = steps.filter(
        (s) => s.nodeId === e.source || s.id === e.source
      )
      const targetSteps = steps.filter(
        (s) => s.nodeId === e.target || s.id === e.target
      )

      const hasSourceDone = sourceSteps.some((s) => s.status === "done")
      const hasTargetDone = targetSteps.some((s) => s.status === "done")

      const sourceRunning = sourceSteps.find((s) => s.status === "running")
      const sourceDone = sourceSteps.find((s) => s.status === "done")
      const sourceStep =
        sourceRunning ?? sourceDone ?? sourceSteps[sourceSteps.length - 1]

      const targetRunning = targetSteps.find((s) => s.status === "running")
      const targetPending = targetSteps.find((s) => s.status === "pending")

      const handleId =
        (e as { sourceHandleId?: string | null; sourceHandle?: string | null })
          .sourceHandleId ||
        (e as { sourceHandleId?: string | null; sourceHandle?: string | null })
          .sourceHandle ||
        "true"
      const outputObj = sourceStep?.output as { branch?: string } | undefined
      const activeBranch = outputObj?.branch
      const isBranchActive =
        sourceStep?.type !== "if" || !activeBranch || handleId === activeBranch

      const isTransferring = Boolean(
        isLive &&
        !cancelingRunId &&
        hasSourceDone &&
        isBranchActive &&
        (edgeStep
          ? edgeStep.status === "pending"
          : targetPending?.status === "pending" && !targetRunning)
      )

      const isTraversed = Boolean(
        !isTransferring &&
        hasSourceDone &&
        isBranchActive &&
        (edgeStep
          ? edgeStep.status === "running" || edgeStep.status === "done"
          : hasTargetDone || Boolean(targetRunning))
      )

      const currentEdgeState = isTraversed
        ? "TRAVERSED"
        : isTransferring
          ? "TRANSFERRING"
          : "NEUTRAL"
      const prevEdgeState = prevStatesRef.current.get(edgeKey)

      if (currentEdgeState !== prevEdgeState) {
        prevStatesRef.current.set(edgeKey, currentEdgeState)

        const srcNode = nodes.find((n) => n.id === e.source)
        const tgtNode = nodes.find((n) => n.id === e.target)
        const edgeLabel = `${srcNode?.data?.title || e.source} ➔ ${tgtNode?.data?.title || e.target}`

        let record = glowHistoryRef.current.get(edgeKey)
        if (!record) {
          record = {
            id: e.id,
            title: edgeLabel,
            type: "edge",
            blueGlowSeen: false,
            greenSeen: false,
            transitionHistory: [],
          }
          glowHistoryRef.current.set(edgeKey, record)
        }
        record.lastStatus = currentEdgeState
        record.transitionHistory.push(`${getRelTime()}: ${currentEdgeState}`)

        if (isTransferring) {
          record.blueGlowSeen = true
          if (!record.firstBlueAt) record.firstBlueAt = getRelTime()
          timelineEventsRef.current.push({
            timestamp: Date.now(),
            relativeTime: getRelTime(),
            text: `🔵 [Edge: ${edgeLabel}] Blue Traveling Pulse STARTED`,
          })
        } else if (isTraversed) {
          record.greenSeen = true
          if (!record.firstGreenAt) record.firstGreenAt = getRelTime()
          timelineEventsRef.current.push({
            timestamp: Date.now(),
            relativeTime: getRelTime(),
            text: `🟢 [Edge: ${edgeLabel}] Locked Solid Green`,
          })
        } else if (currentEdgeState === "NEUTRAL") {
          timelineEventsRef.current.push({
            timestamp: Date.now(),
            relativeTime: getRelTime(),
            text: `⚪ [Edge: ${edgeLabel}] Reverted to Neutral Gray`,
          })
        }
      }
    })
  }, [steps, isLive, latestRun, cancelingRunId, getNodes, getEdges])

  const generateMarkdownReport = React.useCallback(() => {
    const nodes = getNodes() as Node<StepNodeType["data"]>[]
    const edges = getEdges()

    let md = `## 🛠️ DEV WORKFLOW DEBUG TRACE\n`
    md += `**Timestamp:** ${new Date().toISOString()}\n`
    md += `**Run ID:** \`${latestRun?.id ?? "NONE"}\` (Status: **${latestRun?.status ?? "IDLE"}**, Live: **${isLive ? "YES" : "NO"}**)\n\n`

    md += `### 1. 📊 Graph Topology\n`
    md += `**Nodes (${nodes.length}):**\n`
    nodes.forEach((n) => {
      md += `- **[${n.data?.title || n.id}]** (ID: \`${n.id}\`, Type: \`${n.data?.type}\`, Kind: \`${n.data?.kind}\`, Pos: \`{ x: ${Math.round(n.position.x)}, y: ${Math.round(n.position.y)} }\`)\n`
    })

    md += `\n**Edges (${edges.length}):**\n`
    edges.forEach((e) => {
      const srcNode = nodes.find((n) => n.id === e.source)
      const tgtNode = nodes.find((n) => n.id === e.target)
      md += `- \`${e.id}\`: **[${srcNode?.data?.title || e.source}]** ${e.sourceHandle ? `(${e.sourceHandle})` : ""} ➔ **[${tgtNode?.data?.title || e.target}]**\n`
    })

    md += `\n### 2. ⚡ Raw Execution Steps (\`steps\` array, count: ${steps?.length ?? 0})\n`
    if (!steps || steps.length === 0) {
      md += `*No steps recorded.*\n`
    } else {
      md += `| # | Title | Node ID | Edge ID | Status | Duration |\n`
      md += `| :--- | :--- | :--- | :--- | :--- | :--- |\n`
      steps.forEach((s, idx) => {
        md += `| ${idx + 1} | ${s.title} | \`${s.nodeId ?? s.id}\` | \`${s.edgeId ?? "-"}\` | **${s.status.toUpperCase()}** | ${s.durationMs !== undefined ? `${s.durationMs}ms` : "-"} |\n`
      })
    }

    md += `\n### 3. ⏱️ Complete Color & Glow Transition Timeline (Chronological)\n`
    if (timelineEventsRef.current.length === 0) {
      md += `*No events captured yet. Run a workflow to observe transitions.*\n`
    } else {
      timelineEventsRef.current.forEach((ev) => {
        md += `- \`${ev.relativeTime}\` ${ev.text}\n`
      })
    }

    md += `\n### 4. 🔍 Node & Edge Lifecycle History\n`
    md += `| Item | Type | Blue Glow? | Green? | Current State | Full Transition Sequence |\n`
    md += `| :--- | :--- | :--- | :--- | :--- | :--- |\n`

    // Check all nodes
    nodes.forEach((n) => {
      const record = glowHistoryRef.current.get(`node:${n.id}`)
      const blueText = record?.blueGlowSeen
        ? `✅ YES (${record.firstBlueAt})`
        : `❌ NO`
      const greenText = record?.greenSeen
        ? `✅ YES (${record.firstGreenAt})`
        : `❌ NO`
      const statusText =
        record?.lastStatus === "FAILED"
          ? `🔴 FAILED (${record.firstFailedAt})`
          : `\`${record?.lastStatus || "IDLE"}\``
      const historyStr = record?.transitionHistory?.join(" ➔ ") || "None"
      md += `| **[${n.data?.title || n.id}]** | Node | ${blueText} | ${greenText} | ${statusText} | \`${historyStr}\` |\n`
    })

    // Check all edges
    edges.forEach((e) => {
      const srcNode = nodes.find((n) => n.id === e.source)
      const tgtNode = nodes.find((n) => n.id === e.target)
      const edgeLabel = `${srcNode?.data?.title || e.source} ➔ ${tgtNode?.data?.title || e.target}`
      const record = glowHistoryRef.current.get(`edge:${e.id}`)
      const blueText = record?.blueGlowSeen
        ? `✅ YES (${record.firstBlueAt})`
        : `❌ NO`
      const greenText = record?.greenSeen
        ? `✅ YES (${record.firstGreenAt})`
        : `❌ NO`
      const historyStr = record?.transitionHistory?.join(" ➔ ") || "None"
      md += `| **\`${e.id}\`** (${edgeLabel}) | Edge | ${blueText} | ${greenText} | \`${record?.lastStatus || "NEUTRAL"}\` | \`${historyStr}\` |\n`
    })

    return md
  }, [getNodes, getEdges, steps, isLive, latestRun])

  const handleCopyTrace = async () => {
    try {
      const report = generateMarkdownReport()
      await navigator.clipboard.writeText(report)
      setCopied(true)
      toast.success("Debug trace & complete color lifecycle copied!")
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error("Failed to copy trace to clipboard")
    }
  }

  if (!isDev) return null

  return (
    <div className="flex items-center gap-1.5 rounded-lg border border-border/80 bg-background/95 p-1 shadow-lg backdrop-blur-xs">
      <Button
        variant="ghost"
        size="sm"
        onClick={handleCopyTrace}
        className="h-7 gap-1.5 px-2 text-xs font-medium text-muted-foreground hover:text-foreground"
      >
        {copied ? (
          <Check className="size-3.5 text-emerald-500" />
        ) : (
          <Bug className="size-3.5 text-amber-500" />
        )}
        <span>{copied ? "Copied!" : "Copy Debug Trace & Glow Timeline"}</span>
      </Button>
    </div>
  )
}
