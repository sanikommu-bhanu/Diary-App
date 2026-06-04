/**
 * lib/monitoring.ts — Unified error reporting & performance monitoring
 *
 * Hooks for Sentry. To activate:
 *   1. npm install @sentry/nextjs
 *   2. Set NEXT_PUBLIC_SENTRY_DSN in your environment
 *   3. Run `npx @sentry/wizard -i nextjs` to finish setup
 */

type SentryLike = {
  captureException: (err: Error, ctx?: object) => void
  captureMessage:   (msg: string, level?: string) => void
  addBreadcrumb:    (b: object) => void
  setUser:          (u: object | null) => void
  withScope:        (cb: (scope: object) => void) => void
}

function getSentry(): SentryLike | null {
  if (typeof window === "undefined") return null
  // Only load Sentry if it was installed and DSN configured
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) return null
  try {
    // Dynamic require so it's optional — won't break if not installed
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require("@sentry/nextjs") as SentryLike
  } catch {
    return null
  }
}

export function captureError(
  error: Error,
  context?: Record<string, unknown>,
): void {
  // Always log locally
  console.error("[monitoring]", error.message, context ?? "")

  const sentry = getSentry()
  if (!sentry) return

  sentry.captureException(error, { extra: context })
}

export function captureMessage(
  message: string,
  level: "info" | "warning" | "error" = "info",
  context?: Record<string, unknown>,
): void {
  if (process.env.NODE_ENV === "development") {
    console.log(`[monitoring] [${level}]`, message, context ?? "")
  }

  const sentry = getSentry()
  if (!sentry) return
  sentry.captureMessage(message, level)
}

export function addBreadcrumb(
  message: string,
  category: string,
  data?: Record<string, unknown>,
): void {
  const sentry = getSentry()
  if (!sentry) return
  sentry.addBreadcrumb({ message, category, data, timestamp: Date.now() / 1000 })
}

/** Call on successful auth to associate errors with a non-PII user token */
export function setMonitoringUser(token: string | null): void {
  const sentry = getSentry()
  if (!sentry) return
  sentry.setUser(token ? { id: token } : null)
}

/** Wrap an async function with automatic error capture */
export function withErrorCapture<T>(
  fn: () => Promise<T>,
  context?: Record<string, unknown>,
): Promise<T> {
  return fn().catch((err: Error) => {
    captureError(err, context)
    throw err
  })
}
