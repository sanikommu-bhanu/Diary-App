import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, formatDistanceToNow, isToday, isYesterday, parseISO } from "date-fns"
import type { Entry, Mood, StreakInfo } from "@/types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatEntryDate(dateString: string): string {
  const date = parseISO(dateString)
  if (isToday(date)) return "Today"
  if (isYesterday(date)) return "Yesterday"
  return format(date, "MMMM d, yyyy")
}

export function formatRelativeTime(dateString: string): string {
  return formatDistanceToNow(parseISO(dateString), { addSuffix: true })
}

export function formatShortDate(dateString: string): string {
  return format(parseISO(dateString), "MMM d")
}

export function formatMonthYear(dateString: string): string {
  return format(parseISO(dateString), "MMMM yyyy")
}

export function getGreeting(name?: string): { greeting: string; subtext: string } {
  const hour = new Date().getHours()
  const displayName = name ? `, ${name}` : ""

  if (hour >= 5 && hour < 12) {
    return {
      greeting: `Good morning${displayName} ✨`,
      subtext: "A fresh page awaits your story.",
    }
  } else if (hour >= 12 && hour < 17) {
    return {
      greeting: `Good afternoon${displayName} 🌸`,
      subtext: "How is your day unfolding?",
    }
  } else if (hour >= 17 && hour < 21) {
    return {
      greeting: `Good evening${displayName} 🌙`,
      subtext: "Time to reflect on today's magic.",
    }
  } else {
    return {
      greeting: `Hello${displayName} 🌟`,
      subtext: "Late nights hold the deepest thoughts.",
    }
  }
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength).trim() + "…"
}

export function calculateStreak(entries: Entry[]): StreakInfo {
  if (entries.length === 0) {
    return { current: 0, longest: 0, isActive: false, lastEntry: null }
  }

const dates = Array.from(
  new Set(entries.map((e) => e.createdAt.slice(0, 10)))
);
  const today = new Date().toISOString().slice(0, 10)
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)

  let current = 0
  let longest = 0
  let streak = 0

  const isActive = dates[0] === today || dates[0] === yesterday

  if (isActive) {
    let checkDate = dates[0] === today ? new Date() : new Date(Date.now() - 86400000)
    for (const date of dates) {
      const expected = checkDate.toISOString().slice(0, 10)
      if (date === expected) {
        streak++
        checkDate = new Date(checkDate.getTime() - 86400000)
      } else break
    }
    current = streak
  }

  // Calculate longest streak
  let tempStreak = 1
  for (let i = 1; i < dates.length; i++) {
    const d1 = new Date(dates[i - 1])
    const d2 = new Date(dates[i])
    const diff = Math.round((d1.getTime() - d2.getTime()) / 86400000)
    if (diff === 1) {
      tempStreak++
      longest = Math.max(longest, tempStreak)
    } else {
      tempStreak = 1
    }
  }
  longest = Math.max(longest, current, 1)

  return { current, longest, isActive, lastEntry: dates[0] || null }
}

export function getMoodColor(mood: Mood): string {
  const colors: Record<Mood, string> = {
    happy: "#fbbf24",
    sad: "#60a5fa",
    calm: "#34d399",
    angry: "#f87171",
    dreamy: "#a78bfa",
    romantic: "#f472b6",
    neutral: "#9ca3af",
  }
  return colors[mood]
}

export function groupEntriesByMonth(entries: Entry[]): Record<string, Entry[]> {
  return entries.reduce<Record<string, Entry[]>>((groups, entry) => {
    const month = entry.createdAt.slice(0, 7) // YYYY-MM
    if (!groups[month]) groups[month] = []
    groups[month].push(entry)
    return groups
  }, {})
}

export function groupEntriesByDate(entries: Entry[]): Record<string, Entry[]> {
  return entries.reduce<Record<string, Entry[]>>((groups, entry) => {
    const date = entry.createdAt.slice(0, 10)
    if (!groups[date]) groups[date] = []
    groups[date].push(entry)
    return groups
  }, {})
}

export function getMoodFrequency(entries: Entry[]): Record<Mood, number> {
  const freq: Record<Mood, number> = {
    happy: 0, sad: 0, calm: 0, angry: 0, dreamy: 0, romantic: 0, neutral: 0,
  }
  entries.forEach((e) => { freq[e.mood]++ })
  return freq
}

export function exportToJSON(entries: Entry[]): void {
  const data = JSON.stringify({ entries, exportedAt: new Date().toISOString() }, null, 2)
  const blob = new Blob([data], { type: "application/json" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `fairydiary-backup-${new Date().toISOString().slice(0, 10)}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function getMoodGradient(mood?: Mood): string {
  if (!mood) return "from-fairy-purple/10 to-fairy-rose/10"
  const gradients: Record<Mood, string> = {
    happy: "from-amber-400/20 to-yellow-300/10",
    sad: "from-blue-400/20 to-sky-300/10",
    calm: "from-emerald-400/20 to-teal-300/10",
    angry: "from-red-400/20 to-rose-300/10",
    dreamy: "from-violet-400/20 to-purple-300/10",
    romantic: "from-pink-400/20 to-rose-300/10",
    neutral: "from-gray-400/10 to-slate-300/5",
  }
  return gradients[mood]
}
