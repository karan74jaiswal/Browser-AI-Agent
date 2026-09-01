"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  FileJson,
  Loader2,
  Upload,
  AlertCircle,
  CheckCircle2,
} from "lucide-react"
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
import { importWorkflowAction } from "@/features/workflows/actions"
import {
  parseAndValidateWorkflowJson,
  type WorkflowExportData,
} from "@/features/workflows/lib/workflow-export-import"
import { cn } from "@/lib/utils"

interface ImportWorkflowDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

function ImportWorkflowForm({ onClose }: { onClose: () => void }) {
  const router = useRouter()
  const [fileContent, setFileContent] = React.useState<string | null>(null)
  const [fileName, setFileName] = React.useState<string | null>(null)
  const [parsedData, setParsedData] = React.useState<WorkflowExportData | null>(
    null
  )
  const [workflowName, setWorkflowName] = React.useState<string>("")
  const [parseError, setParseError] = React.useState<string | null>(null)
  const [isPending, startTransition] = React.useTransition()
  const [isDragging, setIsDragging] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const processFile = (file: File) => {
    if (!file.name.endsWith(".json")) {
      setParseError("Please select a valid .json file")
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      setFileContent(content)
      setFileName(file.name)

      const validation = parseAndValidateWorkflowJson(content)
      if (!validation.success || !validation.data) {
        setParseError(validation.error || "Invalid workflow JSON structure")
        setParsedData(null)
      } else {
        setParseError(null)
        setParsedData(validation.data)
        setWorkflowName(validation.data.name)
      }
    }
    reader.onerror = () => {
      setParseError("Failed to read the file")
    }
    reader.readAsText(file)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      processFile(file)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) {
      processFile(file)
    }
  }

  const handleImport = (e: React.SyntheticEvent) => {
    e.preventDefault()
    if (!fileContent || !parsedData) return

    // If user edited the workflow name in the input, update the parsed payload
    const finalPayload = {
      ...parsedData,
      name: workflowName.trim() || parsedData.name || "Imported Workflow",
    }
    const finalContentString = JSON.stringify(finalPayload)

    startTransition(async () => {
      try {
        const workflow = await importWorkflowAction(finalContentString)
        toast.success(`Workflow "${workflow.name}" imported successfully`)
        onClose()
        router.push(`/workflows/${workflow.id}`)
      } catch (error) {
        Sentry.logger.error("Failed to import workflow", {
          reason: error instanceof Error ? error.message : String(error),
        })
        const message =
          error instanceof Error ? error.message : "Failed to import workflow"
        toast.error(message)
      }
    })
  }

  return (
    <form onSubmit={handleImport}>
      <DialogHeader>
        <DialogTitle>Import workflow</DialogTitle>
        <DialogDescription>
          Upload a workflow JSON file to import it into your organization.
        </DialogDescription>
      </DialogHeader>

      <div className="grid gap-4 py-4">
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          className="hidden"
          onChange={handleFileChange}
          disabled={isPending}
        />

        {!parsedData ? (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-6 text-center transition-colors",
              isDragging
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50 hover:bg-accent/50",
              parseError && "border-destructive/50 bg-destructive/5"
            )}
          >
            <div className="flex size-10 items-center justify-center rounded-full bg-secondary">
              <Upload className="size-5 text-muted-foreground" />
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium">
                Click to select or drag and drop a workflow file
              </p>
              <p className="text-xs text-muted-foreground">
                Accepts .json exported files
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between rounded-lg border border-border bg-card p-3">
              <div className="flex items-center gap-2.5">
                <div className="flex size-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <FileJson className="size-4" />
                </div>
                <div className="flex flex-col">
                  <span className="max-w-56 truncate text-sm font-medium">
                    {fileName}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {parsedData.graph.nodes.length} steps ·{" "}
                    {parsedData.graph.edges.length} connections
                  </span>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFileContent(null)
                  setFileName(null)
                  setParsedData(null)
                  setWorkflowName("")
                  setParseError(null)
                  fileInputRef.current?.click()
                }}
                disabled={isPending}
                className="text-xs"
              >
                Change
              </Button>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="import-name" className="text-xs font-medium">
                Workflow name
              </Label>
              <Input
                id="import-name"
                value={workflowName}
                onChange={(e) => setWorkflowName(e.target.value)}
                placeholder="e.g. Scrape & Email Pipeline"
                disabled={isPending}
                className="text-sm"
              />
            </div>

            <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-500">
              <CheckCircle2 className="size-3.5" />
              <span>Valid workflow structure</span>
            </div>
          </div>
        )}

        {parseError && (
          <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-2.5 text-xs text-destructive">
            <AlertCircle className="size-4 shrink-0" />
            <span>{parseError}</span>
          </div>
        )}
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
          disabled={!parsedData || Boolean(parseError) || isPending}
        >
          {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
          Import Workflow
        </Button>
      </DialogFooter>
    </form>
  )
}

export function ImportWorkflowDialog({
  open,
  onOpenChange,
}: ImportWorkflowDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {open && <ImportWorkflowForm onClose={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  )
}
