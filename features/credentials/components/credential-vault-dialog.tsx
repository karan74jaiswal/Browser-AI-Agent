"use client"

import * as React from "react"
import {
  KeyRound,
  Plus,
  Trash2,
  Copy,
  Check,
  ShieldLock,
  Eye,
  EyeOff,
  Loader2,
  Lock,
} from "lucide-react"
import { toast } from "sonner"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  createCredentialAction,
  deleteCredentialAction,
} from "../actions"
import type { SafeCredential } from "../data"
import { useCredentials } from "./credentials-provider"

export function CredentialVaultDialog({
  trigger,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
  prefillName,
  onSuccess,
}: {
  trigger?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  prefillName?: string
  onSuccess?: (created: SafeCredential) => void
}) {
  const [internalOpen, setInternalOpen] = React.useState(false)
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : internalOpen
  const setOpen = isControlled ? setControlledOpen! : setInternalOpen

  const {
    credentials,
    isLoading,
    addCredentialToState,
    removeCredentialFromState,
  } = useCredentials()

  const [isCreating, setIsCreating] = React.useState(false)
  const [showAddForm, setShowAddForm] = React.useState(false)
  const [copiedId, setCopiedId] = React.useState<string | null>(null)

  // Form state
  const [name, setName] = React.useState("")
  const [value, setValue] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [showSecret, setShowSecret] = React.useState(false)

  // Handle prefill parameters when opening the dialog
  React.useEffect(() => {
    if (open) {
      if (prefillName) {
        setName(prefillName)
        setShowAddForm(true)
      } else {
        setName("")
        setValue("")
        setDescription("")
        setShowAddForm(false)
      }
    }
  }, [open, prefillName])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !value.trim()) {
      toast.error("Name and Secret Value are required")
      return
    }

    setIsCreating(true)
    try {
      const created = await createCredentialAction({
        name,
        type: "secret",
        value,
        description: description.trim() || undefined,
      })

      addCredentialToState(created)
      onSuccess?.(created)
      toast.success(`Credential "${created.name}" stored securely`)
      setName("")
      setValue("")
      setDescription("")
      setShowAddForm(false)
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to store credential"
      )
    } finally {
      setIsCreating(false)
    }
  }

  const handleDelete = async (id: string, credName: string) => {
    try {
      await deleteCredentialAction(id)
      removeCredentialFromState(id)
      toast.success(`Credential "${credName}" deleted`)
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete credential"
      )
    }
  }

  const copyTokenReference = (credName: string, id: string) => {
    const token = `{{ secrets.${credName} }}`
    navigator.clipboard.writeText(token)
    setCopiedId(id)
    toast.success(`Copied ${token} to clipboard`)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? (
        <DialogTrigger asChild>{trigger}</DialogTrigger>
      ) : null}
      <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex size-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                <Lock className="size-4.5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold">
                  Organization Credential Vault
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  AES-256-GCM encrypted secrets available across your workflows and cloud sandboxes.
                </DialogDescription>
              </div>
            </div>
            {!showAddForm && (
              <Button
                size="sm"
                onClick={() => setShowAddForm(true)}
                className="gap-1.5 h-8 text-xs"
              >
                <Plus className="size-3.5" />
                Add Secret
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {showAddForm && (
            <form
              onSubmit={handleCreate}
              className="rounded-lg border bg-muted/30 p-4 space-y-3.5 animate-in fade-in-50 duration-200"
            >
              <div className="flex items-center justify-between pb-1 border-b">
                <span className="text-xs font-semibold text-foreground">
                  New Organization Secret
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAddForm(false)}
                  className="h-6 px-2 text-xs text-muted-foreground"
                >
                  Cancel
                </Button>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cred-name" className="text-xs">
                  Secret Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="cred-name"
                  placeholder="OPENAI_API_KEY"
                  value={name}
                  onChange={(e) => setName(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, "_"))}
                  className="h-8 font-mono text-xs uppercase"
                  required
                />
                <p className="text-[10px] text-muted-foreground">
                  Referenced in workflows as <code className="text-amber-600 dark:text-amber-400 font-mono">{"{{ secrets." + (name || "NAME") + " }}"}</code> or <code className="text-amber-600 dark:text-amber-400 font-mono">{"process.env." + (name || "NAME")}</code>
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cred-value" className="text-xs">
                  Secret Value <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="cred-value"
                    type={showSecret ? "text" : "password"}
                    placeholder="sk-proj-..."
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    className="h-8 font-mono text-xs pr-8"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowSecret(!showSecret)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showSecret ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cred-desc" className="text-xs">
                  Description <span className="text-[10px] text-muted-foreground">(Optional)</span>
                </Label>
                <Input
                  id="cred-desc"
                  placeholder="Production OpenAI API key with GPT-4 access"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddForm(false)}
                  className="h-8 text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isCreating || !name.trim() || !value.trim()}
                  className="h-8 text-xs gap-1.5"
                >
                  {isCreating ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <ShieldLock className="size-3.5" />
                  )}
                  Save Encrypted Secret
                </Button>
              </div>
            </form>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : credentials.length === 0 && !showAddForm ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground mb-3">
                <KeyRound className="size-6" />
              </div>
              <h3 className="text-sm font-medium text-foreground">No secrets stored yet</h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                Add your API keys and secrets here. They are AES-256-GCM encrypted and securely injected into your workflows and sandboxes.
              </p>
              <Button
                size="sm"
                onClick={() => setShowAddForm(true)}
                className="mt-4 gap-1.5 h-8 text-xs"
              >
                <Plus className="size-3.5" />
                Add Your First Secret
              </Button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {credentials.map((cred) => (
                <div
                  key={cred.id}
                  className="flex items-center justify-between rounded-lg border p-3 bg-card hover:bg-muted/20 transition-colors"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground mt-0.5">
                      <KeyRound className="size-4" />
                    </div>
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-semibold text-foreground truncate">
                          {cred.name}
                        </span>
                        <span className="text-[11px] font-mono text-muted-foreground">
                          ••••{cred.lastFour}
                        </span>
                      </div>
                      {cred.description && (
                        <p className="text-[11px] text-muted-foreground truncate">
                          {cred.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => copyTokenReference(cred.name, cred.id)}
                      title={`Copy {{ secrets.${cred.name} }}`}
                      className="size-7 text-muted-foreground hover:text-foreground"
                    >
                      {copiedId === cred.id ? (
                        <Check className="size-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="size-3.5" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(cred.id, cred.name)}
                      title="Delete credential"
                      className="size-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
