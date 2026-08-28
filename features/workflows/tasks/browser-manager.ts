import { logger } from "@trigger.dev/sdk"
import {
  browserbase,
  localBrowser,
  Stagehand,
  type StagehandBrowser,
} from "@browserbasehq/stagehand"

export interface BrowserSessionManager {
  getStagehand: () => Promise<Stagehand>
  getSessionId: () => string | undefined
  close: () => Promise<void>
}

/**
 * Manages the lifecycle of Browserbase / local browser and Stagehand sessions.
 * Initializes the browser session lazily on the first request and guarantees safe cleanup.
 */
export function createBrowserSessionManager(): BrowserSessionManager {
  let stagehand: Stagehand | undefined
  let browser: StagehandBrowser | undefined
  let sessionId: string | undefined

  const getStagehand = async (): Promise<Stagehand> => {
    if (stagehand) return stagehand
    try {
      browser = process.env.BROWSERBASE_API_KEY
        ? await browserbase.launch({
            apiKey: process.env.BROWSERBASE_API_KEY,
            userMetadata: { stagehand: "true" },
          })
        : await localBrowser.launch({ headless: true })

      sessionId = browser.sessionId

      stagehand = await Stagehand.create({
        browser,
        model: {
          ...(process.env.BROWSERBASE_API_KEY
            ? {
                modelName: "google/gemini-2.5-flash",
              }
            : {
                modelName: "google/gemini-3.6-flash",
                apiKey: process.env.GEMINI_API_KEY!,
              }),
        },
        logging: {
          level: "off",
        },
      })

      return stagehand
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      logger.error("Failed to initialize browser session", {
        error: error.message,
      })
      throw error
    }
  }

  const close = async (): Promise<void> => {
    try {
      if (stagehand) {
        await stagehand.close()
      }
    } catch (err) {
      logger.warn("Stagehand session cleanup notice", {
        error: err instanceof Error ? err.message : String(err),
      })
    } finally {
      try {
        if (browser) {
          await browser.close()
        }
      } catch (err) {
        logger.warn("Browser session cleanup notice", {
          error: err instanceof Error ? err.message : String(err),
        })
      }
    }
  }

  return {
    getStagehand,
    getSessionId: () => sessionId,
    close,
  }
}
