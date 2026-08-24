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
import { type StepNodeType } from "@/features/workflows/nodes/node-registry"
import { useLiveblocksFlow, Cursors } from "@liveblocks/react-flow"
import { AvatarStack } from "@liveblocks/react-ui"
import "@xyflow/react/dist/style.css"
import "@liveblocks/react-ui/styles.css"
import "@liveblocks/react-flow/styles.css"

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

interface CanvasProps {
  workflowId?: string
}

export function Canvas({ workflowId }: CanvasProps) {
  // console.log(workflowId)
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
        <Cursors />
        <Controls />
        <Panel position="top-right">
          <AvatarStack />
        </Panel>
      </ReactFlow>
    </div>
  )
}
