import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Nodus — Autonomous AI Workflow & Browser Orchestration",
    short_name: "Nodus",
    description:
      "The power of n8n & Zapier, supercharged with autonomous AI browser agents, cloud code sandboxes, and real-time multiplayer collaboration.",
    start_url: "/",
    display: "standalone",
    background_color: "#09090b",
    theme_color: "#09090b",
    icons: [
      {
        src: "/icon",
        sizes: "32x32",
        type: "image/png",
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  }
}
