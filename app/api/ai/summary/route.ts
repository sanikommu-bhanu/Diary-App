import { NextRequest, NextResponse } from "next/server"
import { callOpenRouter, PROMPTS } from "@/lib/openrouter"
import { rateLimit, getClientIP } from "@/lib/rate-limit"
import { validateAISummaryRequest } from "@/lib/validation"
import { logger } from "@/lib/logger"
import { hasOpenRouterKey } from "@/lib/env"

const RATE_LIMIT    = 5
const RATE_WINDOW_MS = 60_000

export async function POST(req: NextRequest) {
  const ip     = getClientIP(req)
  const result = rateLimit(`summary:${ip}`, RATE_LIMIT, RATE_WINDOW_MS)
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

  const validated = validateAISummaryRequest(body)
  if ("error" in validated) {
    return NextResponse.json({ error: validated.error }, { status: 400 })
  }

  const { entries, type } = validated
  const limit = type === "monthly" ? 30 : 7
  const entriesText = entries
    .slice(0, limit)
    .map(e => `[${e.createdAt?.slice(0, 10) ?? ""}] ${e.mood?.toUpperCase() ?? ""}: ${e.rawText ?? ""}`)
    .join("\n")

  const prompt = type === "monthly"
    ? PROMPTS.monthlySummary(entriesText)
    : PROMPTS.weeklySummary(entriesText)

  try {
    const text = await callOpenRouter(
      [{ role: "user", content: prompt }],
      { maxTokens: 500, temperature: 0.75 },
    )
    return NextResponse.json({ result: text })
  } catch (err) {
    const message = err instanceof Error ? err.message : "AI request failed"
    logger.error("AI summary error", { ip, type, message })
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
