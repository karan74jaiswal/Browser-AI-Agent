"use client"

import * as React from "react"
import { PlusIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CreateWorkflowDialog } from "./create-workflow-dialog"

export function CreateWorkflowButton({
  children,
  className,
  ...props
}: React.ComponentProps<typeof Button>) {
  const [open, setOpen] = React.useState(false)

  return (
    <>
      <Button onClick={() => setOpen(true)} className={className} {...props}>
        <PlusIcon className="size-4" />
        {children ?? "New workflow"}
      </Button>
      <CreateWorkflowDialog open={open} onOpenChange={setOpen} />
    </>
  )
}
