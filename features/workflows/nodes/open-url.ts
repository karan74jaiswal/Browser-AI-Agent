import type { Stagehand } from "@browserbasehq/stagehand"

export async function openUrl({
  stagehand,
  url,
}: {
  stagehand: Stagehand
  url: string
}) {
  const [page] = await stagehand.browser.context.pages()
  const cleanUrl = url.trim().replace(/[\u200B\uFEFF\u00A0]/g, "")
  const response = await page.goto(cleanUrl, {
    waitUntil: "load",
    timeout: 30_000,
  })

  if (response && !response.ok() && response.status() >= 400) {
    throw new Error(
      `Failed to open URL "${cleanUrl}": received HTTP ${response.status()} ${response.statusText()}`
    )
  }

  return { url: await page.url(), title: await page.title() }
}
