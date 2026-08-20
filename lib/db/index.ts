import { neon } from "@neondatabase/serverless"
import { drizzle } from "drizzle-orm/neon-http"
import { parseEnv } from "@neon/env"

import neonConfig from "@/neon"
import * as schema from "./schema"

const { postgres } = parseEnv(neonConfig, ["DATABASE_URL"])

const client = neon(postgres.databaseUrl)

export const db = drizzle(client, { schema })
export * from "./schema"
