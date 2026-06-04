import { NextRequest, NextResponse } from "next/server"
import { callOpenRouter, PROMPTS } from "@/lib/openrouter"
import { rateLimit, getClientIP } from "@/lib/rate-limit"
import { validateAITextRequest } from "@/lib/validation"
import { logger } from "@/lib/logger"
import { hasOpenRouterKey } from "@/lib/env"

// 20 requests per minute per IP
const RATE_LIMIT = 20
const RATE_WINDOW_MS = 60_000

const VALID_MOODS = ["happy", "sad", "calm", "angry", "dreamy", "romantic", "neutral"] as const

export async function POST(req: NextRequest) {
  // Rate limiting
  const ip     = getClientIP(req)
  const result = rateLimit(`mood:${ip}`, RATE_LIMIT, RATE_WINDOW_MS)
  if (!result.success) {
    return NextResponse.json(
      { error: "Too many requests. Please slow down." },
      {
        status: 429,
        headers: {
          "Retry-After":       String(Math.ceil((result.resetAt - Date.now()) / 1000)),
          "X-RateLimit-Limit": String(result.limit),
          "X-RateLimit-Remaining": String(result.remaining),
        },
      },
    )
  }

  if (!hasOpenRouterKey()) {
    return NextResponse.json({ error: "AI features are not configured." }, { status: 503 })
  }

  // Parse & validate body
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const validated = validateAITextRequest(body)
  if ("error" in validated) {
    return NextResponse.json({ error: validated.error }, { status: 400 })
  }

  try {
    const raw = await callOpenRouter(
      [{ role: "user", content: PROMPTS.mood(validated.text) }],
      { maxTokens: 10, temperature: 0.3 },
    )
    const detected = raw.toLowerCase().trim()
    const mood = VALID_MOODS.find(m => detected.includes(m)) ?? "neutral"
    return NextResponse.json({ result: mood })
  } catch (err) {
    const message = err instanceof Error ? err.message : "AI request failed"
    logger.error("AI mood error", { ip, message })
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
