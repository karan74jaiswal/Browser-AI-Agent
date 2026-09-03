"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@clerk/nextjs"
import { CustomUserButton } from "@/components/custom-user-button"
import { ThemeToggle } from "@/components/theme-toggle"
import {
  ArrowRight,
  Menu,
  Sparkles,
  Workflow,
  X,
} from "lucide-react"
import { motion, AnimatePresence } from "motion/react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { NodusLogo } from "@/components/nodus-logo"

const NAV_LINKS = [
  { label: "Features", href: "/#features" },
  { label: "Multiplayer", href: "/#multiplayer" },
  { label: "Sandboxes", href: "/#sandboxes" },
  { label: "Templates", href: "/templates" },
  { label: "Pricing", href: "/#pricing" },
]

export function PublicNavbar() {
  const pathname = usePathname()
  const { isLoaded, isSignedIn } = useAuth()
  const [hoveredLink, setHoveredLink] = React.useState<string | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 w-full max-w-7xl mx-auto items-center justify-between px-4 sm:px-8">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2.5 group">
            <NodusLogo size={30} />
            <span className="font-bold text-base tracking-tight text-foreground">
              Nodus
            </span>
          </Link>

          {/* Desktop Navigation links */}
          <nav
            className="hidden md:flex items-center gap-1 relative"
            onMouseLeave={() => setHoveredLink(null)}
          >
            {NAV_LINKS.map((link) => {
              const isActive =
                pathname === link.href ||
                (link.href === "/templates" && pathname.startsWith("/templates"))
              const isHovered = hoveredLink === link.href

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onMouseEnter={() => setHoveredLink(link.href)}
                  className={cn(
                    "relative px-3 py-1.5 text-xs font-medium rounded-md transition-colors duration-200 z-10",
                    isActive
                      ? "text-foreground font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {isHovered && (
                    <motion.span
                      layoutId="navbar-hover-pill"
                      className="absolute inset-0 -z-10 rounded-md bg-muted/70"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  {isActive && !isHovered && (
                    <span className="absolute inset-0 -z-10 rounded-md bg-accent/60" />
                  )}
                  {link.label}
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Auth CTA Actions & Mobile Toggle */}
        <div className="flex items-center gap-2.5">
          {/* Theme Mode Toggle */}
          <ThemeToggle />

          {isLoaded && (
            <>
              {!isSignedIn ? (
                <>
                  <Button
                    asChild
                    variant="ghost"
                    size="sm"
                    className="hidden sm:inline-flex h-8 px-3 text-xs text-muted-foreground hover:text-foreground"
                  >
                    <Link href="/sign-in">Sign In</Link>
                  </Button>
                  <Button
                    asChild
                    size="sm"
                    className="relative group h-8 px-3.5 text-xs font-medium gap-1.5 cursor-pointer shadow-xs overflow-hidden"
                  >
                    <Link href="/sign-up">
                      <span className="relative z-10 flex items-center gap-1.5">
                        <span>Get Started Free</span>
                        <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
                      </span>
                      {/* Subtle shimmer sheen */}
                      <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none" />
                    </Link>
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    asChild
                    variant="default"
                    size="sm"
                    className="h-8 px-3 text-xs font-medium gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Link href="/workflows">
                      <Workflow className="size-3.5" />
                      <span>Go to Dashboard</span>
                      <ArrowRight className="size-3" />
                    </Link>
                  </Button>
                  <CustomUserButton align="end" side="bottom" />
                </>
              )}
            </>
          )}

          {/* Mobile menu toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden size-8 text-muted-foreground hover:text-foreground"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X className="size-4" /> : <Menu className="size-4" />}
          </Button>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden border-b border-border/60 bg-background/95 backdrop-blur-lg px-4 py-4 space-y-3"
          >
            <nav className="flex flex-col space-y-1">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 rounded-md transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            {!isSignedIn && isLoaded && (
              <div className="pt-2 border-t border-border/50 flex flex-col gap-2">
                <Button asChild variant="outline" size="sm" className="w-full text-xs">
                  <Link href="/sign-in" onClick={() => setMobileMenuOpen(false)}>
                    Sign In
                  </Link>
                </Button>
                <Button asChild size="sm" className="w-full text-xs gap-1.5">
                  <Link href="/sign-up" onClick={() => setMobileMenuOpen(false)}>
                    <Sparkles className="size-3.5" />
                    <span>Get Started Free</span>
                  </Link>
                </Button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
