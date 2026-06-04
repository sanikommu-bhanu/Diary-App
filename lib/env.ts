/**
 * lib/env.ts — Environment variable validation
 * Fails fast at startup if required variables are missing.
 */

interface Env {
  OPENROUTER_API_KEY: string | undefined
  OPENROUTER_MODEL: string
  NEXT_PUBLIC_APP_URL: string
  NODE_ENV: "development" | "production" | "test"
}

function getEnv(): Env {
  return {
    OPENROUTER_API_KEY:  process.env.OPENROUTER_API_KEY,
    OPENROUTER_MODEL:    process.env.OPENROUTER_MODEL    || "meta-llama/llama-3.1-8b-instruct:free",
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    NODE_ENV:            (process.env.NODE_ENV as Env["NODE_ENV"]) || "development",
  }
}

export const env = getEnv()

/** Returns true if the OpenRouter API key is configured. */
export function hasOpenRouterKey(): boolean {
  return !!env.OPENROUTER_API_KEY
}

/** Validate environment at module load (server-side only). */
export function validateEnv(): void {
  if (typeof window !== "undefined") return // client side only — skip

  const warnings: string[] = []

  if (!env.OPENROUTER_API_KEY) {
    warnings.push("OPENROUTER_API_KEY is not set — AI features will be disabled.")
  }

  if (env.NODE_ENV === "production" && !env.NEXT_PUBLIC_APP_URL.startsWith("https://")) {
    warnings.push("NEXT_PUBLIC_APP_URL should use HTTPS in production.")
  }

  for (const w of warnings) {
    console.warn("[FairyDiary env]", w)
  }
}
