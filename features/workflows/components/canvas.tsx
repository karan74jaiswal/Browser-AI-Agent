"use client"

import * as React from "react"
import {
  ReactFlow,
  Controls,
  addEdge,
  useNodesState,
  useEdgesState,
  type Connection,
  type Edge,
  type ColorMode,
  ConnectionLineType,
  NodeTypes,
} from "@xyflow/react"
import { useTheme } from "next-themes"
import { StepNode } from "@/features/workflows/components/step-node"
import { type StepNodeType } from "@/features/workflows/nodes/node-registry"
import "@xyflow/react/dist/style.css"

const emptySubscribe = () => () => {}

const nodeTypes: NodeTypes = { step: StepNode }
const initialNodes: StepNodeType[] = [
  {
    id: "1",
    type: "step",
    data: { kind: "trigger", title: "Start", type: "start", values: {} },
    position: { x: 0, y: 0 },
  },
]

const initialEdges: Edge[] = []

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
        nodeTypes={nodeTypes}
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
        proOptions={{
          hideAttribution: true,
        }}
      >
        <Controls />
        {/* <MiniMap /> */}
      </ReactFlow>
    </div>
  )
}
