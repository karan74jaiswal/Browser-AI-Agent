import { config } from "dotenv"
import { defineConfig } from "drizzle-kit"

config({ path: ".env.local" })
config({ path: ".env" })

const connectionString =
  process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL

if (!connectionString) {
  throw new Error(
    "DATABASE_URL_UNPOOLED or DATABASE_URL is not set in environment variables"
  )
}

export default defineConfig({
  schema: ".lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: connectionString,
  },
})
