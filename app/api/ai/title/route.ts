import { NextRequest, NextResponse } from "next/server"
import { callOpenRouter, PROMPTS } from "@/lib/openrouter"
import { rateLimit, getClientIP } from "@/lib/rate-limit"
import { validateAITextRequest } from "@/lib/validation"
import { logger } from "@/lib/logger"
import { hasOpenRouterKey } from "@/lib/env"

const RATE_LIMIT    = 20
const RATE_WINDOW_MS = 60_000

export async function POST(req: NextRequest) {
  const ip     = getClientIP(req)
  const result = rateLimit(`title:${ip}`, RATE_LIMIT, RATE_WINDOW_MS)
  if (!result.success) {
    return NextResponse.json({ error: "Too many requests. Please slow down." }, { status: 429 })
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
      [{ role: "user", content: PROMPTS.title(validated.text) }],
      { maxTokens: 60, temperature: 0.9 },
    )
    const title = raw.replace(/^["''""]/g, "").replace(/["''"""]$/g, "").trim()
    return NextResponse.json({ result: title })
  } catch (err) {
    const message = err instanceof Error ? err.message : "AI request failed"
    logger.error("AI title error", { ip, message })
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
