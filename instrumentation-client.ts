import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,

  // Session Replay: 10% of sessions, 100% of sessions with errors
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  enableLogs: true,

  beforeSendLog: (log) => {
    if (
      process.env.NODE_ENV === "production" &&
      (log.level === "debug" || log.level === "trace")
    ) {
      return null
    }
    return log
  },

  integrations: [
    Sentry.replayIntegration(),
    Sentry.consoleLoggingIntegration({ levels: ["warn", "error"] }),
  ],
})

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
