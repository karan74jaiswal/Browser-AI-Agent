"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useClerk, useOrganization, useUser } from "@clerk/nextjs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import {
  Building2,
  ChevronsUpDown,
  CreditCard,
  LogOut,
  Settings,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface CustomUserButtonProps {
  className?: string
  align?: "start" | "end" | "center"
  side?: "top" | "bottom" | "left" | "right"
}

export function CustomUserButton({
  className,
  align = "start",
  side = "top",
}: CustomUserButtonProps) {
  const router = useRouter()
  const { user, isLoaded } = useUser()
  const clerk = useClerk()
  const { organization, membership } = useOrganization()
  const [isSigningOut, setIsSigningOut] = React.useState(false)

  if (!isLoaded) {
    return (
      <div className="flex h-10 w-full items-center gap-2 px-2">
        <div className="size-7 rounded-full bg-muted animate-pulse" />
        <div className="flex flex-col gap-1 group-data-[collapsible=icon]:hidden">
          <div className="h-3 w-20 rounded bg-muted animate-pulse" />
          <div className="h-2.5 w-28 rounded bg-muted/60 animate-pulse" />
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const fullName =
    user.fullName ||
    [user.firstName, user.lastName].filter(Boolean).join(" ") ||
    user.username ||
    user.primaryEmailAddress?.emailAddress?.split("@")[0] ||
    "User"

  const email = user.primaryEmailAddress?.emailAddress || ""

  const roleLabel =
    membership?.role === "org:admin"
      ? "Admin"
      : membership?.role === "org:member"
        ? "Member"
        : organization
          ? "Member"
          : "Personal"

  const initials = (user.firstName?.[0] || "") + (user.lastName?.[0] || "") || fullName[0] || "U"

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true)
      await clerk.signOut({ redirectUrl: "/" })
    } catch (err) {
      console.error("Sign out failed:", err)
      router.push("/")
    } finally {
      setIsSigningOut(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          disabled={isSigningOut}
          className={cn(
            "flex w-full items-center justify-between gap-2.5 rounded-lg border border-transparent p-1.5 text-left transition-all hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus:outline-none focus:ring-1 focus:ring-sidebar-ring group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-1",
            className
          )}
        >
          <div className="flex min-w-0 items-center gap-2.5">
            {/* Avatar with Online Status Indicator */}
            <div className="relative shrink-0">
              <Avatar className="size-7 border border-border bg-muted">
                {user.imageUrl && <AvatarImage src={user.imageUrl} alt={fullName} />}
                <AvatarFallback className="bg-gradient-to-tr from-indigo-600 to-violet-600 text-[11px] font-bold text-white">
                  {initials.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span
                aria-label="Online"
                title="Online"
                className="absolute -bottom-0.5 -right-0.5 size-2 rounded-full bg-emerald-500 ring-2 ring-background"
              />
            </div>

            {/* User Meta (hidden in icon collapsed mode) */}
            <div className="flex min-w-0 flex-col group-data-[collapsible=icon]:hidden">
              <div className="flex items-center gap-1.5">
                <span className="truncate text-xs font-semibold text-sidebar-foreground">
                  {fullName}
                </span>
                <Badge
                  variant="outline"
                  className="h-3.5 border-border bg-muted/60 px-1 text-[9px] font-medium text-foreground"
                >
                  {roleLabel}
                </Badge>
              </div>
              <span className="truncate text-[10px] text-muted-foreground">{email}</span>
            </div>
          </div>

          <div className="flex items-center text-muted-foreground group-data-[collapsible=icon]:hidden">
            {isSigningOut ? (
              <Spinner className="size-3.5" />
            ) : (
              <ChevronsUpDown className="size-3.5" />
            )}
          </div>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align={align}
        side={side}
        sideOffset={8}
        className="w-60 border-border bg-popover p-1 text-popover-foreground shadow-2xl backdrop-blur-md"
      >
        {/* Profile Details Header */}
        <DropdownMenuLabel className="p-2 font-normal">
          <div className="flex items-center gap-2.5">
            <Avatar className="size-8 border border-border">
              {user.imageUrl && <AvatarImage src={user.imageUrl} alt={fullName} />}
              <AvatarFallback className="bg-primary text-xs font-bold text-primary-foreground">
                {initials.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col min-w-0">
              <span className="truncate text-xs font-semibold text-foreground">{fullName}</span>
              <span className="truncate text-[11px] text-muted-foreground">{email}</span>
            </div>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator className="bg-border" />

        <DropdownMenuGroup className="space-y-0.5">
          {/* Manage Account */}
          <DropdownMenuItem
            onClick={() => clerk.openUserProfile()}
            className="cursor-pointer gap-2 rounded-md px-2.5 py-1.5 text-xs text-foreground hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
          >
            <Settings className="size-3.5 text-muted-foreground" />
            <span>Manage Account</span>
          </DropdownMenuItem>

          {/* Organization Settings */}
          <DropdownMenuItem
            onClick={() => clerk.openOrganizationProfile()}
            className="cursor-pointer gap-2 rounded-md px-2.5 py-1.5 text-xs text-foreground hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
          >
            <Building2 className="size-3.5 text-muted-foreground" />
            <span>Organization Settings</span>
          </DropdownMenuItem>

          {/* Billing & Subscriptions */}
          <DropdownMenuItem
            onClick={() => router.push("/pricing")}
            className="cursor-pointer gap-2 rounded-md px-2.5 py-1.5 text-xs text-foreground hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
          >
            <CreditCard className="size-3.5 text-muted-foreground" />
            <span>Billing &amp; Subscriptions</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator className="bg-border" />

        {/* Sign Out */}
        <DropdownMenuItem
          onClick={handleSignOut}
          disabled={isSigningOut}
          className="cursor-pointer gap-2 rounded-md px-2.5 py-1.5 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive focus:bg-destructive/10 focus:text-destructive disabled:opacity-50"
        >
          {isSigningOut ? (
            <Spinner className="size-3.5 text-destructive" />
          ) : (
            <LogOut className="size-3.5 text-destructive" />
          )}
          <span>Sign Out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
