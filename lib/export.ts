/**
 * lib/export.ts — Export diary entries as formatted Markdown
 *
 * Generates beautiful, structured Markdown documents from diary entries.
 * Supports single entry, date range, and full diary export with
 * mood badges, word counts, and optional AI summaries.
 */

import type { Entry, Mood } from "@/types"
import { MOOD_CONFIG } from "@/types"
import { format, parseISO } from "date-fns"

// ─── Mood Emoji Mapping ──────────────────────────────────────────────────────
function moodBadge(mood: Mood): string {
  const config = MOOD_CONFIG[mood]
  return config ? `${config.emoji} ${config.label}` : mood
}

// ─── Single Entry Formatting ─────────────────────────────────────────────────
function formatEntry(entry: Entry, includeMetadata = true): string {
  const lines: string[] = []

  // Title
  lines.push(`## ${entry.title || "Untitled Entry"}`)
  lines.push("")

  // Metadata line
  if (includeMetadata) {
    const date = format(parseISO(entry.createdAt), "EEEE, MMMM d, yyyy 'at' h:mm a")
    const meta: string[] = [
      `📅 ${date}`,
      `${moodBadge(entry.mood)}`,
    ]
    if (entry.wordCount && entry.wordCount > 0) {
      meta.push(`📝 ${entry.wordCount} words`)
    }
    if (entry.favorite) {
      meta.push("⭐ Favorite")
    }
    if (entry.weather) {
      meta.push(`🌤️ ${entry.weather}`)
    }
    lines.push(`> ${meta.join(" · ")}`)
    lines.push("")
  }

  // Tags
  if (entry.tags.length > 0) {
    lines.push(entry.tags.map((t) => `\`#${t}\``).join(" "))
    lines.push("")
  }

  // Gratitude
  if (entry.gratitude) {
    lines.push(`> 🙏 **Gratitude:** ${entry.gratitude}`)
    lines.push("")
  }

  // Body text
  const bodyText = entry.enhancedText || entry.rawText
  if (bodyText) {
    lines.push(bodyText)
    lines.push("")
  }

  lines.push("---")
  lines.push("")

  return lines.join("\n")
}

// ─── Statistics Summary ──────────────────────────────────────────────────────
function generateStats(entries: Entry[]): string {
  if (entries.length === 0) return ""

  const totalWords = entries.reduce((sum, e) => sum + (e.wordCount ?? 0), 0)
  const avgWords = Math.round(totalWords / entries.length)
  const favoriteCount = entries.filter((e) => e.favorite).length

  // Mood distribution
  const moodCounts: Partial<Record<Mood, number>> = {}
  for (const entry of entries) {
    moodCounts[entry.mood] = (moodCounts[entry.mood] ?? 0) + 1
  }

  const sortedMoods = Object.entries(moodCounts)
    .sort(([, a], [, b]) => b - a)
    .map(([mood, count]) => `${moodBadge(mood as Mood)}: ${count}`)

  // Tag frequency
  const tagCounts: Record<string, number> = {}
  for (const entry of entries) {
    for (const tag of entry.tags) {
      tagCounts[tag] = (tagCounts[tag] ?? 0) + 1
    }
  }
  const topTags = Object.entries(tagCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([tag, count]) => `\`#${tag}\` (${count})`)

  const lines: string[] = [
    "## 📊 Journal Statistics",
    "",
    `| Metric | Value |`,
    `|--------|-------|`,
    `| Total Entries | ${entries.length} |`,
    `| Total Words | ${totalWords.toLocaleString()} |`,
    `| Avg. Words/Entry | ${avgWords} |`,
    `| Favorites | ${favoriteCount} |`,
    "",
    "### Mood Distribution",
    "",
    ...sortedMoods.map((m) => `- ${m}`),
    "",
  ]

  if (topTags.length > 0) {
    lines.push("### Top Tags", "", ...topTags.map((t) => `- ${t}`), "")
  }

  lines.push("---", "")
  return lines.join("\n")
}

// ─── Export Functions ─────────────────────────────────────────────────────────

export interface ExportOptions {
  /** Include statistics summary at the top */
  includeStats?: boolean
  /** Include entry metadata (date, mood, word count) */
  includeMetadata?: boolean
  /** Custom title for the export */
  title?: string
  /** Optional AI-generated summary to include */
  aiSummary?: string
}

/**
 * Export a single diary entry as formatted Markdown.
 */
export function exportSingleEntry(entry: Entry): string {
  const header = [
    `# ${entry.title || "Diary Entry"}`,
    "",
    `*Exported from FairyDiary*`,
    "",
    "---",
    "",
  ].join("\n")

  return header + formatEntry(entry, true)
}

/**
 * Export multiple diary entries as a formatted Markdown document.
 */
export function exportEntries(
  entries: Entry[],
  options: ExportOptions = {},
): string {
  const {
    includeStats = true,
    includeMetadata = true,
    title = "My FairyDiary Journal",
    aiSummary,
  } = options

  // Sort entries by date (newest first)
  const sorted = [...entries].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )

  const sections: string[] = []

  // Header
  const dateRange = sorted.length > 0
    ? (() => {
        const oldest = format(parseISO(sorted[sorted.length - 1].createdAt), "MMM d, yyyy")
        const newest = format(parseISO(sorted[0].createdAt), "MMM d, yyyy")
        return oldest === newest ? oldest : `${oldest} — ${newest}`
      })()
    : ""

  sections.push(
    `# ${title}`,
    "",
    `*${dateRange}*  `,
    `*${sorted.length} ${sorted.length === 1 ? "entry" : "entries"} · Exported from FairyDiary*`,
    "",
    "---",
    "",
  )

  // AI Summary
  if (aiSummary) {
    sections.push(
      "## ✨ AI Summary",
      "",
      aiSummary,
      "",
      "---",
      "",
    )
  }

  // Statistics
  if (includeStats && sorted.length > 1) {
    sections.push(generateStats(sorted))
  }

  // Entries
  sections.push("## 📖 Entries", "")
  for (const entry of sorted) {
    sections.push(formatEntry(entry, includeMetadata))
  }

  // Footer
  sections.push(
    "---",
    "",
    `*Generated on ${format(new Date(), "MMMM d, yyyy 'at' h:mm a")} by FairyDiary*`,
    "",
  )

  return sections.join("\n")
}

/**
 * Trigger a Markdown file download in the browser.
 */
export function downloadMarkdown(content: string, filename: string): void {
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename.endsWith(".md") ? filename : `${filename}.md`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Generate a safe filename for diary exports.
 */
export function generateExportFilename(
  prefix = "fairydiary",
  dateStr?: string,
): string {
  const date = dateStr ?? format(new Date(), "yyyy-MM-dd")
  return `${prefix}-export-${date}.md`
}
