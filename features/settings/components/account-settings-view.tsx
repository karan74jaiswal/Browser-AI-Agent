"use client"

import * as React from "react"
import { useClerk, useUser } from "@clerk/nextjs"
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
  AlertCircle,
  Check,
  Copy,
  Eye,
  EyeOff,
  Laptop,
  Lock,
  Mail,
  MoreHorizontal,
  Plus,
  Shield,
  Smartphone,
  Trash2,
  Upload,
  User,
  X,
} from "lucide-react"
import { toast } from "sonner"
import { evaluatePasswordStrength } from "@/features/auth/utils"

type UserResource = NonNullable<ReturnType<typeof useUser>["user"]>
type EmailAddressResource = UserResource["emailAddresses"][number]
type SessionWithActivitiesResource = Awaited<ReturnType<UserResource["getSessions"]>>[number]

export function AccountSettingsView() {
  const router = useRouter()
  const clerk = useClerk()
  const { user, isLoaded } = useUser()

  // Tab: "profile" | "security"
  const [activeTab, setActiveTab] = React.useState<"profile" | "security">("profile")

  // Sessions state
  const [sessions, setSessions] = React.useState<SessionWithActivitiesResource[]>([])
  const [isLoadingSessions, setIsLoadingSessions] = React.useState(false)

  // Dialog States
  const [isUpdateProfileOpen, setIsUpdateProfileOpen] = React.useState(false)
  const [isAddEmailOpen, setIsAddEmailOpen] = React.useState(false)
  const [isVerifyEmailOpen, setIsVerifyEmailOpen] = React.useState(false)
  const [isUpdatePasswordOpen, setIsUpdatePasswordOpen] = React.useState(false)
  const [isDeleteAccountOpen, setIsDeleteAccountOpen] = React.useState(false)

  // Profile Edit State
  const [firstName, setFirstName] = React.useState("")
  const [lastName, setLastName] = React.useState("")
  const [avatarFile, setAvatarFile] = React.useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = React.useState<string | null>(null)
  const [isSavingProfile, setIsSavingProfile] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  // Add Email State
  const [newEmail, setNewEmail] = React.useState("")
  const [pendingEmailObj, setPendingEmailObj] = React.useState<EmailAddressResource | null>(null)
  const [emailOtpCode, setEmailOtpCode] = React.useState("")
  const [isAddingEmail, setIsAddingEmail] = React.useState(false)

  // Password State
  const [currentPassword, setCurrentPassword] = React.useState("")
  const [newPassword, setNewPassword] = React.useState("")
  const [confirmPassword, setConfirmPassword] = React.useState("")
  const [showCurrentPassword, setShowCurrentPassword] = React.useState(false)
  const [showNewPassword, setShowNewPassword] = React.useState(false)
  const [isUpdatingPassword, setIsUpdatingPassword] = React.useState(false)
  const [passwordError, setPasswordError] = React.useState<string | null>(null)

  // Password strength check
  const {
    checks: passwordChecks,
    score: strengthScore,
    label: strengthLabel,
    color: strengthColor,
  } = React.useMemo(() => evaluatePasswordStrength(newPassword), [newPassword])

  // Open profile update dialog and initialize fields
  const handleOpenUpdateProfile = () => {
    setFirstName(user?.firstName || "")
    setLastName(user?.lastName || "")
    setAvatarFile(null)
    setAvatarPreview(null)
    setIsUpdateProfileOpen(true)
  }

  // Fetch active sessions asynchronously when security tab is opened
  React.useEffect(() => {
    let ignore = false
    if (activeTab === "security" && user) {
      user
        .getSessions()
        .then((activeSessions) => {
          if (!ignore) {
            setSessions(activeSessions)
            setIsLoadingSessions(false)
          }
        })
        .catch((err) => {
          console.error("Failed to load sessions:", err)
          if (!ignore) setIsLoadingSessions(false)
        })
    }
    return () => {
      ignore = true
    }
  }, [activeTab, user])

  // Clean up avatar preview object URL on unmount or when preview changes
  React.useEffect(() => {
    return () => {
      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview)
      }
    }
  }, [avatarPreview])

  if (!isLoaded || !user) {
    return (
      <div className="flex h-full w-full items-center justify-center p-12">
        <Spinner className="size-8 text-primary" />
      </div>
    )
  }

  const fullName =
    user.fullName ||
    [user.firstName, user.lastName].filter(Boolean).join(" ") ||
    user.username ||
    user.primaryEmailAddress?.emailAddress?.split("@")[0] ||
    "User"

  const initials =
    (user.firstName?.[0] || "") + (user.lastName?.[0] || "") ||
    fullName[0] ||
    "U"

  // 1. Handle Profile Update (Name & Avatar)
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSavingProfile(true)
    try {
      if (avatarFile) {
        await user.setProfileImage({ file: avatarFile })
      }
      await user.update({
        firstName: firstName.trim() || undefined,
        lastName: lastName.trim() || undefined,
      })
      toast.success("Profile updated successfully")
      setIsUpdateProfileOpen(false)
      setAvatarFile(null)
      setAvatarPreview((prev) => {
        if (prev) URL.revokeObjectURL(prev)
        return null
      })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update profile."
      toast.error(msg)
    } finally {
      setIsSavingProfile(false)
    }
  }

  // Handle avatar file selection
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
    setAvatarFile(file)
    setAvatarPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return URL.createObjectURL(file)
    })
  }

  // 2. Handle Add Email
  const handleAddEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newEmail.trim()) return

    setIsAddingEmail(true)
    try {
      const emailObj = await user.createEmailAddress({ email: newEmail.trim() })
      await emailObj.prepareVerification({ strategy: "email_code" })
      setPendingEmailObj(emailObj)
      setIsAddEmailOpen(false)
      setIsVerifyEmailOpen(true)
      toast.success(`Verification code sent to ${newEmail.trim()}`)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to add email address."
      toast.error(msg)
    } finally {
      setIsAddingEmail(false)
    }
  }

  // 3. Handle Verify Email
  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!pendingEmailObj || !emailOtpCode.trim()) return

    setIsAddingEmail(true)
    try {
      await pendingEmailObj.attemptVerification({ code: emailOtpCode.trim() })
      toast.success("Email verified and added to your account")
      setIsVerifyEmailOpen(false)
      setNewEmail("")
      setEmailOtpCode("")
      setPendingEmailObj(null)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Invalid verification code."
      toast.error(msg)
    } finally {
      setIsAddingEmail(false)
    }
  }

  // 4. Handle Make Primary Email
  const handleMakePrimaryEmail = async (emailId: string) => {
    try {
      await user.update({ primaryEmailAddressId: emailId })
      toast.success("Primary email updated")
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update primary email."
      toast.error(msg)
    }
  }

  // 5. Handle Delete Email
  const handleDeleteEmail = async (emailObj: EmailAddressResource) => {
    try {
      await emailObj.destroy()
      toast.success("Email address removed")
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to remove email."
      toast.error(msg)
    }
  }

  // 6. Handle Disconnect Connected Account
  const handleDisconnectAccount = async (accountId: string) => {
    try {
      const externalAccount = user.externalAccounts.find((acc) => acc.id === accountId)
      if (externalAccount) {
        await externalAccount.destroy()
        toast.success("Connected account removed")
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to disconnect account."
      toast.error(msg)
    }
  }

  // 7. Handle Password Change / Create
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError(null)

    if (newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters long.")
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match.")
      return
    }

    setIsUpdatingPassword(true)
    try {
      if (user.passwordEnabled) {
        await user.updatePassword({
          currentPassword,
          newPassword,
        })
      } else {
        await user.updatePassword({
          newPassword,
        })
      }
      toast.success("Password updated successfully")
      setIsUpdatePasswordOpen(false)
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update password."
      setPasswordError(msg)
    } finally {
      setIsUpdatingPassword(false)
    }
  }

  // 8. Handle Revoke Session (Sign out other device)
  const handleRevokeSession = async (session: SessionWithActivitiesResource) => {
    try {
      await session.revoke()
      setSessions((prev) => prev.filter((s) => s.id !== session.id))
      toast.success("Session signed out")
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to revoke session."
      toast.error(msg)
    }
  }

  // 9. Handle Delete Account
  const handleDeleteAccount = async () => {
    try {
      await user.delete()
      toast.success("Account deleted")
      router.push("/")
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete account."
      toast.error(msg)
    }
  }

  return (
    <div className="flex h-full w-full flex-col overflow-y-auto p-6 md:p-10">
      <div className="mx-auto w-full max-w-4xl space-y-6">
        {/* Page Header */}
        <div className="flex flex-col gap-1.5">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Account Settings
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage your personal profile details, credentials, and active sessions.
          </p>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={(val) => setActiveTab(val as "profile" | "security")}
          className="w-full space-y-6"
        >
          <TabsList className="inline-flex h-11 items-center gap-1 rounded-xl border border-border/60 bg-muted/50 p-1 text-muted-foreground shadow-xs">
            <TabsTrigger
              value="profile"
              className="gap-2.5 rounded-lg px-4 py-2 text-sm font-medium transition-all data-active:bg-background data-active:font-semibold data-active:text-foreground data-active:shadow-xs hover:text-foreground"
            >
              <User className="size-4" />
              <span>Profile</span>
            </TabsTrigger>
            <TabsTrigger
              value="security"
              className="gap-2.5 rounded-lg px-4 py-2 text-sm font-medium transition-all data-active:bg-background data-active:font-semibold data-active:text-foreground data-active:shadow-xs hover:text-foreground"
            >
              <Shield className="size-4" />
              <span>Security</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6 outline-none">
            {/* Profile Details Card */}
            <Card className="border-border/80 bg-card shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between pb-4">
                    <div className="space-y-1">
                      <CardTitle className="text-base font-semibold text-foreground">
                        Profile details
                      </CardTitle>
                      <CardDescription className="text-xs text-muted-foreground">
                        Your personal details and how you appear across workspaces.
                      </CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleOpenUpdateProfile}
                      className="h-8 text-xs font-medium"
                    >
                      Update profile
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-0">
                    <div className="flex items-center gap-4 rounded-lg border border-border/60 bg-muted/20 p-3.5">
                      <Avatar className="size-14 border border-border bg-muted">
                        {user.imageUrl && <AvatarImage src={user.imageUrl} alt={fullName} />}
                        <AvatarFallback className="bg-linear-to-tr from-indigo-600 to-violet-600 text-sm font-bold text-white">
                          {initials.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="space-y-0.5">
                        <div className="text-sm font-semibold text-foreground">{fullName}</div>
                        <div className="text-xs text-muted-foreground">
                          {user.primaryEmailAddress?.emailAddress}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Email Addresses Card */}
                <Card className="border-border/80 bg-card shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between pb-4">
                    <div className="space-y-1">
                      <CardTitle className="text-base font-semibold text-foreground">
                        Email addresses
                      </CardTitle>
                      <CardDescription className="text-xs text-muted-foreground">
                        The email addresses associated with your account.
                      </CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsAddEmailOpen(true)}
                      className="h-8 gap-1.5 text-xs font-medium"
                    >
                      <Plus className="size-3.5" />
                      <span>Add email address</span>
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-2.5 pt-0">
                    {user.emailAddresses.map((emailObj) => {
                      const isPrimary = emailObj.id === user.primaryEmailAddressId
                      return (
                        <div
                          key={emailObj.id}
                          className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/20 p-3 text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <Mail className="size-3.5 text-muted-foreground" />
                            <span className="font-medium text-foreground">
                              {emailObj.emailAddress}
                            </span>
                            {isPrimary && (
                              <Badge
                                variant="secondary"
                                className="h-5 border-border bg-primary/10 px-1.5 text-[10px] font-medium text-primary"
                              >
                                Primary
                              </Badge>
                            )}
                            {emailObj.verification?.status === "verified" && (
                              <Badge
                                variant="outline"
                                className="h-5 border-emerald-500/30 bg-emerald-500/10 px-1.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400"
                              >
                                Verified
                              </Badge>
                            )}
                          </div>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-7 text-muted-foreground hover:text-foreground"
                              >
                                <MoreHorizontal className="size-3.5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 text-xs">
                              <DropdownMenuItem
                                onClick={() => {
                                  navigator.clipboard.writeText(emailObj.emailAddress)
                                  toast.success("Email address copied")
                                }}
                                className="cursor-pointer gap-2"
                              >
                                <Copy className="size-3.5 text-muted-foreground" />
                                <span>Copy email address</span>
                              </DropdownMenuItem>

                              {!isPrimary && (
                                <DropdownMenuItem
                                  onClick={() => handleMakePrimaryEmail(emailObj.id)}
                                  className="cursor-pointer gap-2"
                                >
                                  <Check className="size-3.5 text-muted-foreground" />
                                  <span>Make primary</span>
                                </DropdownMenuItem>
                              )}

                              {!isPrimary && user.emailAddresses.length > 1 && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => handleDeleteEmail(emailObj)}
                                    className="cursor-pointer gap-2 text-destructive focus:text-destructive"
                                  >
                                    <Trash2 className="size-3.5" />
                                    <span>Remove email</span>
                                  </DropdownMenuItem>
                                </>
                              )}

                              {isPrimary && (
                                <>
                                  <DropdownMenuSeparator />
                                  <div className="px-2 py-1 text-[10px] text-muted-foreground">
                                    Primary email cannot be removed
                                  </div>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      )
                    })}
                  </CardContent>
                </Card>

                {/* Connected Accounts Card */}
                <Card className="border-border/80 bg-card shadow-sm">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-base font-semibold text-foreground">
                      Connected accounts
                    </CardTitle>
                    <CardDescription className="text-xs text-muted-foreground">
                      Social sign-in providers linked to your account.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2.5 pt-0">
                    {user.externalAccounts.length === 0 ? (
                      <div className="rounded-lg border border-dashed border-border/80 p-4 text-center text-xs text-muted-foreground">
                        No external accounts connected.
                      </div>
                    ) : (
                      user.externalAccounts.map((acc) => (
                        <div
                          key={acc.id}
                          className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/20 p-3 text-xs"
                        >
                          <div className="flex items-center gap-2.5">
                            {acc.provider.toLowerCase().includes("google") ? (
                              <div className="flex size-6 items-center justify-center rounded-md bg-white p-0.5 shadow-2xs">
                                <svg className="size-4 shrink-0" viewBox="0 0 24 24">
                                  <path
                                    fill="#4285F4"
                                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                                  />
                                  <path
                                    fill="#34A853"
                                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                                  />
                                  <path
                                    fill="#FBBC05"
                                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                                  />
                                  <path
                                    fill="#EA4335"
                                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                                  />
                                </svg>
                              </div>
                            ) : acc.provider.toLowerCase().includes("github") ? (
                              <div className="flex size-6 items-center justify-center rounded-md bg-muted text-foreground">
                                <svg className="size-4 shrink-0 fill-current" viewBox="0 0 24 24">
                                  <path
                                    fillRule="evenodd"
                                    clipRule="evenodd"
                                    d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                                  />
                                </svg>
                              </div>
                            ) : (
                              <span className="flex size-6 items-center justify-center rounded-md bg-muted font-bold capitalize text-[11px]">
                                {acc.provider[0]}
                              </span>
                            )}
                            <div className="flex items-center gap-1.5">
                              <span className="font-medium capitalize text-foreground">
                                {acc.providerTitle ? acc.providerTitle() : acc.provider}
                              </span>
                              <span className="text-muted-foreground">·</span>
                              <span className="text-muted-foreground">{acc.emailAddress}</span>
                            </div>
                          </div>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-7 text-muted-foreground hover:text-foreground"
                              >
                                <MoreHorizontal className="size-3.5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-36 text-xs">
                              <DropdownMenuItem
                                onClick={() => handleDisconnectAccount(acc.id)}
                                className="cursor-pointer text-destructive focus:text-destructive"
                              >
                                Remove
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
          </TabsContent>

          {/* TAB 2: SECURITY */}
          <TabsContent value="security" className="space-y-6 outline-none">
                {/* Password Card */}
                <Card className="border-border/80 bg-card shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between pb-4">
                    <div className="space-y-1">
                      <CardTitle className="text-base font-semibold text-foreground">
                        Password
                      </CardTitle>
                      <CardDescription className="text-xs text-muted-foreground">
                        Change your password to keep your account secure.
                      </CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setCurrentPassword("")
                        setNewPassword("")
                        setConfirmPassword("")
                        setPasswordError(null)
                        setIsUpdatePasswordOpen(true)
                      }}
                      className="h-8 text-xs font-medium"
                    >
                      Update password
                    </Button>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/20 p-3 text-xs">
                      <div className="flex items-center gap-2.5">
                        <Lock className="size-3.5 text-muted-foreground" />
                        <span className="font-mono text-xs tracking-widest text-muted-foreground">
                          ••••••••••
                        </span>
                      </div>
                      <Badge
                        variant="outline"
                        className="h-5 border-border bg-muted/50 text-[10px] font-medium"
                      >
                        {user.passwordEnabled ? "Configured" : "Not set"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                {/* Active Sessions Card */}
                <Card className="border-border/80 bg-card shadow-sm">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-base font-semibold text-foreground">
                      Active devices
                    </CardTitle>
                    <CardDescription className="text-xs text-muted-foreground">
                      Devices and browsers currently authenticated to your account.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2.5 pt-0">
                    {isLoadingSessions ? (
                      <div className="flex justify-center p-6">
                        <Spinner className="size-5 text-muted-foreground" />
                      </div>
                    ) : (
                      sessions.map((sess) => {
                        const isCurrent = sess.id === clerk.session?.id
                        const isMobile = sess.latestActivity?.isMobile

                        return (
                          <div
                            key={sess.id}
                            className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/20 p-3 text-xs"
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex size-8 items-center justify-center rounded-lg border border-border bg-background">
                                {isMobile ? (
                                  <Smartphone className="size-4 text-muted-foreground" />
                                ) : (
                                  <Laptop className="size-4 text-muted-foreground" />
                                )}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-foreground">
                                    {sess.latestActivity?.deviceType || "Browser"}
                                  </span>
                                  {isCurrent && (
                                    <Badge
                                      variant="secondary"
                                      className="h-4 border-border bg-primary/10 px-1 text-[9px] font-medium text-primary"
                                    >
                                      This device
                                    </Badge>
                                  )}
                                </div>
                                <div className="text-[11px] text-muted-foreground">
                                  {[
                                    sess.latestActivity?.browserName,
                                    sess.latestActivity?.city && sess.latestActivity?.country
                                      ? `${sess.latestActivity.city}, ${sess.latestActivity.country}`
                                      : sess.latestActivity?.country,
                                    sess.latestActivity?.ipAddress ? `IP ${sess.latestActivity.ipAddress}` : null,
                                  ]
                                    .filter(Boolean)
                                    .join(" · ")}
                                </div>
                              </div>
                            </div>

                            {!isCurrent && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRevokeSession(sess)}
                                className="h-7 text-xs text-muted-foreground hover:text-destructive"
                              >
                                Sign out
                              </Button>
                            )}
                          </div>
                        )
                      })
                    )}
                  </CardContent>
                </Card>

                {/* Danger Zone Card */}
                <Card className="border-destructive/30 bg-destructive/5 shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold text-destructive">
                      Delete account
                    </CardTitle>
                    <CardDescription className="text-xs text-muted-foreground">
                      Permanently delete your account, organizations, and all associated personal data.
                    </CardDescription>
                  </CardHeader>
                  <CardFooter className="flex items-center py-4">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setIsDeleteAccountOpen(true)}
                      className="h-8 text-xs font-medium"
                    >
                      Delete account
                    </Button>
                  </CardFooter>
                </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* DIALOG 1: Update Profile */}
      <Dialog
        open={isUpdateProfileOpen}
        onOpenChange={(open) => {
          setIsUpdateProfileOpen(open)
          if (!open) {
            setAvatarFile(null)
            setAvatarPreview((prev) => {
              if (prev) URL.revokeObjectURL(prev)
              return null
            })
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update profile</DialogTitle>
            <DialogDescription>
              Change your name and avatar photo across Nodus.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveProfile} className="space-y-4 py-2">
            {/* Avatar Upload */}
            <div className="flex items-center gap-4">
              <Avatar className="size-16 border border-border">
                {avatarPreview ? (
                  <AvatarImage src={avatarPreview} alt="Preview" />
                ) : user.imageUrl ? (
                  <AvatarImage src={user.imageUrl} alt={fullName} />
                ) : null}
                <AvatarFallback className="bg-primary text-sm font-bold text-primary-foreground">
                  {initials.toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleAvatarChange}
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
                  <span>Upload photo</span>
                </Button>
                <p className="mt-1 text-[11px] text-muted-foreground">JPG, PNG or GIF up to 5MB</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="firstName" className="text-xs">
                  First name
                </Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="First name"
                  className="h-9 text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lastName" className="text-xs">
                  Last name
                </Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Last name"
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsUpdateProfileOpen(false)}
                className="h-8 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSavingProfile}
                className="h-8 gap-1.5 text-xs"
              >
                {isSavingProfile && <Spinner className="size-3.5" />}
                Save changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG 2: Add Email Address */}
      <Dialog open={isAddEmailOpen} onOpenChange={setIsAddEmailOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add email address</DialogTitle>
            <DialogDescription>
              We will send a verification code to confirm this email.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddEmail} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="new-email" className="text-xs">
                Email address
              </Label>
              <Input
                id="new-email"
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="name@company.com"
                required
                className="h-9 text-xs"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsAddEmailOpen(false)}
                className="h-8 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isAddingEmail || !newEmail.trim()}
                className="h-8 gap-1.5 text-xs"
              >
                {isAddingEmail && <Spinner className="size-3.5" />}
                Send verification code
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG 3: Verify Added Email */}
      <Dialog open={isVerifyEmailOpen} onOpenChange={setIsVerifyEmailOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Verify email address</DialogTitle>
            <DialogDescription>
              Enter the 6-digit verification code sent to {newEmail}.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleVerifyEmail} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="email-otp" className="text-xs">
                Verification code
              </Label>
              <Input
                id="email-otp"
                value={emailOtpCode}
                onChange={(e) => setEmailOtpCode(e.target.value)}
                placeholder="123456"
                maxLength={6}
                required
                className="h-9 font-mono tracking-widest text-center text-sm"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsVerifyEmailOpen(false)}
                className="h-8 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isAddingEmail || emailOtpCode.length < 6}
                className="h-8 gap-1.5 text-xs"
              >
                {isAddingEmail && <Spinner className="size-3.5" />}
                Verify &amp; Add
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG 4: Change / Set Password */}
      <Dialog open={isUpdatePasswordOpen} onOpenChange={setIsUpdatePasswordOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{user.passwordEnabled ? "Update password" : "Set password"}</DialogTitle>
            <DialogDescription>
              Choose a strong password containing letters, numbers, and special characters.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdatePassword} className="space-y-4 py-2">
            {passwordError && (
              <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-2.5 text-xs text-destructive">
                <AlertCircle className="size-4 shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            {user.passwordEnabled && (
              <div className="space-y-1.5">
                <Label htmlFor="current-pass" className="text-xs">
                  Current password
                </Label>
                <div className="relative">
                  <Input
                    id="current-pass"
                    type={showCurrentPassword ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="h-9 pr-9 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showCurrentPassword ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="new-pass" className="text-xs">
                New password
              </Label>
              <div className="relative">
                <Input
                  id="new-pass"
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="h-9 pr-9 text-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showNewPassword ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                </button>
              </div>

              {/* Password strength meter */}
              {newPassword && (
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-muted-foreground">Password strength</span>
                    <span className="font-medium text-foreground">{strengthLabel}</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1 h-1">
                    {[0, 1, 2, 3].map((index) => (
                      <div
                        key={index}
                        className={`rounded-full transition-colors ${
                          index < strengthScore ? strengthColor : "bg-muted"
                        }`}
                      />
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-1 pt-1 text-[10px] text-muted-foreground">
                    <div className="flex items-center gap-1">
                      {passwordChecks.length ? (
                        <Check className="size-3 text-emerald-500" />
                      ) : (
                        <X className="size-3 text-muted-foreground/60" />
                      )}
                      <span>8+ characters</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {passwordChecks.uppercase ? (
                        <Check className="size-3 text-emerald-500" />
                      ) : (
                        <X className="size-3 text-muted-foreground/60" />
                      )}
                      <span>Uppercase letter</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {passwordChecks.number ? (
                        <Check className="size-3 text-emerald-500" />
                      ) : (
                        <X className="size-3 text-muted-foreground/60" />
                      )}
                      <span>Number</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {passwordChecks.special ? (
                        <Check className="size-3 text-emerald-500" />
                      ) : (
                        <X className="size-3 text-muted-foreground/60" />
                      )}
                      <span>Special character</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirm-pass" className="text-xs">
                Confirm new password
              </Label>
              <Input
                id="confirm-pass"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="h-9 text-xs"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsUpdatePasswordOpen(false)}
                className="h-8 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isUpdatingPassword || newPassword.length < 8}
                className="h-8 gap-1.5 text-xs"
              >
                {isUpdatingPassword && <Spinner className="size-3.5" />}
                Save password
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ALERT DIALOG: Delete Account Confirmation */}
      <AlertDialog open={isDeleteAccountOpen} onOpenChange={setIsDeleteAccountOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your user account, revoke
              all active sessions, and remove you from all organizations.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-8 text-xs">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              className="h-8 bg-destructive text-destructive-foreground hover:bg-destructive/90 text-xs"
            >
              Delete account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
