import { index, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core"
import { Edge } from "@xyflow/react"
import { StepNodeType } from "@/features/workflows/nodes/node-registry"

export interface WorkflowGraph {
  nodes: StepNodeType[]
  edges: Edge[]
}
export const workflows = pgTable(
  "workflows",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: text("org_id").notNull(),
    name: text("name").notNull(),
    graph: jsonb("graph").$type<WorkflowGraph>(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("workflows_org_id_idx").on(table.orgId),
    index("workflows_org_id_created_at_idx").on(table.orgId, table.createdAt),
  ]
)

export type Workflow = typeof workflows.$inferSelect
export type NewWorkflow = typeof workflows.$inferInsert
