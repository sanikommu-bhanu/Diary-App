import { NextRequest, NextResponse } from "next/server"
import { callOpenRouter } from "@/lib/openrouter"
import { rateLimit, getClientIP } from "@/lib/rate-limit"
import { logger } from "@/lib/logger"
import { hasOpenRouterKey } from "@/lib/env"
import { sanitizeString, LIMITS } from "@/lib/validation"

// Analytics is expensive — strict rate limit
const RATE_LIMIT = 3
const RATE_WINDOW_MS = 60_000

interface AnalyticsEntry {
  createdAt?: string
  mood?: string
  rawText?: string
  wordCount?: number
  tags?: string[]
}

function validateAnalyticsRequest(
  body: unknown,
): { entries: AnalyticsEntry[] } | { error: string } {
  if (!body || typeof body !== "object") return { error: "Invalid request body" }
  const b = body as Record<string, unknown>

  if (!Array.isArray(b.entries) || b.entries.length === 0) {
    return { error: "entries must be a non-empty array" }
  }
  if (b.entries.length > 100) return { error: "Too many entries (max 100)" }

  const entries = (b.entries as unknown[]).map((e) => {
    if (!e || typeof e !== "object") return { rawText: "" }
    const entry = e as Record<string, unknown>
    return {
      createdAt: sanitizeString(entry.createdAt, 30),
      mood: sanitizeString(entry.mood, 20),
      rawText: sanitizeString(entry.rawText, LIMITS.AI_TEXT_MAX / 20),
      wordCount: typeof entry.wordCount === "number" ? entry.wordCount : 0,
      tags: Array.isArray(entry.tags)
        ? (entry.tags as unknown[])
            .filter((t): t is string => typeof t === "string")
            .slice(0, 10)
        : [],
    }
  })

  return { entries }
}

const ANALYTICS_PROMPT = (data: string) =>
  `You are a thoughtful writing coach and emotional intelligence analyst for a personal diary app.

Analyze the following diary entries data and provide a concise, encouraging writing analytics report.

Include these sections (use markdown headings):
## Emotional Journey
A 2-3 sentence summary of the emotional arc across these entries.

## Writing Patterns
- Average entry length trend (growing/shrinking/stable)
- Most common moods
- Writing frequency observations

## Growth Insights
2-3 specific, actionable insights about personal growth observed in the entries.

## Encouragement
A warm, personalized encouragement based on the writing patterns.

Entries data:
${data}

Keep the total response under 400 words. Be warm, insightful, and specific.`

export async function POST(req: NextRequest) {
  const ip = getClientIP(req)
  const result = rateLimit(`analytics:${ip}`, RATE_LIMIT, RATE_WINDOW_MS)
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

  const validated = validateAnalyticsRequest(body)
  if ("error" in validated) {
    return NextResponse.json({ error: validated.error }, { status: 400 })
  }

  const { entries } = validated

  // Summarize entries for the prompt
  const moodCounts: Record<string, number> = {}
  let totalWords = 0
  const tagSet = new Set<string>()

  for (const entry of entries) {
    if (entry.mood) {
      moodCounts[entry.mood] = (moodCounts[entry.mood] ?? 0) + 1
    }
    totalWords += entry.wordCount ?? 0
    entry.tags?.forEach((t) => tagSet.add(t))
  }

  const dataSnapshot = [
    `Total entries: ${entries.length}`,
    `Total words: ${totalWords}`,
    `Average words/entry: ${Math.round(totalWords / entries.length)}`,
    `Mood distribution: ${Object.entries(moodCounts).map(([m, c]) => `${m}(${c})`).join(", ")}`,
    `Common tags: ${Array.from(tagSet).slice(0, 15).join(", ") || "none"}`,
    `Date range: ${entries[entries.length - 1]?.createdAt?.slice(0, 10) ?? "?"} to ${entries[0]?.createdAt?.slice(0, 10) ?? "?"}`,
    "",
    "Recent entry excerpts:",
    ...entries.slice(0, 5).map(
      (e, i) =>
        `${i + 1}. [${e.createdAt?.slice(0, 10) ?? ""}] ${e.mood?.toUpperCase() ?? ""}: ${e.rawText?.slice(0, 150) ?? ""}...`,
    ),
  ].join("\n")

  try {
    const text = await callOpenRouter(
      [{ role: "user", content: ANALYTICS_PROMPT(dataSnapshot) }],
      { maxTokens: 600, temperature: 0.7 },
    )
    return NextResponse.json({
      result: text,
      stats: {
        totalEntries: entries.length,
        totalWords,
        avgWordsPerEntry: Math.round(totalWords / entries.length),
        moodDistribution: moodCounts,
        topTags: Array.from(tagSet).slice(0, 10),
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "AI request failed"
    logger.error("AI analytics error", { ip, message })
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
