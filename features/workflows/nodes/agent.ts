import type { Stagehand } from "@browserbasehq/stagehand"
import { z } from "zod/v4"

const AgentAssessmentSchema = z.object({
  isCompleted: z
    .boolean()
    .describe("Whether the overall objective has been fully achieved on this page."),
  summary: z
    .string()
    .describe("Brief summary of current progress or explanation of the state."),
  nextActionInstruction: z
    .string()
    .describe(
      "The single atomic action instruction to perform next (e.g. 'Click the submit button'). Return empty string if already completed."
    ),
})

export async function agent({
  stagehand,
  instruction,
  maxSteps = 10,
}: {
  stagehand: Stagehand
  instruction: string
  maxSteps?: number
}) {
  let lastSummary = ""
  let completed = false

  for (let step = 0; step < maxSteps; step++) {
    let assessment: z.infer<typeof AgentAssessmentSchema> | undefined

    try {
      const res = await stagehand.extract(
        `Goal: "${instruction}".
Evaluate the current page state. Has this goal been completely achieved? If not, what single atomic action should be taken next?`,
        AgentAssessmentSchema
      )
      assessment = res.data
    } catch {
      // If extract fails on step 0, fallback to direct atomic action
      if (step === 0) {
        const actRes = await stagehand.act(instruction)
        lastSummary = actRes.data.message
        completed = actRes.data.success
        return {
          success: completed,
          message: lastSummary || (completed ? "Action completed" : "Action failed"),
          completed,
        }
      }
      break
    }

    if (!assessment) break

    lastSummary = assessment.summary

    if (assessment.isCompleted) {
      completed = true
      break
    }

    if (!assessment.nextActionInstruction) {
      break
    }

    try {
      // Observe-then-Act pattern: find candidate action for deterministic execution
      const { data: actions } = await stagehand.observe(
        assessment.nextActionInstruction
      )
      const [candidate] = actions ?? []

      if (candidate) {
        const actResult = await stagehand.act(candidate)
        if (!actResult.data.success) {
          lastSummary =
            actResult.data.message ||
            `Failed step: ${assessment.nextActionInstruction}`
        }
      } else {
        const actResult = await stagehand.act(assessment.nextActionInstruction)
        if (!actResult.data.success) {
          lastSummary =
            actResult.data.message ||
            `Failed step: ${assessment.nextActionInstruction}`
        }
      }
    } catch (actErr) {
      lastSummary =
        actErr instanceof Error
          ? actErr.message
          : `Failed step: ${assessment.nextActionInstruction}`
      break
    }
  }

  // Final check to confirm completion if not already marked
  if (!completed && lastSummary) {
    try {
      const { data: finalCheck } = await stagehand.extract(
        `Goal: "${instruction}". Has this goal been successfully accomplished on the current page?`,
        z.object({
          isCompleted: z.boolean(),
          summary: z.string(),
        })
      )
      completed = finalCheck.isCompleted
      if (finalCheck.summary) {
        lastSummary = finalCheck.summary
      }
    } catch {
      // Retain lastSummary
    }
  }

  return {
    success: completed,
    message:
      lastSummary ||
      (completed
        ? "Goal completed successfully"
        : "Agent reached maximum steps without full completion"),
    completed,
  }
}
