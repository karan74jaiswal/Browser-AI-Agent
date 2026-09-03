"use client"

import * as React from "react"

export function AmbientSpotlight() {
  const [mousePosition, setMousePosition] = React.useState({ x: -1000, y: -1000 })
  const [isMounted, setIsMounted] = React.useState(false)

  React.useEffect(() => {
    setIsMounted(true)
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }

    window.addEventListener("mousemove", handleMouseMove)
    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
    }
  }, [])

  if (!isMounted) return null

  return (
    <>
      {/* 1. Global Subtle Canvas Dot Grid */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 opacity-45 dark:opacity-35"
        style={{
          backgroundImage:
            "radial-gradient(hsl(var(--foreground) / 0.15) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      {/* 2. Interactive Mouse-Following Radial Spotlight */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-10 transition-opacity duration-300"
        style={{
          background: `radial-gradient(550px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(59, 130, 246, 0.15), rgba(236, 72, 153, 0.08), transparent 70%)`,
        }}
      />
    </>
  )
}
