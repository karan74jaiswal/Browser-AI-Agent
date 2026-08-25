import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN,

  tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,

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
    Sentry.consoleLoggingIntegration({ levels: ["warn", "error"] }),
  ],
})
