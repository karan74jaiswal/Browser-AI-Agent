import { ImageResponse } from "next/og"

export const size = {
  width: 180,
  height: 180,
}
export const contentType = "image/png"

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #2563eb 0%, #7c3aed 50%, #ec4899 100%)",
        borderRadius: 38,
      }}
    >
      <svg
        width="144"
        height="144"
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Directed Workflow Edges */}
        <path
          d="M 8.5 9.5 C 15 9.5, 16.5 16, 23.5 16"
          stroke="#ffffff"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
        <path
          d="M 23.5 16 C 16.5 16, 15 22.5, 8.5 22.5"
          stroke="#ffffff"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
        <path
          d="M 8.5 9.5 L 8.5 22.5"
          stroke="#ffffff"
          strokeWidth="1.2"
          strokeDasharray="2 2"
          opacity="0.4"
        />

        {/* Pulse Signal */}
        <circle cx="16" cy="16" r="1.5" fill="#ffffff" />

        {/* Node 1: Input Trigger (Blue) */}
        <circle
          cx="8.5"
          cy="9.5"
          r="3.5"
          fill="#3b82f6"
          stroke="#ffffff"
          strokeWidth="1.8"
        />
        <circle cx="8.5" cy="9.5" r="1.2" fill="#ffffff" />

        {/* Node 2: Stagehand AI Browser Agent (Pink) */}
        <circle
          cx="23.5"
          cy="16"
          r="4.2"
          fill="#ec4899"
          stroke="#ffffff"
          strokeWidth="2"
        />
        <circle cx="23.5" cy="16" r="1.6" fill="#ffffff" />

        {/* Node 3: Output Action (Emerald) */}
        <circle
          cx="8.5"
          cy="22.5"
          r="3.5"
          fill="#10b981"
          stroke="#ffffff"
          strokeWidth="1.8"
        />
        <circle cx="8.5" cy="22.5" r="1.2" fill="#ffffff" />
      </svg>
    </div>,
    {
      ...size,
    }
  )
}
