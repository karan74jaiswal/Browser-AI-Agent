"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useOrganization, useOrganizationList } from "@clerk/nextjs"
import { useProPlan } from "@/features/workflows/hooks/use-pro-plan"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"
import {
  Check,
  ChevronsUpDown,
  Image as ImageIcon,
  Plus,
  Sparkles,
  Upload,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

export function CustomOrgSwitcher({ className }: { className?: string }) {
  const router = useRouter()
  const { isLoaded: listLoaded, userMemberships, setActive, createOrganization } =
    useOrganizationList({
      userMemberships: {
        infinite: true,
      },
    })
  const { organization: activeOrg, isLoaded: orgLoaded } = useOrganization()
  const { isPro } = useProPlan()

  const [isPopoverOpen, setIsPopoverOpen] = React.useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false)
  const [isSwitching, setIsSwitching] = React.useState(false)

  // Create Org Form State
  const [name, setName] = React.useState("")
  const [slug, setSlug] = React.useState("")
  const [logoFile, setLogoFile] = React.useState<File | null>(null)
  const [logoPreview, setLogoPreview] = React.useState<string | null>(null)
  const [isCreating, setIsCreating] = React.useState(false)
  const [createError, setCreateError] = React.useState<string | null>(null)

  const fileInputRef = React.useRef<HTMLInputElement>(null)

  // Auto-generate slug from name
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value
    setName(newName)
    const generatedSlug = newName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
    setSlug(generatedSlug)
  }

  // Handle Logo file pick
  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file")
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image file size must be less than 5MB")
      return
    }

    setLogoFile(file)
    const reader = new FileReader()
    reader.onload = () => {
      setLogoPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const removeLogo = () => {
    setLogoFile(null)
    setLogoPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  // Switch Organization Context
  const handleSelectOrg = async (orgId: string) => {
    if (orgId === activeOrg?.id || !setActive) {
      setIsPopoverOpen(false)
      return
    }

    try {
      setIsSwitching(true)
      await setActive({
        organization: orgId,
        navigate: async ({ decorateUrl }) => {
          const url = decorateUrl("/workflows")
          if (url.startsWith("http")) {
            window.location.href = url
          } else {
            router.push(url)
            router.refresh()
          }
        },
      })
      setIsPopoverOpen(false)
      toast.success("Switched workspace")
    } catch (err) {
      console.error("Failed to switch workspace:", err)
      toast.error("Failed to switch workspace")
    } finally {
      setIsSwitching(false)
    }
  }

  // Create Organization Handler
  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!createOrganization || !name.trim()) return

    try {
      setIsCreating(true)
      setCreateError(null)

      // 1. Create org
      const newOrg = await createOrganization({
        name: name.trim(),
        slug: slug.trim() || undefined,
      })

      // 2. Upload logo if supplied
      if (logoFile && newOrg?.setLogo) {
        try {
          await newOrg.setLogo({ file: logoFile })
        } catch (logoErr) {
          console.warn("Logo upload failed, continuing:", logoErr)
        }
      }

      // 3. Set newly created org as active context
      if (setActive) {
        await setActive({
          organization: newOrg.id,
          navigate: async ({ decorateUrl }) => {
            const url = decorateUrl("/workflows")
            if (url.startsWith("http")) {
              window.location.href = url
            } else {
              router.push(url)
              router.refresh()
            }
          },
        })
      }

      toast.success(`Workspace "${newOrg.name}" created!`)
      setIsCreateDialogOpen(false)
      setIsPopoverOpen(false)
      setName("")
      setSlug("")
      removeLogo()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create organization"
      setCreateError(msg)
    } finally {
      setIsCreating(false)
    }
  }

  const getInitials = (orgName?: string | null) => {
    if (!orgName) return "W"
    return orgName
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const isInitialLoading = !listLoaded || !orgLoaded

  return (
    <>
      <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            disabled={isInitialLoading || isSwitching}
            className={cn(
              "flex w-full items-center justify-between gap-2.5 rounded-lg border border-transparent p-1.5 text-left transition-all hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus:outline-none focus:ring-1 focus:ring-sidebar-ring group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-1",
              className
            )}
          >
            <div className="flex min-w-0 items-center gap-2.5">
              <Avatar className="size-7 rounded-md border border-border bg-muted shrink-0">
                {activeOrg?.imageUrl && (
                  <AvatarImage src={activeOrg.imageUrl} alt={activeOrg.name} />
                )}
                <AvatarFallback className="rounded-md bg-gradient-to-br from-indigo-600 to-purple-700 text-[11px] font-bold text-white">
                  {getInitials(activeOrg?.name)}
                </AvatarFallback>
              </Avatar>

              <div className="flex min-w-0 flex-col group-data-[collapsible=icon]:hidden">
                <div className="flex items-center gap-1.5">
                  <span className="truncate text-xs font-semibold text-sidebar-foreground">
                    {activeOrg?.name || (isInitialLoading ? "Loading..." : "Personal Workspace")}
                  </span>
                  <Badge
                    variant={isPro ? "default" : "secondary"}
                    className={cn(
                      "h-4 px-1 text-[9px] font-bold uppercase tracking-wider",
                      isPro
                        ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-0"
                        : "bg-muted text-muted-foreground border-border"
                    )}
                  >
                    {isPro ? "PRO" : "FREE"}
                  </Badge>
                </div>
                <span className="truncate text-[10px] text-muted-foreground">
                  {activeOrg?.slug ? `${activeOrg.slug}.nodus.app` : "Default Workspace"}
                </span>
              </div>
            </div>

            <div className="flex items-center text-muted-foreground group-data-[collapsible=icon]:hidden">
              {isSwitching ? (
                <Spinner className="size-3.5" />
              ) : (
                <ChevronsUpDown className="size-3.5" />
              )}
            </div>
          </button>
        </PopoverTrigger>

        <PopoverContent
          side="bottom"
          align="start"
          sideOffset={6}
          className="w-64 border-border bg-popover p-1.5 text-popover-foreground shadow-xl backdrop-blur-md"
        >
          <div className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Workspaces
          </div>

          <div className="max-h-56 space-y-0.5 overflow-y-auto py-1">
            {userMemberships.data?.map((mem) => {
              const org = mem.organization
              const isCurrent = org.id === activeOrg?.id

              return (
                <button
                  key={org.id}
                  type="button"
                  onClick={() => handleSelectOrg(org.id)}
                  className={cn(
                    "flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-xs transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:outline-none",
                    isCurrent && "bg-accent/80 font-medium text-accent-foreground"
                  )}
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <Avatar className="size-6 rounded border border-border shrink-0">
                      {org.imageUrl && <AvatarImage src={org.imageUrl} alt={org.name} />}
                      <AvatarFallback className="rounded bg-muted text-[10px] font-bold text-muted-foreground">
                        {getInitials(org.name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="truncate text-foreground">{org.name}</span>
                  </div>

                  {isCurrent && <Check className="size-3.5 text-primary shrink-0" />}
                </button>
              )
            })}
          </div>

          <Separator className="my-1" />

          {/* Create Organization Button */}
          <button
            type="button"
            onClick={() => {
              setIsPopoverOpen(false)
              setIsCreateDialogOpen(true)
            }}
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:outline-none"
          >
            <Plus className="size-3.5" />
            <span>Create Organization</span>
          </button>
        </PopoverContent>
      </Popover>

      {/* Native Shadcn Dialog for Create Organization */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="border-border bg-card text-card-foreground sm:max-w-md shadow-xl">
          <DialogHeader className="space-y-1 text-left">
            <div className="flex size-10 items-center justify-center rounded-lg border border-border bg-muted/60 text-primary">
              <Sparkles className="size-5" />
            </div>
            <DialogTitle className="text-lg font-bold text-foreground">
              Create New Workspace
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Workspaces let your team collaborate on autonomous workflows, credentials, and replay logs.
            </DialogDescription>
          </DialogHeader>

          {createError && (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-2.5 text-xs text-destructive">
              <span>{createError}</span>
            </div>
          )}

          <form onSubmit={handleCreateOrg} className="space-y-4 pt-1">
            {/* Logo Upload */}
            <div className="flex items-center gap-4">
              <div className="relative flex size-14 shrink-0 items-center justify-center rounded-lg border border-dashed border-border bg-muted/40 overflow-hidden">
                {logoPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={logoPreview}
                    alt="Logo preview"
                    className="size-full object-cover"
                  />
                ) : (
                  <ImageIcon className="size-6 text-muted-foreground" />
                )}
                {logoPreview && (
                  <button
                    type="button"
                    onClick={removeLogo}
                    className="absolute right-1 top-1 rounded-full bg-background/80 p-0.5 text-muted-foreground hover:text-foreground"
                  >
                    <X className="size-3" />
                  </button>
                )}
              </div>

              <div className="space-y-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoSelect}
                  className="hidden"
                  id="org-logo-upload"
                />
                <Label
                  htmlFor="org-logo-upload"
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:bg-muted"
                >
                  <Upload className="size-3" />
                  <span>Upload Logo</span>
                </Label>
                <p className="text-[11px] text-muted-foreground">Square PNG or JPG up to 5MB</p>
              </div>
            </div>

            {/* Organization Name */}
            <div className="space-y-1.5">
              <Label htmlFor="org-name" className="text-xs font-medium text-foreground">
                Organization Name
              </Label>
              <Input
                id="org-name"
                type="text"
                value={name}
                onChange={handleNameChange}
                required
                placeholder="e.g. Acme Corp"
                className="h-9"
              />
            </div>

            {/* Slug Preview */}
            <div className="space-y-1">
              <Label className="text-xs font-medium text-foreground">Workspace URL</Label>
              <div className="flex h-9 items-center rounded-lg border border-input bg-muted/30 px-3 text-xs text-muted-foreground">
                <span>app.nodus.ai/</span>
                <span className="font-mono text-primary font-medium">
                  {slug || "workspace-slug"}
                </span>
              </div>
            </div>

            <DialogFooter className="pt-2 sm:justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
                disabled={isCreating}
                className="h-9 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isCreating || !name.trim()}
                className="h-9 text-xs font-semibold gap-1.5"
              >
                {isCreating ? <Spinner className="size-3.5" /> : "Create Workspace"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
