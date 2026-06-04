/**
 * lib/search.ts — Client-side fuzzy text search for diary entries
 *
 * Provides fast, lightweight fuzzy matching across entry titles,
 * body text, tags, and moods without external dependencies.
 */

import type { Entry } from "@/types"

export interface SearchResult {
  entry: Entry
  score: number
  matchedFields: string[]
  highlights: { field: string; snippet: string }[]
}

/**
 * Normalize text for search — lowercase, strip diacritics, collapse whitespace.
 */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
}

/**
 * Simple fuzzy match scoring.
 * Returns a score between 0 (no match) and 1 (exact match).
 * Supports:
 *  - Exact substring match (highest)
 *  - Word-start matches
 *  - Character-sequence fuzzy matching
 */
function fuzzyScore(query: string, target: string): number {
  if (!query || !target) return 0

  const q = normalize(query)
  const t = normalize(target)

  if (t === q) return 1.0
  if (t.includes(q)) return 0.9
  if (t.startsWith(q)) return 0.95

  // Word-start matching: "hap cal" matches "happy and calm"
  const queryWords = q.split(" ").filter(Boolean)
  const matchedWords = queryWords.filter((qw) =>
    t.split(" ").some((tw) => tw.startsWith(qw)),
  )
  if (matchedWords.length === queryWords.length) {
    return 0.7 + 0.1 * (matchedWords.length / queryWords.length)
  }

  // Character-sequence fuzzy matching
  let qi = 0
  let consecutive = 0
  let maxConsecutive = 0

  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) {
      qi++
      consecutive++
      maxConsecutive = Math.max(maxConsecutive, consecutive)
    } else {
      consecutive = 0
    }
  }

  if (qi < q.length) return 0 // Not all query chars found

  const coverage = q.length / t.length
  const consecutiveBonus = maxConsecutive / q.length
  return Math.min(0.6, 0.3 * coverage + 0.3 * consecutiveBonus)
}

/**
 * Extract a highlighted snippet around the best match position.
 */
function extractSnippet(
  text: string,
  query: string,
  contextChars = 60,
): string {
  const lowerText = normalize(text)
  const lowerQuery = normalize(query)

  const idx = lowerText.indexOf(lowerQuery)
  if (idx === -1) {
    // Fallback: return start of text
    return text.slice(0, contextChars * 2) + (text.length > contextChars * 2 ? "…" : "")
  }

  const start = Math.max(0, idx - contextChars)
  const end = Math.min(text.length, idx + lowerQuery.length + contextChars)

  let snippet = ""
  if (start > 0) snippet += "…"
  snippet += text.slice(start, end)
  if (end < text.length) snippet += "…"

  return snippet
}

/**
 * Search diary entries with fuzzy matching.
 *
 * @param entries  All diary entries to search
 * @param query    The search query string
 * @param limit    Maximum results to return (default 20)
 * @returns        Sorted search results with scores and highlights
 */
export function searchEntries(
  entries: Entry[],
  query: string,
  limit = 20,
): SearchResult[] {
  const trimmedQuery = query.trim()
  if (!trimmedQuery) return []

  const results: SearchResult[] = []

  for (const entry of entries) {
    const scores: { field: string; score: number }[] = []

    // Title match (highest weight)
    const titleScore = fuzzyScore(trimmedQuery, entry.title)
    if (titleScore > 0) scores.push({ field: "title", score: titleScore * 1.5 })

    // Body text match
    const bodyScore = fuzzyScore(trimmedQuery, entry.rawText)
    if (bodyScore > 0) scores.push({ field: "rawText", score: bodyScore * 1.0 })

    // Enhanced text match
    if (entry.enhancedText) {
      const enhancedScore = fuzzyScore(trimmedQuery, entry.enhancedText)
      if (enhancedScore > 0) scores.push({ field: "enhancedText", score: enhancedScore * 0.8 })
    }

    // Tag match (exact-ish)
    for (const tag of entry.tags) {
      const tagScore = fuzzyScore(trimmedQuery, tag)
      if (tagScore > 0) scores.push({ field: `tag:${tag}`, score: tagScore * 1.2 })
    }

    // Mood match
    const moodScore = fuzzyScore(trimmedQuery, entry.mood)
    if (moodScore > 0) scores.push({ field: "mood", score: moodScore * 0.6 })

    if (scores.length === 0) continue

    // Aggregate score: best match + small bonus for multi-field matches
    scores.sort((a, b) => b.score - a.score)
    const bestScore = scores[0].score
    const multiFieldBonus = Math.min(0.15, (scores.length - 1) * 0.05)
    const totalScore = Math.min(1.0, bestScore + multiFieldBonus)

    // Build highlights
    const highlights: { field: string; snippet: string }[] = []
    const matchedFields: string[] = []

    for (const s of scores.slice(0, 3)) {
      matchedFields.push(s.field)
      if (s.field === "title") {
        highlights.push({ field: "title", snippet: entry.title })
      } else if (s.field === "rawText") {
        highlights.push({
          field: "rawText",
          snippet: extractSnippet(entry.rawText, trimmedQuery),
        })
      } else if (s.field === "mood") {
        highlights.push({ field: "mood", snippet: entry.mood })
      } else if (s.field.startsWith("tag:")) {
        highlights.push({ field: "tag", snippet: s.field.replace("tag:", "") })
      }
    }

    results.push({ entry, score: totalScore, matchedFields, highlights })
  }

  // Sort by score descending, then by date descending for ties
  results.sort((a, b) => {
    if (Math.abs(a.score - b.score) > 0.01) return b.score - a.score
    return new Date(b.entry.createdAt).getTime() - new Date(a.entry.createdAt).getTime()
  })

  return results.slice(0, limit)
}

/**
 * Quick filter for exact or partial text match (non-fuzzy).
 * Useful for instant filtering while typing.
 */
export function quickFilter(entries: Entry[], query: string): Entry[] {
  const q = normalize(query)
  if (!q) return entries

  return entries.filter((entry) => {
    const searchable = normalize(
      `${entry.title} ${entry.rawText} ${entry.mood} ${entry.tags.join(" ")}`,
    )
    return searchable.includes(q)
  })
}
