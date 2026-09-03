"use client"

import * as React from "react"
import { useOrganization, useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Spinner } from "@/components/ui/spinner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Building2,
  Mail,
  Plus,
  Trash2,
  Upload,
  UserMinus,
  Users,
} from "lucide-react"
import { toast } from "sonner"

type OrganizationResource = NonNullable<ReturnType<typeof useOrganization>["organization"]>
type OrganizationMembershipResource = NonNullable<
  Awaited<ReturnType<OrganizationResource["getMemberships"]>>
>["data"][number]
type OrganizationInvitationResource = NonNullable<
  Awaited<ReturnType<OrganizationResource["getInvitations"]>>
>["data"][number]

interface WorkspaceProfileCardProps {
  organization: OrganizationResource
  isAdmin: boolean
}

function WorkspaceProfileCard({ organization, isAdmin }: WorkspaceProfileCardProps) {
  const [orgName, setOrgName] = React.useState(organization.name || "")
  const [logoFile, setLogoFile] = React.useState<File | null>(null)
  const [logoPreview, setLogoPreview] = React.useState<string | null>(null)
  const [isSavingGeneral, setIsSavingGeneral] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const orgInitials =
    organization.name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "OR"

  const handleSaveGeneral = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!orgName.trim()) return

    setIsSavingGeneral(true)
    try {
      if (logoFile) {
        await organization.setLogo({ file: logoFile })
      }
      if (orgName.trim() !== organization.name) {
        await organization.update({ name: orgName.trim() })
      }
      toast.success("Workspace settings updated")
      setLogoFile(null)
      setLogoPreview(null)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update workspace."
      toast.error(msg)
    } finally {
      setIsSavingGeneral(false)
    }
  }

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file")
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image file size must be less than 5MB")
      return
    }
    setLogoFile(file)
    setLogoPreview(URL.createObjectURL(file))
  }

  return (
    <Card className="border-border/80 bg-card shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-base font-semibold text-foreground">
          Workspace profile
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground">
          Configure your workspace name and branding icon.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <form onSubmit={handleSaveGeneral} className="space-y-5">
          {/* Logo Section */}
          <div className="flex items-center gap-4">
            <Avatar className="size-16 rounded-xl border border-border bg-muted">
              {logoPreview ? (
                <AvatarImage src={logoPreview} alt="Preview" />
              ) : organization.imageUrl ? (
                <AvatarImage src={organization.imageUrl} alt={organization.name} />
              ) : null}
              <AvatarFallback className="rounded-xl bg-linear-to-tr from-indigo-600 to-violet-600 text-sm font-bold text-white">
                {orgInitials}
              </AvatarFallback>
            </Avatar>

            {isAdmin && (
              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleLogoChange}
                  accept="image/*"
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="h-8 gap-1.5 text-xs font-medium"
                >
                  <Upload className="size-3.5" />
                  <span>Upload logo</span>
                </Button>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Square PNG or JPG up to 5MB
                </p>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="orgName" className="text-xs">
              Workspace name
            </Label>
            <Input
              id="orgName"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              disabled={!isAdmin}
              required
              className="h-9 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="orgSlug" className="text-xs">
              Workspace slug
            </Label>
            <Input
              id="orgSlug"
              value={organization.slug || organization.id}
              disabled
              className="h-9 bg-muted/40 font-mono text-xs text-muted-foreground"
            />
          </div>

          {isAdmin && (
            <div className="pt-2">
              <Button
                type="submit"
                size="sm"
                disabled={isSavingGeneral || !orgName.trim()}
                className="h-8 gap-1.5 text-xs font-medium"
              >
                {isSavingGeneral && <Spinner className="size-3.5" />}
                Save changes
              </Button>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  )
}

export function OrganizationSettingsView() {
  const router = useRouter()
  const { user } = useUser()
  const {
    organization,
    membership,
    isLoaded,
    memberships: clerkMemberships,
    invitations: clerkInvitations,
  } = useOrganization({
    memberships: {
      infinite: true,
      keepPreviousData: true,
    },
    invitations: {
      infinite: true,
      keepPreviousData: true,
    },
  })

  const isAdmin = membership?.role === "org:admin"

  const members = clerkMemberships?.data || []
  const invitations = clerkInvitations?.data || []
  const isLoadingMembers = clerkMemberships?.isLoading || clerkInvitations?.isLoading

  // Invite Dialog State
  const [isInviteOpen, setIsInviteOpen] = React.useState(false)
  const [inviteEmail, setInviteEmail] = React.useState("")
  const [inviteRole, setInviteRole] = React.useState<"org:member" | "org:admin">("org:member")
  const [isSendingInvite, setIsSendingInvite] = React.useState(false)

  // Member Action Dialogs
  const [memberToRemove, setMemberToRemove] = React.useState<OrganizationMembershipResource | null>(null)
  const [isDeleteOrgOpen, setIsDeleteOrgOpen] = React.useState(false)
  const [isDeletingOrg, setIsDeletingOrg] = React.useState(false)

  if (!isLoaded) {
    return (
      <div className="flex h-full w-full items-center justify-center p-12">
        <Spinner className="size-8 text-primary" />
      </div>
    )
  }

  if (!organization) {
    return (
      <div className="flex min-h-[calc(100svh-4rem)] w-full items-center justify-center p-6">
        <div className="flex max-w-md flex-col items-center text-center">
          <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-muted text-foreground">
            <Building2 className="size-6" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">No Workspace Selected</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            You don&apos;t have an active organization selected. Please create or switch to an organization using the workspace switcher in the top left of the sidebar.
          </p>
        </div>
      </div>
    )
  }

  // 1. Send Invitation
  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteEmail.trim()) return

    setIsSendingInvite(true)
    try {
      await organization.inviteMember({
        emailAddress: inviteEmail.trim(),
        role: inviteRole,
      })
      toast.success(`Invitation sent to ${inviteEmail.trim()}`)
      setIsInviteOpen(false)
      setInviteEmail("")
      setInviteRole("org:member")
      await clerkInvitations?.revalidate?.()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to send invitation."
      toast.error(msg)
    } finally {
      setIsSendingInvite(false)
    }
  }

  // 2. Revoke Invitation
  const handleRevokeInvite = async (invitation: OrganizationInvitationResource) => {
    try {
      await invitation.revoke()
      toast.success("Invitation revoked")
      await clerkInvitations?.revalidate?.()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to revoke invitation."
      toast.error(msg)
    }
  }

  // 3. Change Member Role
  const handleChangeRole = async (targetMembership: OrganizationMembershipResource, newRole: string) => {
    if (!targetMembership.publicUserData?.userId) return
    try {
      await organization.updateMember({
        userId: targetMembership.publicUserData.userId,
        role: newRole,
      })
      toast.success("Member role updated")
      await clerkMemberships?.revalidate?.()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update role."
      toast.error(msg)
    }
  }

  // 4. Remove Member
  const handleRemoveMember = async () => {
    if (!memberToRemove?.publicUserData?.userId) return
    try {
      await organization.removeMember(memberToRemove.publicUserData.userId)
      toast.success("Member removed from workspace")
      setMemberToRemove(null)
      await clerkMemberships?.revalidate?.()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to remove member."
      toast.error(msg)
    }
  }

  // 5. Delete Organization
  const handleDeleteOrg = async () => {
    setIsDeletingOrg(true)
    try {
      await organization.destroy()
      toast.success("Workspace deleted")
      router.push("/choose-organization")
      router.refresh()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete workspace."
      toast.error(msg)
      setIsDeletingOrg(false)
    }
  }

  return (
    <div className="flex h-full w-full flex-col overflow-y-auto p-6 md:p-10">
      <div className="mx-auto w-full max-w-4xl space-y-6">
        {/* Page Header */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Organization Settings
            </h1>
            <Badge variant="outline" className="h-5 border-border bg-muted/50 text-[10px] font-medium">
              {isAdmin ? "Admin View" : "Member View"}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Manage your workspace details, collaborate with team members, and configure access permissions.
          </p>
        </div>

        <Tabs defaultValue="general" className="w-full space-y-6">
          <TabsList className="inline-flex h-11 items-center gap-1 rounded-xl border border-border/60 bg-muted/50 p-1 text-muted-foreground shadow-xs">
            <TabsTrigger
              value="general"
              className="gap-2.5 rounded-lg px-4 py-2 text-sm font-medium transition-all data-active:bg-background data-active:font-semibold data-active:text-foreground data-active:shadow-xs hover:text-foreground"
            >
              <Building2 className="size-4" />
              <span>General</span>
            </TabsTrigger>
            <TabsTrigger
              value="members"
              className="gap-2.5 rounded-lg px-4 py-2 text-sm font-medium transition-all data-active:bg-background data-active:font-semibold data-active:text-foreground data-active:shadow-xs hover:text-foreground"
            >
              <Users className="size-4" />
              <span>Members</span>
              {members.length > 0 && (
                <span className="ml-1 rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                  {members.length}
                </span>
              )}
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger
                value="danger"
                className="gap-2.5 rounded-lg px-4 py-2 text-sm font-medium transition-all data-active:bg-background data-active:font-semibold data-active:text-destructive data-active:shadow-xs hover:text-destructive"
              >
                <Trash2 className="size-4 text-destructive" />
                <span>Danger Zone</span>
              </TabsTrigger>
            )}
          </TabsList>

          {/* TAB 1: GENERAL */}
          <TabsContent value="general" className="space-y-6 outline-none">
            <WorkspaceProfileCard
              key={organization.id}
              organization={organization}
              isAdmin={isAdmin}
            />
          </TabsContent>

          {/* TAB 2: MEMBERS & INVITATIONS */}
          <TabsContent value="members" className="space-y-6 outline-none">
              <div className="space-y-6">
                {/* Active Members Card */}
                <Card className="border-border/80 bg-card shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between pb-4">
                    <div className="space-y-1">
                      <CardTitle className="text-base font-semibold text-foreground">
                        Members
                      </CardTitle>
                      <CardDescription className="text-xs text-muted-foreground">
                        Collaborators with access to this workspace.
                      </CardDescription>
                    </div>
                    {isAdmin && (
                      <Button
                        size="sm"
                        onClick={() => setIsInviteOpen(true)}
                        className="h-8 gap-1.5 text-xs font-medium"
                      >
                        <Plus className="size-3.5" />
                        <span>Invite member</span>
                      </Button>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-2.5 pt-0">
                    {isLoadingMembers ? (
                      <div className="flex justify-center p-6">
                        <Spinner className="size-5 text-muted-foreground" />
                      </div>
                    ) : (
                      members.map((mem) => {
                        const isSelf = mem.publicUserData?.userId === user?.id
                        const memberName =
                          [mem.publicUserData?.firstName, mem.publicUserData?.lastName]
                            .filter(Boolean)
                            .join(" ") ||
                          mem.publicUserData?.identifier ||
                          "Team Member"

                        return (
                          <div
                            key={mem.id}
                            className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/20 p-3 text-xs"
                          >
                            <div className="flex items-center gap-3">
                              <Avatar className="size-8 border border-border">
                                {mem.publicUserData?.imageUrl && (
                                  <AvatarImage
                                    src={mem.publicUserData.imageUrl}
                                    alt={memberName}
                                  />
                                )}
                                <AvatarFallback className="bg-primary/20 text-[11px] font-bold text-primary">
                                  {memberName[0]?.toUpperCase() || "M"}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-foreground">
                                    {memberName}
                                  </span>
                                  {isSelf && (
                                    <Badge
                                      variant="secondary"
                                      className="h-4 px-1 text-[9px] font-normal"
                                    >
                                      You
                                    </Badge>
                                  )}
                                </div>
                                <div className="text-[11px] text-muted-foreground">
                                  {mem.publicUserData?.identifier}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              {isAdmin && !isSelf ? (
                                <Select
                                  value={mem.role}
                                  onValueChange={(val) => handleChangeRole(mem, val)}
                                >
                                  <SelectTrigger className="h-7 w-24 text-[11px]">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="org:member" className="text-xs">
                                      Member
                                    </SelectItem>
                                    <SelectItem value="org:admin" className="text-xs">
                                      Admin
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              ) : (
                                <Badge
                                  variant="outline"
                                  className="h-5 border-border text-[10px] capitalize"
                                >
                                  {mem.role === "org:admin" ? "Admin" : "Member"}
                                </Badge>
                              )}

                              {isAdmin && !isSelf && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setMemberToRemove(mem)}
                                  className="size-7 text-muted-foreground hover:text-destructive"
                                >
                                  <UserMinus className="size-3.5" />
                                </Button>
                              )}
                            </div>
                          </div>
                        )
                      })
                    )}
                  </CardContent>
                </Card>

                {/* Pending Invitations Card */}
                {invitations.length > 0 && (
                  <Card className="border-border/80 bg-card shadow-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-semibold text-foreground">
                        Pending invitations
                      </CardTitle>
                      <CardDescription className="text-xs text-muted-foreground">
                        Invited team members who have not joined yet.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2 pt-0">
                      {invitations.map((inv) => (
                        <div
                          key={inv.id}
                          className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/20 p-3 text-xs"
                        >
                          <div className="flex items-center gap-2.5">
                            <Mail className="size-3.5 text-muted-foreground" />
                            <span className="font-medium text-foreground">
                              {inv.emailAddress}
                            </span>
                            <Badge variant="outline" className="text-[10px] capitalize">
                              {inv.role === "org:admin" ? "Admin" : "Member"}
                            </Badge>
                          </div>

                          {isAdmin && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRevokeInvite(inv)}
                              className="h-7 text-xs text-muted-foreground hover:text-destructive"
                            >
                              Revoke
                            </Button>
                          )}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </div>
          </TabsContent>

          {/* TAB 3: DANGER ZONE */}
          {isAdmin && (
            <TabsContent value="danger" className="space-y-6 outline-none">
              <Card className="border-destructive/30 bg-destructive/5 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold text-destructive">
                    Delete workspace
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground">
                    Permanently delete this organization, including all workflows, execution history,
                    and credentials stored within it. This action is irreversible.
                  </CardDescription>
                </CardHeader>
                <CardFooter className="flex items-center py-4">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setIsDeleteOrgOpen(true)}
                    className="h-8 text-xs font-medium"
                  >
                    Delete workspace
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>

      {/* DIALOG: Invite Member */}
      <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Invite new member</DialogTitle>
            <DialogDescription>
              Enter the email address of the person you would like to invite to {organization.name}.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSendInvite} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="inviteEmail" className="text-xs">
                Email address
              </Label>
              <Input
                id="inviteEmail"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="colleague@company.com"
                required
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="inviteRole" className="text-xs">
                Role
              </Label>
              <Select
                value={inviteRole}
                onValueChange={(val: "org:member" | "org:admin") => setInviteRole(val)}
              >
                <SelectTrigger id="inviteRole" className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="org:member" className="text-xs">
                    Member (Can view and run workflows)
                  </SelectItem>
                  <SelectItem value="org:admin" className="text-xs">
                    Admin (Full access to members and settings)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsInviteOpen(false)}
                className="h-8 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSendingInvite || !inviteEmail.trim()}
                className="h-8 gap-1.5 text-xs font-medium"
              >
                {isSendingInvite && <Spinner className="size-3.5" />}
                Send invitation
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ALERT DIALOG: Remove Member Confirmation */}
      <AlertDialog
        open={Boolean(memberToRemove)}
        onOpenChange={(open) => !open && setMemberToRemove(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove member from workspace?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove{" "}
              <span className="font-semibold text-foreground">
                {memberToRemove?.publicUserData?.identifier}
              </span>{" "}
              from this workspace? They will immediately lose access to all workflows.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-8 text-xs">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveMember}
              className="h-8 bg-destructive text-destructive-foreground hover:bg-destructive/90 text-xs"
            >
              Remove member
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ALERT DIALOG: Delete Organization Confirmation */}
      <AlertDialog open={isDeleteOrgOpen} onOpenChange={setIsDeleteOrgOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete workspace permanently?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you absolutely sure you want to delete{" "}
              <span className="font-semibold text-foreground">{organization.name}</span>? This action
              cannot be undone. All workflows, templates, and credentials will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-8 text-xs">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteOrg}
              disabled={isDeletingOrg}
              className="h-8 bg-destructive text-destructive-foreground hover:bg-destructive/90 text-xs"
            >
              {isDeletingOrg && <Spinner className="size-3.5 mr-1" />}
              Delete workspace
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
