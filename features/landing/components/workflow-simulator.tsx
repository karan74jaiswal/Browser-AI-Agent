"use client"

import * as React from "react"
import {
  Bot,
  CheckCircle2,
  ChevronDown,
  FileText,
  GitFork,
  Globe,
  Mail,
  MousePointerClick,
  PanelLeft,
  Play,
  Plus,
  RotateCcw,
  Store,
} from "lucide-react"
import { AnimatePresence, motion } from "motion/react"

import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"

// ---------------------------------------------------------------------------
// Collaborators with Indian Names
// ---------------------------------------------------------------------------
export interface Collaborator {
  id: string
  name: string
  color: string
  initial: string
  role: string
}

export const COLLABORATORS: Record<string, Collaborator> = {
  priya: {
    id: "priya",
    name: "Priya Sharma",
    color: "#ec4899", // pink
    initial: "P",
    role: "Growth Architect",
  },
  rohan: {
    id: "rohan",
    name: "Rohan Mehta",
    color: "#f59e0b", // amber
    initial: "R",
    role: "AI Pipeline Lead",
  },
  aditya: {
    id: "aditya",
    name: "Aditya Patel",
    color: "#3b82f6", // blue
    initial: "A",
    role: "Campaign Copywriter",
  },
  neha: {
    id: "neha",
    name: "Neha Reddy",
    color: "#10b981", // emerald/teal
    initial: "N",
    role: "QA & Deliverability",
  },
}

export interface WorkflowItem {
  id: string
  name: string
}

// Workflows focused on customer acquisition & automated growth across platforms
const WORKFLOWS_LIST: WorkflowItem[] = [
  { id: "ai-customer-acquisition", name: "ai-customer-acquisition" },
  { id: "linkedin-outreach-engine", name: "linkedin-outreach-engine" },
  { id: "twitter-intent-monitor", name: "twitter-intent-monitor" },
  { id: "g2-competitor-switchers", name: "g2-competitor-switchers" },
  { id: "producthunt-launch-leads", name: "producthunt-launch-leads" },
  { id: "inbound-demo-qualifier", name: "inbound-demo-qualifier" },
  { id: "stripe-churn-winback", name: "stripe-churn-winback" },
  { id: "seo-backlink-outreach", name: "seo-backlink-outreach" },
  { id: "omnichannel-growth-bot", name: "omnichannel-growth-bot" },
]

export interface NodeField {
  label: string
  key: string
  value: string
}

export interface CanvasNode {
  id: string
  title: string
  kind: "trigger" | "action"
  icon: React.ComponentType<{ className?: string }>
  iconBg: string
  x: number
  y: number
  width: number
  height: number
  fields: NodeField[]
}

// ---------------------------------------------------------------------------
// High-Converting Omnichannel Customer Acquisition & Lead Gen Workflow
// Automatically finds target decision makers, extracts verified pain points,
// generates 1:1 tailored conversion pitches, and sends high-converting emails.
// ---------------------------------------------------------------------------
const FULL_DAG_NODES: CanvasNode[] = [
  {
    id: "start",
    title: "Start",
    kind: "trigger",
    icon: MousePointerClick,
    iconBg: "bg-[#2563eb] text-white",
    x: 35,
    y: 310,
    width: 130,
    height: 52,
    fields: [],
  },
  {
    id: "open-url",
    title: "Open URL",
    kind: "action",
    icon: Globe,
    iconBg: "bg-[#10b981] text-white",
    x: 115,
    y: 85,
    width: 235,
    height: 84,
    fields: [
      {
        label: "URL",
        key: "url",
        value: "https://linkedin.com/search/leads?q=founder...",
      },
    ],
  },
  {
    id: "extract",
    title: "Extract",
    kind: "action",
    icon: FileText,
    iconBg: "bg-[#f59e0b] text-white",
    x: 395,
    y: 85,
    width: 245,
    height: 84,
    fields: [
      {
        label: "Instruction",
        key: "instruction",
        value: "Extract verified emails, company revenue & growth pains...",
      },
    ],
  },
  {
    id: "agent",
    title: "Agent",
    kind: "action",
    icon: Bot,
    iconBg: "bg-[#ec4899] text-white",
    x: 395,
    y: 294,
    width: 245,
    height: 84,
    fields: [
      {
        label: "Instruction",
        key: "instruction",
        value: "Research tech stack & generate 1:1 tailored pitch...",
      },
    ],
  },
  {
    id: "send-email",
    title: "Send Email",
    kind: "action",
    icon: Mail,
    iconBg: "bg-[#f97316] text-white",
    x: 685,
    y: 262,
    width: 265,
    height: 148,
    fields: [
      {
        label: "To",
        key: "to",
        value: "alex.turner@saasgrowth.io",
      },
      {
        label: "Subject",
        key: "subject",
        value: "Quick idea to scale {{company}} revenue 3x",
      },
      {
        label: "Body",
        key: "body",
        value:
          "Hey Alex, saw your recent launch! We automated your outbound funnel...",
      },
    ],
  },
]

const INITIAL_DAG_NODES: CanvasNode[] = [
  {
    id: "start",
    title: "Start",
    kind: "trigger",
    icon: MousePointerClick,
    iconBg: "bg-[#2563eb] text-white",
    x: 180,
    y: 200,
    width: 150,
    height: 56,
    fields: [],
  },
]

// ---------------------------------------------------------------------------
// Precise Handle Coordinate Derivation
// ---------------------------------------------------------------------------
function getNodeSourceHandle(node: CanvasNode): { x: number; y: number } {
  return {
    x: node.x + node.width,
    y: node.y + node.height / 2,
  }
}

function getNodeTargetHandle(node: CanvasNode): { x: number; y: number } {
  return {
    x: node.x,
    y: node.y + node.height / 2,
  }
}

// ---------------------------------------------------------------------------
// Path Builders for ReactFlow SmoothStep Orthogonal Edges
// ---------------------------------------------------------------------------
function getSmoothStep(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  r = 8
): string {
  const dx = x2 - x1
  const dy = y2 - y1
  const midX = x1 + dx / 2

  if (Math.abs(dy) < 1.5) {
    return `M ${x1} ${y1} L ${x2} ${y2}`
  }

  const signY = dy > 0 ? 1 : -1
  const actualR = Math.min(
    r,
    Math.abs(midX - x1),
    Math.abs(x2 - midX),
    Math.abs(dy) / 2
  )

  return [
    `M ${x1} ${y1}`,
    `L ${midX - actualR} ${y1}`,
    `Q ${midX} ${y1} ${midX} ${y1 + signY * actualR}`,
    `L ${midX} ${y2 - signY * actualR}`,
    `Q ${midX} ${y2} ${midX + actualR} ${y2}`,
    `L ${x2} ${y2}`,
  ].join(" ")
}

function getStartToOpenUrlUTurn(
  sourceX: number,
  sourceY: number,
  targetX: number,
  targetY: number,
  r = 8
): string {
  const rightX = sourceX + 20
  const bottomY = sourceY + 36
  const leftX = targetX - 22

  return [
    `M ${sourceX} ${sourceY}`,
    `L ${rightX - r} ${sourceY}`,
    `Q ${rightX} ${sourceY} ${rightX} ${sourceY + r}`,
    `L ${rightX} ${bottomY - r}`,
    `Q ${rightX} ${bottomY} ${rightX - r} ${bottomY}`,
    `L ${leftX + r} ${bottomY}`,
    `Q ${leftX} ${bottomY} ${leftX} ${bottomY - r}`,
    `L ${leftX} ${targetY + r}`,
    `Q ${leftX} ${targetY} ${leftX + r} ${targetY}`,
    `L ${targetX} ${targetY}`,
  ].join(" ")
}

// Log rows matching lead generation execution
const LOG_ENTRIES = [
  {
    id: "start",
    title: "Start",
    icon: MousePointerClick,
    iconBg: "bg-[#2563eb]",
    duration: "310ms",
  },
  {
    id: "open-url",
    title: "Open URL",
    icon: Globe,
    iconBg: "bg-[#10b981]",
    duration: "3.4s",
  },
  {
    id: "agent",
    title: "Agent",
    icon: Bot,
    iconBg: "bg-[#ec4899]",
    duration: "1m 18.2s",
  },
  {
    id: "extract",
    title: "Extract",
    icon: FileText,
    iconBg: "bg-[#f59e0b]",
    duration: "1.2s",
  },
  {
    id: "send-email",
    title: "Send Email",
    icon: Mail,
    iconBg: "bg-[#f97316]",
    duration: "480ms",
  },
]

export function WorkflowSimulator() {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false)
  const [activeWorkflowId, setActiveWorkflowId] = React.useState<string>(
    "ai-customer-acquisition"
  )
  const isFullWorkflow = activeWorkflowId === "ai-customer-acquisition"

  // User interactive selection
  const [userSelectedNodeId, setUserSelectedNodeId] = React.useState<
    string | null
  >(null)

  // Simulation execution state
  const [isRunning, setIsRunning] = React.useState(false)
  const [completedStepIds, setCompletedStepIds] = React.useState<string[]>([
    "start",
    "open-url",
    "agent",
  ])
  const [activeStepId, setActiveStepId] = React.useState<string | null>(null)
  const [activeTransferEdges, setActiveTransferEdges] = React.useState<
    string[]
  >([])

  // -------------------------------------------------------------------------
  // Human Multiplayer Story Engine (Ticks every 720ms - strictly < 1 second)
  // -------------------------------------------------------------------------
  const [storyStep, setStoryStep] = React.useState(0)

  React.useEffect(() => {
    const timer = setInterval(() => {
      setStoryStep((prev) => (prev + 1) % 32)
    }, 720)
    return () => clearInterval(timer)
  }, [])

  // Execute full run simulation
  const handleRunSimulation = React.useCallback(async () => {
    if (isRunning) return
    setIsRunning(true)
    setCompletedStepIds([])
    setActiveStepId("start")
    setActiveTransferEdges([])

    await new Promise((r) => setTimeout(r, 600))
    setCompletedStepIds(["start"])
    setActiveTransferEdges(["start-open"])

    await new Promise((r) => setTimeout(r, 450))
    setActiveTransferEdges([])
    setActiveStepId("open-url")

    await new Promise((r) => setTimeout(r, 900))
    setCompletedStepIds(["start", "open-url"])
    setActiveTransferEdges(["open-extract", "open-agent"])

    await new Promise((r) => setTimeout(r, 450))
    setActiveTransferEdges([])
    setActiveStepId("extract")
    await new Promise((r) => setTimeout(r, 700))
    setCompletedStepIds(["start", "open-url", "extract"])

    setActiveStepId("agent")
    await new Promise((r) => setTimeout(r, 800))
    setCompletedStepIds(["start", "open-url", "extract", "agent"])
    setActiveTransferEdges(["extract-email", "agent-email"])

    await new Promise((r) => setTimeout(r, 450))
    setActiveTransferEdges([])
    setActiveStepId("send-email")
    await new Promise((r) => setTimeout(r, 900))

    setCompletedStepIds(["start", "open-url", "extract", "agent", "send-email"])
    setActiveStepId(null)
    setIsRunning(false)
  }, [isRunning])

  const handleResetSimulation = () => {
    setIsRunning(false)
    setActiveStepId(null)
    setActiveTransferEdges([])
    setCompletedStepIds(["start", "open-url", "agent"])
  }

  // Auto-trigger run during story phase 20 if idle
  React.useEffect(() => {
    if (storyStep === 20 && !isRunning && completedStepIds.length < 5) {
      handleRunSimulation()
    }
  }, [storyStep, isRunning, completedStepIds.length, handleRunSimulation])

  // -------------------------------------------------------------------------
  // Collaborative Story Choreography:
  // - Conflict: Priya Sharma moves Extract up -> Rohan Mehta drags it down -> Priya restores it!
  // - Real-time typing: Aditya Patel edits cold outreach subject live
  // - Inspection: Neha Reddy aligns Agent & triggers run
  // -------------------------------------------------------------------------
  const { nodeOffsets, liveEmailSubject, activePresences, cursors } =
    React.useMemo(() => {
      let extractOffset = { x: 0, y: 0 }
      let agentOffset = { x: 0, y: 0 }
      const openUrlOffset = { x: 0, y: 0 }

      let emailSubject = "Quick idea to scale {{company}} revenue 3x"

      const presences: Record<
        string,
        { collaborator: Collaborator; status: string; ringColor: string } | null
      > = {
        extract: null,
        agent: null,
        "open-url": null,
        "send-email": null,
      }

      let priyaPos = { x: 480, y: 65, isClicking: false }
      let rohanPos = { x: 320, y: 110, isClicking: false }
      let adityaPos = { x: 765, y: 430, isClicking: false }
      let nehaPos = { x: 655, y: 355, isClicking: false }

      const jitter = (seed: number) => {
        const a = (storyStep + seed) * 1.7
        return { x: Math.sin(a) * 3.5, y: Math.cos(a) * 2.5 }
      }

      // Story Phase 0: Exploring & Aditya starts live copywriting (Steps 0 - 3)
      if (storyStep <= 3) {
        const j0 = jitter(1)
        const j1 = jitter(2)
        const j2 = jitter(3)
        const j3 = jitter(4)

        priyaPos = { x: 460 + j0.x, y: 75 + j0.y, isClicking: false }
        rohanPos = { x: 220 + j1.x, y: 115 + j1.y, isClicking: false }
        adityaPos = { x: 780 + j2.x, y: 335 + j2.y, isClicking: true }
        nehaPos = { x: 460 + j3.x, y: 320 + j3.y, isClicking: false }

        presences["send-email"] = {
          collaborator: COLLABORATORS.aditya,
          status: "Editing Subject",
          ringColor: COLLABORATORS.aditya.color,
        }
        emailSubject =
          storyStep >= 2
            ? "Scale {{company}} revenue 3x with..."
            : "Quick idea to scale {{company}} revenue 3x"
      }

      // Story Phase 1: Priya Sharma grabs Extract and moves it up-right (Steps 4 - 7)
      else if (storyStep >= 4 && storyStep <= 7) {
        const t = (storyStep - 4) / 3
        extractOffset = { x: Math.round(t * 32), y: Math.round(t * -32) }

        priyaPos = {
          x: 435 + extractOffset.x,
          y: 95 + extractOffset.y,
          isClicking: true,
        }
        rohanPos = { x: 280 + storyStep * 15, y: 95, isClicking: false }
        adityaPos = { x: 785, y: 335, isClicking: true }
        nehaPos = { x: 440, y: 330, isClicking: false }

        presences.extract = {
          collaborator: COLLABORATORS.priya,
          status: "Moving layout",
          ringColor: COLLABORATORS.priya.color,
        }
        presences["send-email"] = {
          collaborator: COLLABORATORS.aditya,
          status: "Editing Subject",
          ringColor: COLLABORATORS.aditya.color,
        }
        emailSubject = "Scale {{company}} revenue 3x with AI browser agents"
      }

      // Story Phase 2: CONFLICT! Rohan intercepts and drags Extract down (Steps 8 - 11)
      else if (storyStep >= 8 && storyStep <= 11) {
        const t = (storyStep - 8) / 3
        extractOffset = {
          x: Math.round(32 - t * 44),
          y: Math.round(-32 + t * 64),
        }

        rohanPos = {
          x: 430 + extractOffset.x,
          y: 95 + extractOffset.y,
          isClicking: true,
        }
        priyaPos = {
          x: 490 - storyStep * 6,
          y: 60 + storyStep * 4,
          isClicking: false,
        }
        adityaPos = { x: 765, y: 375, isClicking: false }
        nehaPos = { x: 500, y: 320, isClicking: false }

        presences.extract = {
          collaborator: COLLABORATORS.rohan,
          status: "Relocating step",
          ringColor: COLLABORATORS.rohan.color,
        }
        emailSubject = "Scale {{company}} revenue 3x with AI browser agents"
      }

      // Story Phase 3: RESOLUTION! Priya grabs it back to original position (Steps 12 - 15)
      else if (storyStep >= 12 && storyStep <= 15) {
        const t = (storyStep - 12) / 3
        extractOffset = {
          x: Math.round(-12 * (1 - t)),
          y: Math.round(32 * (1 - t)),
        }

        priyaPos = {
          x: 435 + extractOffset.x,
          y: 95 + extractOffset.y,
          isClicking: true,
        }
        rohanPos = { x: 260 + (1 - t) * 60, y: 110, isClicking: false }
        adityaPos = { x: 770, y: 430, isClicking: false }
        nehaPos = { x: 540 + t * 40, y: 310, isClicking: false }

        presences.extract = {
          collaborator: COLLABORATORS.priya,
          status: "Restoring position",
          ringColor: COLLABORATORS.priya.color,
        }
        emailSubject = "Scale {{company}} revenue 3x with AI browser agents"
      }

      // Story Phase 4: Neha nudges Agent & verifies deliverability (Steps 16 - 18)
      else if (storyStep >= 16 && storyStep <= 18) {
        const t = storyStep === 17 ? 1 : 0
        agentOffset = { x: 0, y: t * 12 }

        nehaPos = { x: 440, y: 310 + agentOffset.y, isClicking: true }
        priyaPos = { x: 480 + (storyStep % 2) * 5, y: 65, isClicking: false }
        rohanPos = { x: 320 + (storyStep % 2) * 6, y: 110, isClicking: false }
        adityaPos = { x: 760, y: 440, isClicking: false }

        presences.agent = {
          collaborator: COLLABORATORS.neha,
          status: "Aligning connection",
          ringColor: COLLABORATORS.neha.color,
        }
        emailSubject = "Quick idea to scale {{company}} revenue 3x"
      }

      // Story Phase 5: Neha glides to ▶ Run button and launches pipeline! (Steps 19 - 22)
      else if (storyStep >= 19 && storyStep <= 22) {
        if (storyStep === 19) {
          nehaPos = { x: 860, y: 22, isClicking: true }
        } else {
          nehaPos = { x: 880, y: 30, isClicking: false }
        }
        priyaPos = { x: 420, y: 70, isClicking: false }
        rohanPos = { x: 250, y: 105, isClicking: false }
        adityaPos = { x: 740, y: 410, isClicking: false }
      }

      // Story Phase 6: Automated Customer Acquisition in action (Steps 23 - 31)
      else {
        const j0 = jitter(5)
        const j1 = jitter(6)
        const j2 = jitter(7)
        const j3 = jitter(8)

        priyaPos = { x: 470 + j0.x, y: 65 + j0.y, isClicking: false }
        rohanPos = { x: 315 + j1.x, y: 110 + j1.y, isClicking: false }
        adityaPos = { x: 755 + j2.x, y: 430 + j2.y, isClicking: false }
        nehaPos = { x: 670 + j3.x, y: 350 + j3.y, isClicking: false }
      }

      return {
        nodeOffsets: {
          extract: extractOffset,
          agent: agentOffset,
          openUrl: openUrlOffset,
        },
        liveEmailSubject: emailSubject,
        activePresences: presences,
        cursors: [
          {
            collaborator: COLLABORATORS.priya,
            x: priyaPos.x,
            y: priyaPos.y,
            isClicking: priyaPos.isClicking,
          },
          {
            collaborator: COLLABORATORS.rohan,
            x: rohanPos.x,
            y: rohanPos.y,
            isClicking: rohanPos.isClicking,
          },
          {
            collaborator: COLLABORATORS.aditya,
            x: adityaPos.x,
            y: adityaPos.y,
            isClicking: adityaPos.isClicking,
          },
          {
            collaborator: COLLABORATORS.neha,
            x: nehaPos.x,
            y: nehaPos.y,
            isClicking: nehaPos.isClicking,
          },
        ],
      }
    }, [storyStep])

  // -------------------------------------------------------------------------
  // Dynamically Displaced Nodes with Customer Acquisition Data
  // -------------------------------------------------------------------------
  const nodes = React.useMemo(() => {
    if (!isFullWorkflow) return INITIAL_DAG_NODES

    return FULL_DAG_NODES.map((node) => {
      if (node.id === "extract") {
        return {
          ...node,
          x: node.x + nodeOffsets.extract.x,
          y: node.y + nodeOffsets.extract.y,
        }
      }
      if (node.id === "agent") {
        return {
          ...node,
          x: node.x + nodeOffsets.agent.x,
          y: node.y + nodeOffsets.agent.y,
        }
      }
      if (node.id === "open-url") {
        return {
          ...node,
          x: node.x + nodeOffsets.openUrl.x,
          y: node.y + nodeOffsets.openUrl.y,
        }
      }
      if (node.id === "send-email") {
        return {
          ...node,
          fields: node.fields.map((f) =>
            f.key === "subject" ? { ...f, value: liveEmailSubject } : f
          ),
        }
      }
      return node
    })
  }, [isFullWorkflow, nodeOffsets, liveEmailSubject])

  // -------------------------------------------------------------------------
  // Real-Time Dynamic Edge Paths Bound Directly to Moving Handles
  // -------------------------------------------------------------------------
  const edgePaths = React.useMemo(() => {
    if (!isFullWorkflow) return []

    const startNode = nodes.find((n) => n.id === "start")!
    const openUrlNode = nodes.find((n) => n.id === "open-url")!
    const extractNode = nodes.find((n) => n.id === "extract")!
    const agentNode = nodes.find((n) => n.id === "agent")!
    const sendEmailNode = nodes.find((n) => n.id === "send-email")!

    const startSource = getNodeSourceHandle(startNode)
    const openUrlTarget = getNodeTargetHandle(openUrlNode)
    const openUrlSource = getNodeSourceHandle(openUrlNode)
    const extractTarget = getNodeTargetHandle(extractNode)
    const extractSource = getNodeSourceHandle(extractNode)
    const agentTarget = getNodeTargetHandle(agentNode)
    const agentSource = getNodeSourceHandle(agentNode)
    const sendEmailTarget = getNodeTargetHandle(sendEmailNode)

    const p1 = getStartToOpenUrlUTurn(
      startSource.x,
      startSource.y,
      openUrlTarget.x,
      openUrlTarget.y,
      8
    )

    const p2 = getSmoothStep(
      openUrlSource.x,
      openUrlSource.y,
      extractTarget.x,
      extractTarget.y,
      8
    )

    const p3 = getSmoothStep(
      openUrlSource.x,
      openUrlSource.y,
      agentTarget.x,
      agentTarget.y,
      8
    )

    const p4 = getSmoothStep(
      extractSource.x,
      extractSource.y,
      sendEmailTarget.x,
      sendEmailTarget.y,
      8
    )

    const p5 = getSmoothStep(
      agentSource.x,
      agentSource.y,
      sendEmailTarget.x,
      sendEmailTarget.y,
      8
    )

    return [
      {
        id: "start-open",
        path: p1,
        isTransferring: activeTransferEdges.includes("start-open"),
        isCompleted: completedStepIds.includes("start"),
      },
      {
        id: "open-extract",
        path: p2,
        isTransferring: activeTransferEdges.includes("open-extract"),
        isCompleted: completedStepIds.includes("open-url"),
      },
      {
        id: "open-agent",
        path: p3,
        isTransferring: activeTransferEdges.includes("open-agent"),
        isCompleted: completedStepIds.includes("open-url"),
      },
      {
        id: "extract-email",
        path: p4,
        isTransferring: activeTransferEdges.includes("extract-email"),
        isCompleted: completedStepIds.includes("extract"),
      },
      {
        id: "agent-email",
        path: p5,
        isTransferring: activeTransferEdges.includes("agent-email"),
        isCompleted: completedStepIds.includes("agent"),
      },
    ]
  }, [isFullWorkflow, nodes, activeTransferEdges, completedStepIds])

  return (
    <div className="mx-auto w-full max-w-340 select-none">
      {/* Studio Window Chrome */}
      <div className="relative flex h-170 flex-col overflow-hidden rounded-xl border border-border bg-card shadow-2xl sm:h-180 sm:rounded-2xl">
        {/* Main Studio Layout */}
        <div className="relative flex min-h-0 flex-1 overflow-hidden">
          {/* ================================================================= */}
          {/* 1. LEFT SIDEBAR (Default Collapsed)                               */}
          {/* ================================================================= */}
          <motion.div
            animate={{ width: isSidebarOpen ? 230 : 48 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
            className="z-20 flex shrink-0 flex-col justify-between overflow-hidden border-r border-sidebar-border bg-sidebar text-sidebar-foreground"
          >
            {/* Top Section */}
            <div className="flex min-h-0 flex-col">
              <div
                className={cn(
                  "flex h-12 shrink-0 items-center gap-2 border-b border-sidebar-border px-3",
                  !isSidebarOpen && "justify-center px-0"
                )}
              >
                {isSidebarOpen ? (
                  <>
                    <div className="flex size-6 shrink-0 items-center justify-center rounded-md bg-purple-600 text-white shadow-2xs">
                      <Store className="size-3.5" />
                    </div>
                    <div className="flex min-w-0 flex-1 items-center gap-1">
                      <span className="truncate text-xs font-semibold text-sidebar-foreground">
                        AcquireAI Global
                      </span>
                      <ChevronDown className="size-3 shrink-0 text-muted-foreground" />
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsSidebarOpen(false)}
                      title="Collapse sidebar"
                      className="flex size-7 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
                    >
                      <PanelLeft className="size-3.5" />
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsSidebarOpen(true)}
                    title="Expand sidebar"
                    className="flex size-8 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
                  >
                    <PanelLeft className="size-4" />
                  </button>
                )}
              </div>

              {isSidebarOpen ? (
                <div className="flex-1 space-y-1 overflow-y-auto px-2 py-3">
                  <div className="flex items-center justify-between px-2 py-1 text-muted-foreground">
                    <span className="text-xs font-medium">Workflows</span>
                    <button
                      type="button"
                      className="flex size-5 cursor-pointer items-center justify-center rounded text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
                    >
                      <Plus className="size-3.5" />
                    </button>
                  </div>

                  <div className="mt-1 flex flex-col gap-0.5">
                    {WORKFLOWS_LIST.map((wf) => {
                      const isActive = activeWorkflowId === wf.id
                      return (
                        <button
                          key={wf.id}
                          type="button"
                          onClick={() => setActiveWorkflowId(wf.id)}
                          className={cn(
                            "flex w-full cursor-pointer items-center gap-2 truncate rounded-md px-2.5 py-1.5 text-left text-xs font-normal transition-colors",
                            isActive
                              ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                              : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                          )}
                        >
                          <span className="truncate">{wf.name}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 py-3">
                  <button
                    type="button"
                    onClick={() => setIsSidebarOpen(true)}
                    title="Workflows"
                    className="flex size-8 cursor-pointer items-center justify-center rounded-md text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
                  >
                    <GitFork className="size-4" />
                  </button>
                </div>
              )}
            </div>

            <div
              className={cn(
                "shrink-0 border-t border-sidebar-border p-3",
                !isSidebarOpen && "flex justify-center p-2"
              )}
            >
              <div className="flex size-7 items-center justify-center rounded-full bg-purple-600 text-xs font-bold text-white shadow-xs">
                A
              </div>
            </div>
          </motion.div>

          {/* ================================================================= */}
          {/* 2. FULL CANVAS VIEWPORT                                           */}
          {/* ================================================================= */}
          <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden bg-muted/30 dark:bg-[#0c0c0e]">
            {/* Top Right: Run Actions & Indian Multiplayer Avatar Stack (P, R, A, N) */}
            <div className="absolute top-3 right-4 z-30 flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <Button
                  size="sm"
                  onClick={handleRunSimulation}
                  disabled={isRunning}
                  className={cn(
                    "h-7 cursor-pointer gap-1.5 rounded-md px-3 text-xs font-medium shadow-xs transition-all",
                    isRunning
                      ? "bg-blue-600 text-white"
                      : completedStepIds.length === LOG_ENTRIES.length
                        ? "bg-emerald-600 text-white hover:bg-emerald-700"
                        : "bg-primary text-primary-foreground hover:bg-primary/90"
                  )}
                >
                  {isRunning ? (
                    <>
                      <Spinner className="size-3 text-white" />
                      <span>Running...</span>
                    </>
                  ) : completedStepIds.length === LOG_ENTRIES.length ? (
                    <>
                      <CheckCircle2 className="size-3 text-white" />
                      <span>Succeeded</span>
                    </>
                  ) : (
                    <>
                      <Play className="size-3 fill-current" />
                      <span>Run</span>
                    </>
                  )}
                </Button>

                {completedStepIds.length > 0 && (
                  <button
                    type="button"
                    onClick={handleResetSimulation}
                    title="Reset run"
                    className="flex size-7 cursor-pointer items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <RotateCcw className="size-3" />
                  </button>
                )}
              </div>

              {/* Indian Multiplayer Avatar Stack: Priya, Rohan, Aditya, Neha */}
              <div className="flex items-center -space-x-1.5 pl-1 select-none">
                {Object.values(COLLABORATORS).map((member) => (
                  <div
                    key={member.id}
                    style={{ backgroundColor: member.color }}
                    className="flex size-6 cursor-default items-center justify-center rounded-full text-[10px] font-bold text-white shadow-xs ring-2 ring-background dark:ring-[#111113]"
                    title={`${member.name} (${member.role})`}
                  >
                    {member.initial}
                  </div>
                ))}
              </div>
            </div>

            {/* Canvas Body with Dot Grid */}
            <div className="relative w-full flex-1 overflow-x-auto overflow-y-hidden select-none">
              <div
                className="pointer-events-none absolute inset-0 min-w-245 opacity-40 dark:opacity-50"
                style={{
                  backgroundImage:
                    "radial-gradient(hsl(var(--foreground) / 0.14) 1px, transparent 1px)",
                  backgroundSize: "20px 20px",
                }}
              />

              {/* Dynamic Live Indian Multiplayer Cursors (Spring Damped, <1s Lifelike Motion) */}
              <AnimatePresence>
                {cursors.map((cursor) => (
                  <motion.div
                    key={cursor.collaborator.id}
                    animate={{
                      x: cursor.x,
                      y: cursor.y,
                    }}
                    transition={{
                      type: "spring",
                      damping: 24,
                      stiffness: 190,
                      mass: 0.7,
                    }}
                    className="pointer-events-none absolute z-30 will-change-transform select-none"
                  >
                    <div className="relative">
                      {/* Cursor Pointer Arrow with Click Feedback */}
                      <motion.svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 32 32"
                        width="18"
                        height="18"
                        animate={{
                          scale: cursor.isClicking ? 0.86 : 1,
                          rotate: cursor.isClicking ? -4 : 0,
                        }}
                        transition={{
                          type: "spring",
                          stiffness: 450,
                          damping: 20,
                        }}
                        style={{ color: cursor.collaborator.color }}
                        className="drop-shadow-md"
                      >
                        <path
                          fill="currentColor"
                          d="m.088 1.75 11.25 29.422c.409 1.07 1.908 1.113 2.377.067l5.223-11.653c.13-.288.36-.518.648-.648l11.653-5.223c1.046-.47 1.004-1.968-.067-2.377L1.75.088C.71-.31-.31.71.088 1.75Z"
                        />
                      </motion.svg>

                      {/* Click Ripple Indicator */}
                      {cursor.isClicking && (
                        <span
                          style={{ borderColor: cursor.collaborator.color }}
                          className="pointer-events-none absolute -top-1 -left-1 size-5 animate-ping rounded-full border-2 opacity-75"
                        />
                      )}

                      {/* Name Badge */}
                      <div
                        style={{ backgroundColor: cursor.collaborator.color }}
                        className="absolute top-3.5 left-3.5 flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium whitespace-nowrap text-white shadow-md"
                      >
                        <span>{cursor.collaborator.name}</span>
                        {cursor.isClicking && (
                          <span className="size-1.5 animate-pulse rounded-full bg-white" />
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Nodes and SVG Wires Container */}
              <div className="relative size-full min-w-245 overflow-visible">
                <svg className="pointer-events-none absolute inset-0 size-full overflow-visible">
                  {edgePaths.map((edge) => (
                    <g key={edge.id}>
                      <path
                        d={edge.path}
                        fill="none"
                        stroke={edge.isCompleted ? "#3b82f6" : "currentColor"}
                        strokeWidth="2"
                        className={cn(
                          "transition-colors duration-300",
                          !edge.isCompleted && "text-border dark:text-[#2e2e32]"
                        )}
                      />

                      {edge.isTransferring && (
                        <>
                          <path
                            d={edge.path}
                            fill="none"
                            stroke="#3b82f6"
                            strokeWidth="2.5"
                            strokeDasharray="6 6"
                            className="animate-pulse"
                          />
                          <circle r="4" fill="#3b82f6">
                            <animateMotion
                              dur="0.45s"
                              repeatCount="indefinite"
                              path={edge.path}
                            />
                          </circle>
                        </>
                      )}
                    </g>
                  ))}
                </svg>

                {/* Nodes with Live Presence Highlights & Interactive Drag Follow */}
                {nodes.map((node) => {
                  const isUserSelected = userSelectedNodeId === node.id
                  const isNodeRunning = activeStepId === node.id
                  const isNodeCompleted = completedStepIds.includes(node.id)
                  const presence = activePresences[node.id]
                  const Icon = node.icon

                  return (
                    <motion.div
                      key={node.id}
                      onClick={() =>
                        setUserSelectedNodeId((prev) =>
                          prev === node.id ? null : node.id
                        )
                      }
                      animate={{
                        left: `${node.x}px`,
                        top: `${node.y}px`,
                      }}
                      transition={{
                        type: "spring",
                        damping: 26,
                        stiffness: 180,
                        mass: 0.8,
                      }}
                      style={{
                        position: "absolute",
                        width: `${node.width}px`,
                        height: `${node.height}px`,
                      }}
                      className={cn(
                        "flex cursor-pointer flex-col justify-between rounded-xl border border-border bg-card text-card-foreground shadow-md transition-shadow duration-200 select-none dark:border-[#2e2e32] dark:bg-[#1c1c1e]",
                        isUserSelected
                          ? "border-blue-500 shadow-[0_0_16px_rgba(59,130,246,0.3)] ring-2 ring-blue-500/30"
                          : isNodeRunning
                            ? "border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.4)]"
                            : isNodeCompleted
                              ? "hover:border-primary/40"
                              : "hover:border-primary/30"
                      )}
                    >
                      {/* Active Collaborator Presence Ring & Action Pill */}
                      {presence && (
                        <div
                          style={{ borderColor: presence.ringColor }}
                          className="pointer-events-none absolute -inset-1 rounded-xl border-2 shadow-xs transition-all duration-300"
                        >
                          <div
                            style={{ backgroundColor: presence.ringColor }}
                            className="py-0.2 absolute -top-3.5 right-2 flex items-center gap-1 rounded-full px-2 text-[9px] font-semibold text-white shadow-sm"
                          >
                            <span className="size-1 animate-pulse rounded-full bg-white" />
                            <span>{presence.status}</span>
                          </div>
                        </div>
                      )}

                      {/* Left Target Handle Notch */}
                      {node.kind !== "trigger" && (
                        <div
                          style={{
                            position: "absolute",
                            left: 0,
                            top: "50%",
                            transform: "translate(-100%, -50%)",
                          }}
                          className={cn(
                            "z-20 h-3.5 w-1.5 rounded-l-xs border-0 transition-colors duration-200",
                            isNodeCompleted
                              ? "bg-blue-500"
                              : isNodeRunning
                                ? "bg-blue-500"
                                : "bg-border dark:bg-[#3a3a3e]"
                          )}
                        />
                      )}

                      {/* Right Source Handle Notch */}
                      <div
                        style={{
                          position: "absolute",
                          right: 0,
                          top: "50%",
                          transform: "translate(100%, -50%)",
                        }}
                        className={cn(
                          "z-20 h-3.5 w-1.5 rounded-r-xs border-0 transition-colors duration-200",
                          isNodeCompleted
                            ? "bg-blue-500"
                            : isNodeRunning
                              ? "bg-blue-500"
                              : "bg-border dark:bg-[#3a3a3e]"
                        )}
                      />

                      {/* Node Header */}
                      <div className="flex items-center gap-3 px-3.5 py-2.5">
                        <div
                          className={cn(
                            "flex size-8 shrink-0 items-center justify-center rounded-lg shadow-xs",
                            node.iconBg
                          )}
                        >
                          {isNodeRunning ? (
                            <Spinner className="size-4 text-white" />
                          ) : (
                            <Icon className="size-4.5 text-white" />
                          )}
                        </div>

                        <span className="truncate text-sm font-semibold text-card-foreground dark:text-white">
                          {node.title}
                        </span>
                      </div>

                      {/* Clean Key-Value Field Rows with Real-Time Typing Caret */}
                      {node.fields.length > 0 && (
                        <div className="flex flex-col gap-1.5 px-3.5 pb-3 text-xs">
                          {node.fields.map((f, idx) => {
                            const isBeingEdited =
                              presence &&
                              node.id === "send-email" &&
                              f.key === "subject" &&
                              presence.collaborator.id === "aditya"

                            return (
                              <div
                                key={idx}
                                className="flex items-baseline justify-between gap-3 text-xs"
                              >
                                <span className="shrink-0 font-sans text-xs text-muted-foreground">
                                  {f.label}
                                </span>
                                <span className="flex items-center justify-end gap-0.5 truncate text-right font-mono text-xs text-card-foreground dark:text-zinc-200">
                                  <span>{f.value}</span>
                                  {isBeingEdited && (
                                    <span className="h-3.5 w-1.5 animate-pulse rounded-xs bg-blue-500" />
                                  )}
                                </span>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </motion.div>
                  )
                })}
              </div>
            </div>

            {/* Bottom LOGS Drawer */}
            <div className="z-20 shrink-0 border-t border-border bg-card/95 px-5 py-3 backdrop-blur-md dark:bg-[#141416]">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-mono text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                  LOGS
                </span>
                <span className="font-mono text-[11px] text-muted-foreground">
                  {completedStepIds.length} / {LOG_ENTRIES.length} completed
                </span>
              </div>

              {/* Vertical Log Rows */}
              <div className="flex flex-col gap-2">
                {LOG_ENTRIES.map((entry) => {
                  const isDone = completedStepIds.includes(entry.id)
                  const isRunningStep = activeStepId === entry.id
                  const Icon = entry.icon

                  return (
                    <div
                      key={entry.id}
                      className={cn(
                        "flex items-center justify-between py-0.5 transition-colors",
                        isDone
                          ? "text-foreground dark:text-zinc-200"
                          : isRunningStep
                            ? "font-medium text-blue-500 dark:text-blue-400"
                            : "text-muted-foreground/60"
                      )}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={cn(
                            "flex size-5 items-center justify-center rounded-xs text-white",
                            entry.iconBg
                          )}
                        >
                          <Icon className="size-3" />
                        </div>
                        <span className="font-sans text-xs font-medium">
                          {entry.title}
                        </span>
                        {isRunningStep && (
                          <Spinner className="size-3 text-blue-500 dark:text-blue-400" />
                        )}
                      </div>

                      {isDone && (
                        <span className="font-mono text-xs text-muted-foreground">
                          {entry.duration}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
