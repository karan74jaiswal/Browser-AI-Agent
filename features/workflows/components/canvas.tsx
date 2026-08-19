"use client"

import * as React from "react"
import {
  ReactFlow,
  Background,
  Controls,
  addEdge,
  useNodesState,
  useEdgesState,
  type Connection,
  type Edge,
  type Node,
  type ColorMode,
  ConnectionLineType,
} from "@xyflow/react"
import { useTheme } from "next-themes"

import "@xyflow/react/dist/style.css"

const emptySubscribe = () => () => {}

const initialNodes: Node[] = [
  {
    id: "1",
    type: "input",
    data: { label: "Trigger: Workflow Start" },
    position: { x: 0, y: 0 },
  },
  {
    id: "2",
    data: { label: "Action: Process Data" },
    position: { x: 250, y: 0 },
  },
  {
    id: "3",
    data: { label: "Action: Browser Automation" },
    position: { x: 500, y: 0 },
  },
  {
    id: "4",
    type: "output",
    data: { label: "Result: Finished" },
    position: { x: 700, y: 0 },
  },
]

const initialEdges: Edge[] = [
  { id: "e1-2", source: "1", target: "2", animated: true },
  { id: "e2-3", source: "2", target: "3" },

  { id: "e3-4", source: "3", target: "4" },
]

interface CanvasProps {
  workflowId?: string
}

export function Canvas({ workflowId: _workflowId }: CanvasProps = {}) {
  const { resolvedTheme } = useTheme()
  const isMounted = React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  )
  const [nodes, , onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  const onConnect = React.useCallback(
    (connection: Connection) => {
      setEdges((eds) => addEdge(connection, eds))
    },
    [setEdges]
  )

  const colorMode: ColorMode = React.useMemo(() => {
    if (!isMounted) return "light"
    return resolvedTheme === "dark" || resolvedTheme === "light"
      ? resolvedTheme
      : "system"
  }, [isMounted, resolvedTheme])

  return (
    <div className="size-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        colorMode={colorMode}
        fitView
        connectionLineType={ConnectionLineType.SmoothStep}
        connectionLineStyle={{ stroke: "var(--border)" }}
        defaultEdgeOptions={{
          type: "smoothstep",
          style: { stroke: "var(--border)" },
        }}
        style={
          {
            "--xy-background-color": "var(--background)",
            "--xy-edge-stroke-width": 2,
            "--xy-connectionline-stroke-width": 2,
          } as React.CSSProperties
        }
        maxZoom={1}
      >
        {/* <Background gap={16} size={1} /> */}
        <Controls />
        {/* <MiniMap /> */}
      </ReactFlow>
    </div>
  )
}
