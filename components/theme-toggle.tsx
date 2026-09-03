"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useThemeToggle } from "@/components/theme-provider"
import { cn } from "@/lib/utils"

interface ThemeToggleProps {
  className?: string
  side?: "top" | "bottom" | "left" | "right"
  align?: "start" | "center" | "end"
}

export function ThemeToggle({
  className,
  side = "bottom",
  align = "center",
}: ThemeToggleProps) {
  const { toggleTheme } = useThemeToggle()

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className={cn(
            "group relative size-8 rounded-lg border border-border/70 bg-background/60 text-muted-foreground shadow-2xs backdrop-blur-xs transition-all hover:border-border hover:bg-muted hover:text-foreground active:scale-95 cursor-pointer",
            className
          )}
          aria-label="Toggle theme (Press 'D')"
        >
          <Sun className="size-4 rotate-0 scale-100 text-foreground/80 transition-all duration-200 group-hover:text-foreground dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute size-4 rotate-90 scale-0 text-foreground/80 transition-all duration-200 group-hover:text-foreground dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme (Press &apos;D&apos;)</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent side={side} align={align} className="flex items-center gap-1.5 text-xs font-medium">
        <span>Toggle theme</span>
        <kbd className="pointer-events-none inline-flex h-4 select-none items-center rounded border border-border/70 bg-muted px-1 font-mono text-[10px] text-muted-foreground">
          D
        </kbd>
      </TooltipContent>
    </Tooltip>
  )
}
