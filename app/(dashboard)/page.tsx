import { PlusIcon, WorkflowIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

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
            Select a workflow from the sidebar or create a new one to get started.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent className="mt-2">
          <Button className="h-9 px-4 font-medium">
            <PlusIcon className="size-4" />
            New workflow
          </Button>
        </EmptyContent>
      </Empty>
    </div>
  )
}
