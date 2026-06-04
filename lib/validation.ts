/**
 * lib/validation.ts — Input validation & sanitization helpers
 */

import type { Entry, Mood, AIMode } from "@/types"

// ─── Constants ────────────────────────────────────────────────────────────────
export const LIMITS = {
  AI_TEXT_MAX:    10_000,   // characters — AI input
  TITLE_MAX:        200,   // characters
  ENTRY_TEXT_MAX: 50_000,  // characters
  TAG_MAX_LEN:       50,   // per tag
  TAGS_COUNT_MAX:    20,   // tags per entry
  NAME_MAX:          50,   // display name
  PIN_MIN:            4,
  PIN_MAX:            6,
} as const

export const VALID_MOODS: readonly Mood[] = [
  "happy", "sad", "calm", "angry", "dreamy", "romantic", "neutral",
]

export const VALID_AI_MODES: readonly AIMode[] = [
  "rewrite", "fairy", "poetic", "calm", "mature", "minimal",
  "title", "mood", "reflection",
]

// ─── Sanitization ─────────────────────────────────────────────────────────────

/** Strip control characters (except newlines/tabs) and trim to maxLength. */
export function sanitizeString(input: unknown, maxLength: number): string {
  if (typeof input !== "string") return ""
  return input
    // eslint-disable-next-line no-control-regex
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "") // strip dangerous control chars
    .slice(0, maxLength)
    .trim()
}

/** Validate a PIN: digits only, correct length. */
export function validatePIN(pin: unknown, length: number): string | null {
  if (typeof pin !== "string") return "PIN must be a string"
  if (!/^\d+$/.test(pin))     return "PIN must contain digits only"
  if (pin.length !== length)  return `PIN must be exactly ${length} digits`
  return null
}

// ─── AI request validation ────────────────────────────────────────────────────

export interface ValidatedAIRewriteRequest {
  text: string
  mode: AIMode
}

export function validateAIRewriteRequest(body: unknown): ValidatedAIRewriteRequest | { error: string } {
  if (!body || typeof body !== "object") return { error: "Invalid request body" }
  const b = body as Record<string, unknown>

  const text = sanitizeString(b.text, LIMITS.AI_TEXT_MAX)
  if (!text) return { error: "text is required" }

  const rawMode = typeof b.mode === "string" ? b.mode : "rewrite"
  const mode = VALID_AI_MODES.includes(rawMode as AIMode) ? (rawMode as AIMode) : "rewrite"

  return { text, mode }
}

export interface ValidatedAITextRequest {
  text: string
}

export function validateAITextRequest(body: unknown): ValidatedAITextRequest | { error: string } {
  if (!body || typeof body !== "object") return { error: "Invalid request body" }
  const b = body as Record<string, unknown>
  const text = sanitizeString(b.text, LIMITS.AI_TEXT_MAX)
  if (!text) return { error: "text is required" }
  return { text }
}

export interface ValidatedAISummaryRequest {
  entries: Array<{ createdAt?: string; mood?: string; rawText?: string }>
  type: "weekly" | "monthly"
}

export function validateAISummaryRequest(body: unknown): ValidatedAISummaryRequest | { error: string } {
  if (!body || typeof body !== "object") return { error: "Invalid request body" }
  const b = body as Record<string, unknown>

  if (!Array.isArray(b.entries) || b.entries.length === 0) {
    return { error: "entries must be a non-empty array" }
  }
  if (b.entries.length > 31) return { error: "Too many entries" }

  const type: "weekly" | "monthly" = b.type === "monthly" ? "monthly" : "weekly"

  const entries = (b.entries as unknown[]).map((e) => {
    if (!e || typeof e !== "object") return { rawText: "" }
    const entry = e as Record<string, unknown>
    return {
      createdAt: sanitizeString(entry.createdAt, 30),
      mood:      sanitizeString(entry.mood, 20),
      rawText:   sanitizeString(entry.rawText, LIMITS.AI_TEXT_MAX / 10),
    }
  })

  return { entries, type }
}

// ─── Entry validation ─────────────────────────────────────────────────────────

export function validateImportEntry(e: unknown): e is Entry {
  if (!e || typeof e !== "object") return false
  const entry = e as Record<string, unknown>
  return (
    typeof entry.id === "string" &&
    typeof entry.title === "string" &&
    typeof entry.rawText === "string" &&
    typeof entry.createdAt === "string" &&
    typeof entry.updatedAt === "string" &&
    VALID_MOODS.includes(entry.mood as Mood) &&
    Array.isArray(entry.tags) &&
    typeof entry.favorite === "boolean" &&
    Array.isArray(entry.mediaIds)
  )
}
