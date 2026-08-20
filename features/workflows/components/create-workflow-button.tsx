"use client"

import * as React from "react"
import { Loader2, PlusIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createWorkflowAction } from "@/features/workflows/actions"
import { generateSlug } from "@/features/workflows/lib/generate-slug"

export function CreateWorkflowButton({
  children,
  className,
  ...props
}: React.ComponentProps<typeof Button>) {
  const [isPending, startTransition] = React.useTransition()

  const handleCreate = () => {
    const name = generateSlug()
    startTransition(async () => {
      await createWorkflowAction(name)
    })
  }

  return (
    <Button
      onClick={handleCreate}
      disabled={isPending}
      className={className}
      {...props}
    >
      {isPending ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <PlusIcon className="size-4" />
      )}
      {children ?? "New workflow"}
    </Button>
  )
}
