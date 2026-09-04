import type { Stagehand } from "@browserbasehq/stagehand"
import { z } from "zod/v4"

const ExtractSchema = z.object({
  result: z
    .string()
    .describe(
      "The extracted data, text, or information from the page matching the user's instruction. If no matching information is found, return an empty string."
    ),
})

export async function extract({
  stagehand,
  instruction,
}: {
  stagehand: Stagehand
  instruction: string
}) {
  const { data } = await stagehand.extract(instruction, ExtractSchema)
  return {
    result: data.result ?? "",
  }
}
