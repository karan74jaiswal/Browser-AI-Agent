import { wait } from "@trigger.dev/sdk"

export async function waitNode({ seconds }: { seconds?: string | number }) {
  const raw = typeof seconds === "number" ? seconds : parseFloat(String(seconds || "1"))
  const parsedSeconds = isNaN(raw) || raw < 0 ? 1 : raw

  await wait.for({ seconds: parsedSeconds })

  return {
    seconds: parsedSeconds,
    completedAt: new Date().toISOString(),
  }
}
