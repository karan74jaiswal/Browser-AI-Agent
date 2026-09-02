import type { Metadata } from "next"
import Link from "next/link"
import { Sparkles, WorkflowIcon } from "lucide-react"

export const metadata: Metadata = {
  title: "Workflows",
  description: "Create, orchestrate, and manage your autonomous AI workflows.",
}

import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Button } from "@/components/ui/button"
import { CreateWorkflowButton } from "@/features/workflows/components/create-workflow-button"

export default function Page() {
  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <Empty className="max-w-md">
        <EmptyHeader>
          <EmptyMedia
            variant="icon"
            className="mb-3 size-12 rounded-xl bg-muted/80 text-foreground shadow-xs"
          >
            <WorkflowIcon className="size-5" />
          </EmptyMedia>
          <EmptyTitle className="text-base font-semibold text-foreground">
            No workflow selected
          </EmptyTitle>
          <EmptyDescription className="max-w-xs text-sm text-muted-foreground">
            Select a workflow from the sidebar, create a new one, or explore our pre-built templates.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent className="mt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5">
          <CreateWorkflowButton className="h-9 px-4 font-medium w-full sm:w-auto" />
          <Button
            asChild
            variant="outline"
            className="h-9 px-4 font-medium gap-1.5 w-full sm:w-auto text-xs"
          >
            <Link href="/templates">
              <Sparkles className="size-3.5 text-primary" />
              <span>Browse Templates</span>
            </Link>
          </Button>
        </EmptyContent>
      </Empty>
    </div>
  )
}
