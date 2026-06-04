/**
 * lib/logger.ts — Structured logging with severity levels
 * Replace the console calls here with your observability provider
 * (e.g. Sentry, Datadog, LogRocket) when adding monitoring.
 */

type Level = "debug" | "info" | "warn" | "error"

interface LogEntry {
  level: Level
  message: string
  context?: Record<string, unknown>
  timestamp: string
}

function log(level: Level, message: string, context?: Record<string, unknown>): void {
  const entry: LogEntry = {
    level,
    message,
    context,
    timestamp: new Date().toISOString(),
  }

  if (process.env.NODE_ENV === "development") {
    const fn = level === "error" ? console.error
             : level === "warn"  ? console.warn
             : level === "debug" ? console.debug
             : console.log
    fn(`[${entry.timestamp}] [${level.toUpperCase()}]`, message, context ?? "")
    return
  }

  // Production: structured JSON to stdout (captured by log aggregators)
  if (level === "error" || level === "warn") {
    console.error(JSON.stringify(entry))
  }

  // TODO: forward to monitoring provider (Sentry, Datadog, etc.)
  // if (level === "error") Sentry.captureException(context?.error ?? new Error(message))
}

export const logger = {
  debug: (msg: string, ctx?: Record<string, unknown>) => log("debug", msg, ctx),
  info:  (msg: string, ctx?: Record<string, unknown>) => log("info",  msg, ctx),
  warn:  (msg: string, ctx?: Record<string, unknown>) => log("warn",  msg, ctx),
  error: (msg: string, ctx?: Record<string, unknown>) => log("error", msg, ctx),
}
