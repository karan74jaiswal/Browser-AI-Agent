"use client"

import * as React from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
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
import { updateWorkflowNameAction } from "@/features/workflows/actions"

interface EditWorkflowDialogProps {
  workflowId: string
  initialName: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

function EditWorkflowForm({
  workflowId,
  initialName,
  onClose,
}: {
  workflowId: string
  initialName: string
  onClose: () => void
}) {
  const [name, setName] = React.useState(initialName)
  const [isPending, startTransition] = React.useTransition()

  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault()
    const trimmedName = name.trim()
    if (!trimmedName) return

    startTransition(async () => {
      try {
        await updateWorkflowNameAction(workflowId, trimmedName)
        toast.success("Workflow renamed")
        onClose()
      } catch (error) {
        console.error("Failed to rename workflow:", error)
        toast.error("Failed to rename workflow")
      }
    })
  }

  return (
    <form onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle>Rename workflow</DialogTitle>
        <DialogDescription>Change the name of this workflow.</DialogDescription>
      </DialogHeader>

      <div className="grid gap-2 py-4">
        <Label htmlFor="edit-workflow-name" className="text-xs font-medium">
          Workflow name
        </Label>
        <Input
          id="edit-workflow-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Workflow name"
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
        <Button
          type="submit"
          disabled={isPending || !name.trim() || name.trim() === initialName}
        >
          {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
          Save
        </Button>
      </DialogFooter>
    </form>
  )
}

export function EditWorkflowDialog({
  workflowId,
  initialName,
  open,
  onOpenChange,
}: EditWorkflowDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {open && (
          <EditWorkflowForm
            workflowId={workflowId}
            initialName={initialName}
            onClose={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
