export interface Workflow {
  id: string
  name: string
}

export const WORKFLOWS: Workflow[] = [
  { id: "hiring-signals", name: "Hiring Signals" },
  { id: "vendor-comparison", name: "Vendor Comparison" },
  { id: "account-research-brief", name: "Account Research Brief" },
  { id: "stock-market-brief", name: "Stock Market Brief" },
  { id: "hacker-news-digest", name: "Hacker News Digest" },
  { id: "daily-ai-news-briefing", name: "Daily AI News Briefing" },
  { id: "roadtrip-planner", name: "Roadtrip Planner" },
  { id: "solve-todays-wordle", name: "Solve Today's Wordle" },
]
