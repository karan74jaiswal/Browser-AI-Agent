"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth, UserButton } from "@clerk/nextjs"
import { ArrowRight, Workflow, Zap } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function PublicNavbar() {
  const pathname = usePathname()
  const { isLoaded, isSignedIn } = useAuth()

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 w-full max-w-7xl mx-auto items-center justify-between px-4 sm:px-8">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs group-hover:scale-105 transition-transform duration-200">
              <Zap className="size-4 fill-primary-foreground" />
            </div>
            <span className="font-semibold text-base tracking-tight text-foreground">
              Nodus
            </span>
          </Link>

          {/* Navigation links */}
          <nav className="hidden md:flex items-center gap-1">
            <Link
              href="/templates"
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
                pathname === "/templates"
                  ? "bg-accent text-accent-foreground font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              )}
            >
              Templates
            </Link>
            <Link
              href="/pricing"
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
                pathname === "/pricing"
                  ? "bg-accent text-accent-foreground font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              )}
            >
              Pricing
            </Link>
          </nav>
        </div>

        {/* Auth CTA Actions */}
        <div className="flex items-center gap-2.5">
          {isLoaded && (
            <>
              {!isSignedIn ? (
                <>
                  <Button
                    asChild
                    variant="ghost"
                    size="sm"
                    className="h-8 px-3 text-xs text-muted-foreground hover:text-foreground"
                  >
                    <Link href="/sign-in">Sign In</Link>
                  </Button>
                  <Button
                    asChild
                    size="sm"
                    className="h-8 px-3 text-xs font-medium gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Link href="/sign-up">
                      <span>Get Started</span>
                      <ArrowRight className="size-3" />
                    </Link>
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="h-8 px-3 text-xs font-medium gap-1.5"
                  >
                    <Link href="/">
                      <Workflow className="size-3.5" />
                      <span>Dashboard</span>
                    </Link>
                  </Button>
                  <UserButton
                    appearance={{
                      elements: {
                        avatarBox: "size-8",
                      },
                    }}
                  />
                </>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  )
}
