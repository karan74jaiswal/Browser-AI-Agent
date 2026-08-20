import { config } from "dotenv"
import { neon } from "@neondatabase/serverless"
import { drizzle } from "drizzle-orm/neon-http"
import { migrate } from "drizzle-orm/neon-http/migrator"

config({ path: ".env.local" })
config({ path: ".env" })

const connectionString =
  process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL

if (!connectionString) {
  throw new Error("DATABASE_URL_UNPOOLED or DATABASE_URL is not set")
}

const sql = neon(connectionString)
const db = drizzle(sql)

const main = async () => {
  try {
    console.log("Applying migrations via Neon HTTP driver...")
    await migrate(db, { migrationsFolder: "drizzle" })
    console.log("Migration completed successfully.")
  } catch (error) {
    console.error("Error during migration:", error)
    process.exit(1)
  }
}

main()
