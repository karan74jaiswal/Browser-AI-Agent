"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { deleteWorkflowAction } from "@/features/workflows/actions"

interface DeleteWorkflowDialogProps {
  workflowId: string
  workflowName?: string
  open: boolean
  onOpenChange: (open: boolean) => void
  redirectOnDelete?: boolean
}

export function DeleteWorkflowDialog({
  workflowId,
  workflowName,
  open,
  onOpenChange,
  redirectOnDelete = true,
}: DeleteWorkflowDialogProps) {
  const router = useRouter()
  const [isPending, startTransition] = React.useTransition()

  const handleDelete = () => {
    startTransition(async () => {
      try {
        await deleteWorkflowAction(workflowId)
        toast.success("Workflow deleted")
        onOpenChange(false)
        if (redirectOnDelete) {
          router.push("/")
        }
      } catch (error) {
        console.error("Failed to delete workflow:", error)
        toast.error("Failed to delete workflow")
      }
    })
  }

  return (
    <AlertDialog open={open} onOpenChange={(val) => !isPending && onOpenChange(val)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete workflow</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete {workflowName ? `"${workflowName}"` : "this workflow"}? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isPending}
          >
            {isPending && <Loader2 className="size-4 animate-spin mr-2" />}
            Delete
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
