import { NextRequest, NextResponse } from "next/server"
import { callOpenRouter, PROMPTS } from "@/lib/openrouter"
import { rateLimit, getClientIP } from "@/lib/rate-limit"
import { validateAITextRequest } from "@/lib/validation"
import { logger } from "@/lib/logger"
import { hasOpenRouterKey } from "@/lib/env"

// Reflection is thoughtful — moderate rate limit
const RATE_LIMIT = 15
const RATE_WINDOW_MS = 60_000

export async function POST(req: NextRequest) {
  const ip = getClientIP(req)
  const result = rateLimit(`reflect:${ip}`, RATE_LIMIT, RATE_WINDOW_MS)
  if (!result.success) {
    return NextResponse.json(
      { error: "Too many requests. Please slow down." },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((result.resetAt - Date.now()) / 1000)),
          "X-RateLimit-Limit": String(result.limit),
          "X-RateLimit-Remaining": String(result.remaining),
        },
      },
    )
  }

  if (!hasOpenRouterKey()) {
    return NextResponse.json({ error: "AI features are not configured." }, { status: 503 })
  }

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
      [{ role: "user", content: PROMPTS.reflection(validated.text) }],
      { maxTokens: 300, temperature: 0.8 },
    )

    // Parse numbered questions from response
    const questions = raw
      .split("\n")
      .map((line) => line.replace(/^\d+\.\s*/, "").trim())
      .filter((line) => line.length > 10)
      .slice(0, 3)

    return NextResponse.json({ result: questions })
  } catch (err) {
    const message = err instanceof Error ? err.message : "AI request failed"
    logger.error("AI reflect error", { ip, message })
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
