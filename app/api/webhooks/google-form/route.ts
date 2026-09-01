import { NextRequest, NextResponse } from "next/server"
import { clerkClient } from "@clerk/nextjs/server"
import { tasks } from "@trigger.dev/sdk"
import { z } from "zod/v4"
import * as Sentry from "@sentry/nextjs"
import { getWorkflow } from "@/features/workflows/data"
import type { runWorkflowTask } from "@/features/workflows/tasks/run-workflow"

const GoogleFormPayloadSchema = z.object({
  formId: z.string().optional().default(""),
  formTitle: z.string().optional().default(""),
  responseId: z.string().optional().default(""),
  timestamp: z.string().optional().default(""),
  respondentEmail: z.string().nullable().optional().default(""),
  responses: z.record(z.string(), z.unknown()).optional().default({}),
})

export async function POST(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const workflowId = searchParams.get("workflowId")
    const orgId = searchParams.get("orgId")
    const secret = searchParams.get("secret")

    if (!workflowId || !orgId) {
      return NextResponse.json(
        { error: "Missing required workflowId or orgId query parameters" },
        { status: 400 }
      )
    }

    if (!secret) {
      return NextResponse.json(
        { error: "Missing required secret authentication token" },
        { status: 401 }
      )
    }

    // 1. Fetch and verify the workflow scoped to the organization
    const workflow = await getWorkflow(orgId, workflowId)
    if (!workflow) {
      return NextResponse.json(
        { error: "Workflow not found for the specified organization" },
        { status: 404 }
      )
    }

    // 2. Locate the Google Form trigger node on the canvas
    const triggerNode = workflow.graph?.nodes.find(
      (node) => node.data?.type === "google-form-trigger"
    )

    if (!triggerNode) {
      return NextResponse.json(
        {
          error: "This workflow does not contain an active Google Form trigger",
        },
        { status: 400 }
      )
    }

    // 3. Verify the secret token
    const expectedSecret = triggerNode.data.values?.secret
    if (!expectedSecret || expectedSecret !== secret) {
      return NextResponse.json(
        { error: "Unauthorized: Invalid secret token" },
        { status: 401 }
      )
    }

    // 4. Verify Organization exists in Clerk
    const client = await clerkClient()
    const org = await client.organizations.getOrganization({
      organizationId: orgId,
    })

    if (!org) {
      return NextResponse.json(
        { error: "Organization not found for the specified orgId" },
        { status: 404 }
      )
    }

    // 5. Parse and validate the incoming form submission payload
    const rawBody = await req.json().catch(() => null)
    const parseResult = GoogleFormPayloadSchema.safeParse(rawBody ?? {})

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: "Invalid payload format",
          details: parseResult.error.format(),
        },
        { status: 400 }
      )
    }

    const payload = parseResult.data
    const respondentEmail = (payload.respondentEmail ?? "").trim()
    const accessMode = triggerNode.data.values?.accessMode ?? "private"

    // 6. Enforce Private vs Public Access Control
    if (accessMode === "private") {
      if (!respondentEmail) {
        return NextResponse.json(
          {
            error:
              "Submission rejected: Private triggers require a verified respondent email. Please ensure 'Collect email addresses' is enabled in your Google Form settings or include an Email field.",
          },
          { status: 403 }
        )
      }

      // Query Clerk organization memberships to ensure the email belongs to an organization member
      const memberships =
        await client.organizations.getOrganizationMembershipList({
          organizationId: orgId,
          limit: 100,
        })

      const normalizedRespondent = respondentEmail.toLowerCase()
      const isMember = memberships.data.some((m) => {
        const identifier = m.publicUserData?.identifier?.toLowerCase()
        return identifier === normalizedRespondent
      })

      if (!isMember) {
        return NextResponse.json(
          {
            error: `Unauthorized: The submitting email (${respondentEmail}) is not a registered member of this organization.`,
          },
          { status: 403 }
        )
      }
    }

    // 7. Trigger the background workflow run via Trigger.dev
    const handle = await tasks.trigger<typeof runWorkflowTask>(
      "run-workflow",
      {
        workflowId: workflow.id,
        orgId: workflow.orgId,
        triggerData: {
          ...payload,
          respondentEmail,
        },
      },
      {
        tags: [
          `workflow:${workflow.id}`,
          `org:${workflow.orgId}`,
          "trigger:google-form",
        ],
        ...(payload.responseId
          ? { idempotencyKey: `gform:${workflow.id}:${payload.responseId}` }
          : {}),
      }
    )

    Sentry.logger.info("Google Form webhook triggered workflow run", {
      "workflow.id": workflow.id,
      "org.id": workflow.orgId,
      "run.id": handle.id,
      accessMode,
    })

    return NextResponse.json({
      success: true,
      runId: handle.id,
      message: "Workflow triggered successfully",
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    Sentry.captureException(error)
    return NextResponse.json(
      { error: "Internal server error", message },
      { status: 500 }
    )
  }
}
