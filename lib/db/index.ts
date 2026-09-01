import { neon } from "@neondatabase/serverless"
import { drizzle } from "drizzle-orm/neon-http"
import { parseEnv } from "@neon/env"

import neonConfig from "@/neon"
import * as schema from "./schema"

let dbUrl = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL
if (!dbUrl) {
  try {
    const { postgres } = parseEnv(neonConfig, ["DATABASE_URL"])
    dbUrl = postgres.databaseUrl
  } catch {
    dbUrl = "postgres://placeholder:placeholder@localhost:5432/placeholder"
  }
}

const client = neon(dbUrl)

export const db = drizzle(client, { schema })
export * from "./schema"
