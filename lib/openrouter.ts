/**
 * lib/openrouter.ts — OpenRouter AI client
 *
 * Improvements:
 * - AbortController timeout (30 s default)
 * - Sanitized error messages (no internal leakage)
 * - Model & token validation
 */
import { env } from "@/lib/env"
import { logger } from "@/lib/logger"

const OPENROUTER_BASE = "https://openrouter.ai/api/v1"
const DEFAULT_TIMEOUT_MS = 30_000

interface Message {
  role: "user" | "assistant" | "system"
  content: string
}

interface OpenRouterOptions {
  model?:       string
  maxTokens?:   number
  temperature?: number
  timeoutMs?:   number
}

export async function callOpenRouter(
  messages: Message[],
  options: OpenRouterOptions = {},
): Promise<string> {
  const apiKey = env.OPENROUTER_API_KEY
  if (!apiKey) throw new Error("AI service is not configured.")

  const controller = new AbortController()
  const timeoutId  = setTimeout(
    () => controller.abort(),
    options.timeoutMs ?? DEFAULT_TIMEOUT_MS,
  )

  try {
    const response = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization:  `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": env.NEXT_PUBLIC_APP_URL,
        "X-Title":      "FairyDiary",
      },
      body: JSON.stringify({
        model:       options.model       ?? env.OPENROUTER_MODEL,
        messages,
        max_tokens:  options.maxTokens   ?? 1_000,
        temperature: options.temperature ?? 0.8,
      }),
      signal: controller.signal,
    })

    if (!response.ok) {
      // Log the full error internally but return a sanitized message
      const errBody = await response.json().catch(() => ({})) as Record<string, unknown>
      logger.error("OpenRouter upstream error", {
        status:  response.status,
        message: (errBody.error as Record<string, unknown>)?.message,
      })

      if (response.status === 429) throw new Error("AI service is busy — please try again shortly.")
      if (response.status === 503) throw new Error("AI service is temporarily unavailable.")
      throw new Error("AI request failed. Please try again.")
    }

    const data = await response.json() as {
      choices?: Array<{ message?: { content?: string } }>
    }
    return data.choices?.[0]?.message?.content?.trim() ?? ""
  } catch (err) {
    if ((err as Error).name === "AbortError") {
      throw new Error("AI request timed out. Please try again.")
    }
    throw err
  } finally {
    clearTimeout(timeoutId)
  }
}

// ─── Prompt Templates ─────────────────────────────────────────────────────────
export const PROMPTS = {
  rewrite: (text: string) =>
    `You are a warm, eloquent writing assistant for a personal diary app called FairyDiary.
Rewrite the following diary entry to be more beautifully expressed while keeping the author's voice, emotions, and meaning intact.
Make it vivid, authentic, and emotionally resonant. Keep approximately the same length.

Original entry:
"${text}"

Rewrite (respond with only the rewritten text, no preamble):`,

  fairy: (text: string) =>
    `You are a magical fairy storyteller rewriting diary entries in an enchanted, whimsical style.
Transform this diary entry into something that feels like a fairy tale — magical, sparkling, full of wonder and imagery.
Keep the core events and feelings, but infuse them with fairy tale magic and poetic beauty.

Original entry:
"${text}"

Fairy tale version (respond with only the rewritten text):`,

  poetic: (text: string) =>
    `You are a lyrical poet transforming diary entries into poetic prose.
Rewrite this diary entry in a deeply poetic style — use metaphors, imagery, sensory language, and emotional depth.
Make it flow like a poem in paragraph form, evocative and beautiful.

Original entry:
"${text}"

Poetic version (respond with only the rewritten text):`,

  calm: (text: string) =>
    `You are a mindfulness writer helping someone process their day with peace and clarity.
Rewrite this diary entry in a calm, grounded, gentle voice — like writing in a mindfulness journal.
Focus on acceptance, gentle observation, and peaceful reflection.

Original entry:
"${text}"

Calm version (respond with only the rewritten text):`,

  mature: (text: string) =>
    `You are a sophisticated writer helping articulate deep thoughts and experiences.
Rewrite this diary entry in a mature, eloquent, and thoughtful voice — like a seasoned author writing their memoir.
Use rich vocabulary, nuanced observations, and mature reflection.

Original entry:
"${text}"

Mature version (respond with only the rewritten text):`,

  minimal: (text: string) =>
    `You are a minimalist writer who believes in the power of fewer, precise words.
Rewrite this diary entry in a clean, minimal style — strip away the unnecessary, keep only what matters most.
Make every word count. Short sentences. Clear emotion. Pure essence.

Original entry:
"${text}"

Minimal version (respond with only the rewritten text):`,

  title: (text: string) =>
    `Generate a beautiful, evocative title for this diary entry.
The title should be poetic, personal, and capture the emotional essence of the entry.
Examples: "A Tuesday That Felt Like Magic", "The Quiet Weight of Hope", "When the Rain Said Everything"

Entry:
"${text.slice(0, 500)}"

Respond with ONLY the title, nothing else:`,

  mood: (text: string) =>
    `Analyze the emotional mood of this diary entry and respond with exactly ONE word from this list:
happy, sad, calm, angry, dreamy, romantic, neutral

Entry:
"${text.slice(0, 500)}"

Mood (one word only):`,

  reflection: (text: string) =>
    `Based on this diary entry, generate 3 thoughtful reflection questions to help the author explore their feelings more deeply.
The questions should be introspective, gentle, and encouraging of self-discovery.
Format: Return exactly 3 questions, each on a new line, numbered 1. 2. 3.

Entry:
"${text.slice(0, 500)}"

Reflection questions:`,

  weeklySummary: (entries: string) =>
    `You are writing a warm, reflective weekly summary for someone's personal diary.
Based on these diary entries from the past week, write a beautiful 2-3 paragraph summary that:
- Captures the emotional journey of the week
- Highlights meaningful moments and growth
- Ends with an encouraging, forward-looking thought
- Uses a warm, personal second-person voice ("This week, you...")

Entries:
${entries}

Weekly reflection (2-3 paragraphs only):`,

  monthlySummary: (entries: string) =>
    `Write a meaningful monthly reflection based on these diary entries.
Summarize the month's emotional arc, key themes, personal growth, and memorable moments.
Write in a warm, insightful second-person voice. 3-4 paragraphs.

Entries:
${entries}

Monthly reflection:`,
}
