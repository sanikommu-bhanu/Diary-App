/**
 * lib/rate-limit.ts — In-memory sliding-window rate limiter
 *
 * NOTE: This is instance-local. In a multi-instance / serverless deployment,
 * replace with a distributed store (e.g. Upstash Redis + @upstash/ratelimit).
 */

interface Window {
  count: number
  resetAt: number
}

const store = new Map<string, Window>()

// Garbage-collect stale entries every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now()
    for (const [key, win] of store.entries()) {
      if (now > win.resetAt) store.delete(key)
    }
  }, 5 * 60 * 1000)
}

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  resetAt: number
}

/**
 * @param key     Unique identifier (e.g. IP address or route name)
 * @param limit   Max requests allowed within `windowMs`
 * @param windowMs  Duration of the window in milliseconds
 */
export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now()
  let win = store.get(key)

  if (!win || now > win.resetAt) {
    win = { count: 0, resetAt: now + windowMs }
    store.set(key, win)
  }

  win.count++

  return {
    success:   win.count <= limit,
    limit,
    remaining: Math.max(0, limit - win.count),
    resetAt:   win.resetAt,
  }
}

/** Extract best-effort IP from Next.js request headers */
export function getClientIP(req: Request | { headers: Headers }): string {
  const headers = req instanceof Request ? req.headers : (req as { headers: Headers }).headers
  return (
    headers.get("x-real-ip") ||
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  )
}
