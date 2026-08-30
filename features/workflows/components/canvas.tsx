"use client"

import * as React from "react"
import {
  ReactFlow,
  Controls,
  type Edge,
  type ColorMode,
  type EdgeTypes,
  ConnectionLineType,
  NodeTypes,
  Panel,
} from "@xyflow/react"
import { useTheme } from "next-themes"
import { StepNode } from "@/features/workflows/components/step-node"
import { WorkflowEdge } from "@/features/workflows/components/workflow-edge"
import { DevWorkflowDebugger } from "@/features/workflows/components/dev-workflow-debugger"
import { type StepNodeType } from "@/features/workflows/nodes/node-registry"
import { useLiveblocksFlow, Cursors } from "@liveblocks/react-flow"
import { AvatarStack } from "@liveblocks/react-ui"
import "@xyflow/react/dist/style.css"
import "@liveblocks/react-ui/styles.css"
import "@liveblocks/react-flow/styles.css"

import type { WorkflowGraph } from "@/lib/db"
import { saveWorkflowGraphAction } from "@/features/workflows/actions"
import { validateGraph } from "@/features/workflows/lib"

const emptySubscribe = () => () => {}

const nodeTypes: NodeTypes = { step: StepNode }
const edgeTypes: EdgeTypes = {
  smoothstep: WorkflowEdge,
  default: WorkflowEdge,
  workflow: WorkflowEdge,
}
const initialNodes: StepNodeType[] = [
  {
    id: "1",
    type: "step",
    data: { kind: "trigger", title: "Start", type: "start", values: {} },
    position: { x: 0, y: 0 },
  },
]

const initialEdges: Edge[] = []

const defaultConnectionLineStyle: React.CSSProperties = {
  stroke: "var(--border)",
}

const defaultEdgeOptions = {
  type: "smoothstep",
  style: { stroke: "var(--border)" },
} as const

const canvasStyle: React.CSSProperties = {
  "--xy-background-color": "var(--background)",
  "--xy-edge-stroke-width": 2,
  "--xy-connectionline-stroke-width": 2,
} as React.CSSProperties

const proOptions = {
  hideAttribution: true,
} as const

interface CanvasProps {
  workflowId?: string
}

export function Canvas({ workflowId }: CanvasProps) {
  const { resolvedTheme } = useTheme()
  const isMounted = React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  )

  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, onDelete } =
    useLiveblocksFlow({
      suspense: true,
      nodes: {
        initial: initialNodes,
      },
      edges: {
        initial: initialEdges,
      },
    })

  const lastSavedJsonRef = React.useRef<string>("")

  // Auto-save whenever the graph is valid and has changed (debounced)
  React.useEffect(() => {
    if (!workflowId) return

    const timer = setTimeout(async () => {
      const graph: WorkflowGraph = { nodes, edges }
      const problems = validateGraph(graph)

      // Only auto-save to DB if the graph is completely valid (0 problems)
      if (problems.length > 0) {
        return
      }

      const currentJson = JSON.stringify(graph)
      if (currentJson === lastSavedJsonRef.current) {
        return
      }

      try {
        await saveWorkflowGraphAction(workflowId, graph)
        lastSavedJsonRef.current = currentJson
      } catch (err) {
        console.error("Auto-save failed:", err)
      }
    }, 800)

    return () => clearTimeout(timer)
  }, [nodes, edges, workflowId])

  // Auto-prune orphaned edges on switch nodes whose handles no longer exist
  React.useEffect(() => {
    if (!nodes || !edges) return
    const nodeMap = new Map(nodes.map((n) => [n.id, n]))
    const orphanedEdges = edges.filter((edge) => {
      const sourceNode = nodeMap.get(edge.source)
      if (!sourceNode || sourceNode.data.type !== "switch") return false

      const values = sourceNode.data.values || {}
      const mode = values.mode || "rules"
      const fallbackEnabled = values.fallbackEnabled !== "false"
      const sourceHandle = edge.sourceHandle ?? "0"

      if (sourceHandle === "fallback") {
        return !fallbackEnabled
      }

      const handleIdx = parseInt(sourceHandle, 10)
      if (isNaN(handleIdx)) return false

      let maxCount = 1
      if (mode === "value") {
        try {
          const cases = JSON.parse(values.cases || "[]")
          if (Array.isArray(cases) && cases.length > 0) maxCount = cases.length
        } catch {}
      } else {
        try {
          const routes = JSON.parse(values.rules || "[]")
          if (Array.isArray(routes) && routes.length > 0) maxCount = routes.length
        } catch {}
      }

      return handleIdx >= maxCount
    })

    if (orphanedEdges.length > 0) {
      onDelete({ edges: orphanedEdges, nodes: [] })
    }
  }, [nodes, edges, onDelete])

  const colorMode: ColorMode = React.useMemo(() => {
    if (!isMounted) return "light"
    return resolvedTheme === "dark" || resolvedTheme === "light"
      ? resolvedTheme
      : "system"
  }, [isMounted, resolvedTheme])

  return (
    <div className="size-full">
      <ReactFlow
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onDelete={onDelete}
        onConnect={onConnect}
        colorMode={colorMode}
        fitView
        connectionLineType={ConnectionLineType.SmoothStep}
        connectionLineStyle={defaultConnectionLineStyle}
        defaultEdgeOptions={defaultEdgeOptions}
        style={canvasStyle}
        maxZoom={1}
        proOptions={proOptions}
      >
        <Cursors />
        <Controls />
        <Panel position="top-right">
          <AvatarStack />
        </Panel>
        {process.env.NODE_ENV === "development" && (
          <Panel position="top-left" className="mb-2 ml-16">
            <DevWorkflowDebugger />
          </Panel>
        )}
      </ReactFlow>
    </div>
  )
}
