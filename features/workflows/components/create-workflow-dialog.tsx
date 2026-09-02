"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import * as Sentry from "@sentry/nextjs"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createWorkflowAction as defaultCreateWorkflowAction } from "@/features/workflows/actions"
import { generateSlug } from "@/features/workflows/lib/generate-slug"

interface CreateWorkflowDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  createWorkflowAction?: (
    name: string
  ) => Promise<{ id: string } | null | void | unknown>
}

function CreateWorkflowForm({
  onClose,
  createWorkflowAction,
}: {
  onClose: () => void
  createWorkflowAction: (
    name: string
  ) => Promise<{ id: string } | null | void | unknown>
}) {
  const router = useRouter()
  const [name, setName] = React.useState(() => generateSlug())
  const [isPending, startTransition] = React.useTransition()

  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault()
    const targetName = name.trim() || generateSlug()

    startTransition(async () => {
      try {
        const workflow = (await createWorkflowAction(targetName)) as
          { id: string } | undefined
        onClose()
        toast.success("Workflow created")
        if (workflow?.id) {
          router.push(`/workflows/${workflow.id}`)
        }
      } catch (error) {
        Sentry.logger.error("Failed to create workflow", {
          reason: error instanceof Error ? error.message : String(error),
        })
        const message =
          error instanceof Error ? error.message : "Failed to create workflow"
        toast.error(message)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle>Create workflow</DialogTitle>
        <DialogDescription>
          Enter a name for your workflow, or use the prefilled name.
        </DialogDescription>
      </DialogHeader>

      <div className="grid gap-2 py-4">
        <Label htmlFor="workflow-name" className="text-xs font-medium">
          Workflow name
        </Label>
        <Input
          id="workflow-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. brave-otter"
          disabled={isPending}
          autoFocus
          className="text-sm"
        />
      </div>

      <DialogFooter className="gap-2 sm:gap-0">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={isPending}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
          Create workflow
        </Button>
      </DialogFooter>

      <div className="flex items-center justify-between pt-3 mt-3 text-xs text-muted-foreground border-t border-border/50">
        <span>Want a pre-built automation?</span>
        <button
          type="button"
          onClick={() => {
            onClose()
            router.push("/templates")
          }}
          className="text-primary font-medium hover:underline cursor-pointer inline-flex items-center gap-1"
        >
          Browse Templates &rarr;
        </button>
      </div>
    </form>
  )
}

export function CreateWorkflowDialog({
  open,
  onOpenChange,
  createWorkflowAction = defaultCreateWorkflowAction,
}: CreateWorkflowDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {open && (
          <CreateWorkflowForm
            onClose={() => onOpenChange(false)}
            createWorkflowAction={createWorkflowAction}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
