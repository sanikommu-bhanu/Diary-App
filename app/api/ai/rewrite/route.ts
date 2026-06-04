import { NextRequest, NextResponse } from "next/server"
import { callOpenRouter, PROMPTS } from "@/lib/openrouter"
import { rateLimit, getClientIP } from "@/lib/rate-limit"
import { validateAIRewriteRequest } from "@/lib/validation"
import { logger } from "@/lib/logger"
import { hasOpenRouterKey } from "@/lib/env"

// Rewrite is more expensive — stricter limit
const RATE_LIMIT    = 10
const RATE_WINDOW_MS = 60_000

type PromptFn = (text: string) => string

export async function POST(req: NextRequest) {
  const ip     = getClientIP(req)
  const result = rateLimit(`rewrite:${ip}`, RATE_LIMIT, RATE_WINDOW_MS)
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

  const validated = validateAIRewriteRequest(body)
  if ("error" in validated) {
    return NextResponse.json({ error: validated.error }, { status: 400 })
  }

  const { text, mode } = validated

  const promptMap: Record<string, PromptFn> = {
    fairy:      PROMPTS.fairy,
    poetic:     PROMPTS.poetic,
    calm:       PROMPTS.calm,
    mature:     PROMPTS.mature,
    minimal:    PROMPTS.minimal,
    reflection: PROMPTS.reflection,
    rewrite:    PROMPTS.rewrite,
  }
  const promptFn = promptMap[mode] ?? PROMPTS.rewrite

  try {
    const result = await callOpenRouter(
      [{ role: "user", content: promptFn(text) }],
      { maxTokens: 1200, temperature: mode === "minimal" ? 0.5 : 0.85 },
    )
    return NextResponse.json({ result, mode })
  } catch (err) {
    const message = err instanceof Error ? err.message : "AI request failed"
    logger.error("AI rewrite error", { ip, mode, message })
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
