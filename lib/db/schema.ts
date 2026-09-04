import {
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core"
import { Edge } from "@xyflow/react"
import { type StepNodeType } from "@/features/workflows/system"

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
export type WorkflowSummary = Omit<Workflow, "graph">

export const credentials = pgTable(
  "credentials",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: text("org_id").notNull(),
    name: text("name").notNull(),
    type: text("type").default("generic").notNull(),
    description: text("description"),
    encryptedValue: text("encrypted_value").notNull(),
    iv: text("iv").notNull(),
    authTag: text("auth_tag").notNull(),
    lastFour: text("last_four").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("credentials_org_id_idx").on(table.orgId),
    index("credentials_org_id_name_idx").on(table.orgId, table.name),
  ]
)

export type Credential = typeof credentials.$inferSelect
export type NewCredential = typeof credentials.$inferInsert
