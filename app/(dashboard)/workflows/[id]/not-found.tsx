import Link from "next/link"
import { ArrowLeftIcon, WorkflowIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

export default function NotFound() {
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
            Workflow not found
          </EmptyTitle>
          <EmptyDescription className="max-w-xs text-sm text-muted-foreground">
            The workflow you are looking for does not exist or has been removed.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent className="mt-2">
          <Button asChild className="h-9 px-4 font-medium">
            <Link href="/">
              <ArrowLeftIcon className="size-4" />
              Back to dashboard
            </Link>
          </Button>
        </EmptyContent>
      </Empty>
    </div>
  )
}
