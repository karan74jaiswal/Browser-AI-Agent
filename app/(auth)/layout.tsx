import * as React from "react"
import Link from "next/link"
import { NodusLogo } from "@/components/nodus-logo"
import { ThemeToggle } from "@/components/theme-toggle"
import { Shield } from "lucide-react"

export default function AuthLayout({ children }: { children: React.ReactNode }) {

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-background p-4 text-foreground selection:bg-primary/20 selection:text-primary">
      {/* 1. Subtle Theme-Aware Canvas Dot Grid */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 opacity-40 dark:opacity-20"
        style={{
          backgroundImage:
            "radial-gradient(currentColor 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      {/* 2. Ambient Gradient Glow Orbs (harmonized for light & dark mode) */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed -top-40 left-1/2 -z-10 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-gradient-to-tr from-indigo-500/15 via-blue-500/10 to-transparent blur-3xl dark:from-indigo-600/20 dark:via-blue-600/10"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed -bottom-40 left-1/3 -z-10 h-[480px] w-[480px] rounded-full bg-gradient-to-br from-pink-500/10 via-purple-500/10 to-transparent blur-3xl dark:from-pink-600/15 dark:via-purple-600/10"
      />

      {/* 3. Top Action Bar: Brand Logo & Theme Toggle */}
      <header className="fixed top-0 left-0 right-0 z-20 flex items-center justify-between px-6 py-4">
        <Link
          href="/"
          className="group flex items-center gap-2.5 transition-transform hover:scale-105 active:scale-95"
        >
          <NodusLogo size={32} withText textSize="text-lg" />
        </Link>

        {/* Theme Toggle */}
        <ThemeToggle />
      </header>

      {/* 4. Auth Form Container */}
      <main className="z-10 flex w-full justify-center pt-14 pb-8">{children}</main>

      {/* 5. Minimal Footer */}
      <footer className="z-10 flex items-center gap-1.5 text-xs text-muted-foreground">
        <Shield className="size-3.5" />
        <span>Secured with Clerk &bull; Enterprise-grade Security</span>
      </footer>
    </div>
  )
}
