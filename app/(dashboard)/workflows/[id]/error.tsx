"use client"

import * as React from "react"
import { AlertCircleIcon, RotateCcwIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function Error({ error, reset }: ErrorProps) {
  React.useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <Empty className="max-w-md">
        <EmptyHeader>
          <EmptyMedia
            variant="icon"
            className="mb-3 size-12 rounded-xl bg-destructive/10 text-destructive shadow-xs"
          >
            <AlertCircleIcon className="size-5" />
          </EmptyMedia>
          <EmptyTitle className="text-base font-semibold text-foreground">
            Something went wrong
          </EmptyTitle>
          <EmptyDescription className="max-w-xs text-sm text-muted-foreground">
            {error.message ||
              "An unexpected error occurred while loading the workflow."}
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent className="mt-2">
          <Button onClick={() => reset()} className="h-9 px-4 font-medium">
            <RotateCcwIcon className="size-4" />
            Try again
          </Button>
        </EmptyContent>
      </Empty>
    </div>
  )
}
