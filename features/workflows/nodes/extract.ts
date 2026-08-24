import type { Stagehand } from "@browserbasehq/stagehand"

export async function extract({
  stagehand,
  instruction,
}: {
  stagehand: Stagehand
  instruction: string
}) {
  try {
    const { data } = await stagehand.extract(instruction)
    return {
      result: data.extraction ?? "",
    }
  } catch (err: unknown) {
    const serializedError =
      err instanceof Error
        ? {
            name: err.name,
            message: err.message,
            stack: err.stack,
            cause: err.cause,
            ...(err as unknown as Record<string, unknown>),
          }
        : err
    console.error("Extract node failed. Detailed error:", serializedError)
    throw err
  }
}
