import type { Metadata, Viewport } from "next"
import { ClerkProvider } from "@clerk/nextjs"
import { shadcn } from "@clerk/ui/themes"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" })

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
  ],
  width: "device-width",
  initialScale: 1,
}

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: "Nodus — Autonomous AI Workflow & Browser Orchestration",
    template: "%s | Nodus",
  },
  description:
    "The power of n8n & Zapier, supercharged with autonomous AI browser agents, cloud code sandboxes, durable DAG execution, and real-time multiplayer collaboration.",
  applicationName: "Nodus",
  authors: [{ name: "Nodus Team" }],
  keywords: [
    "AI agents",
    "browser automation",
    "workflow automation",
    "DAG execution",
    "n8n alternative",
    "Zapier alternative",
    "Stagehand",
    "Browserbase",
    "E2B sandbox",
    "Trigger.dev",
    "Liveblocks",
  ],
  creator: "Nodus",
  publisher: "Nodus",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: appUrl,
    title: "Nodus — Autonomous AI Workflow & Browser Orchestration",
    description:
      "Design complex automations on a real-time multiplayer canvas, execute isolated Python/JS in cloud sandboxes, and orchestrate autonomous AI browser agents.",
    siteName: "Nodus",
  },
  twitter: {
    card: "summary_large_image",
    title: "Nodus — Autonomous AI Workflow & Browser Orchestration",
    description:
      "Autonomous AI browser agents, multi-language cloud sandboxes, durable DAG execution, and real-time multiplayer collaboration.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "antialiased",
        fontMono.variable,
        "font-sans",
        geist.variable
      )}
    >
      <body>
        <ClerkProvider
          appearance={{ theme: shadcn }}
          taskUrls={{ "choose-organization": "/choose-organization" }}
        >
          <ThemeProvider>
            <TooltipProvider delayDuration={0}>
              {children}
              <Toaster />
            </TooltipProvider>
          </ThemeProvider>
        </ClerkProvider>
      </body>
    </html>
  )
}
