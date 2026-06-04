/**
 * lib/diary-service.ts — Business logic layer
 *
 * Separates diary operations from both the store (UI state) and storage (I/O).
 * This layer is where data transformation, validation, and business rules live.
 */
import { generateId, calculateStreak } from "@/lib/utils"
import { loadEntries, saveEntries, loadSettings, saveSettings } from "@/lib/storage"
import { sanitizeString, LIMITS } from "@/lib/validation"
import type { Entry, Mood, Weather, AppSettings } from "@/types"

// ─── Entry operations ─────────────────────────────────────────────────────────

export interface CreateEntryInput {
  title?:        string
  rawText:       string
  enhancedText?: string
  mood:          Mood
  tags?:         string[]
  weather?:      Weather
  gratitude?:    string
  favorite?:     boolean
  mediaIds?:     string[]
  isDraft?:      boolean
}

export interface UpdateEntryInput extends Partial<CreateEntryInput> {
  id: string
}

export function createEntry(input: CreateEntryInput): Entry {
  const now = new Date().toISOString()
  const rawText = sanitizeString(input.rawText, LIMITS.ENTRY_TEXT_MAX)
  const title   = sanitizeString(
    input.title || `Entry — ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric" })}`,
    LIMITS.TITLE_MAX,
  )
  const tags = (input.tags ?? [])
    .map(t => sanitizeString(t, LIMITS.TAG_MAX_LEN))
    .filter(Boolean)
    .slice(0, LIMITS.TAGS_COUNT_MAX)

  const entry: Entry = {
    id:           generateId(),
    title,
    rawText,
    enhancedText: input.enhancedText,
    mood:         input.mood,
    tags,
    favorite:     input.favorite ?? false,
    mediaIds:     input.mediaIds ?? [],
    isDraft:      input.isDraft  ?? false,
    createdAt:    now,
    updatedAt:    now,
    wordCount:    rawText.trim().split(/\s+/).filter(Boolean).length,
  }

  return entry
}

export function updateEntry(entries: Entry[], input: UpdateEntryInput): Entry[] {
  return entries.map(e => {
    if (e.id !== input.id) return e
    const rawText = input.rawText !== undefined
      ? sanitizeString(input.rawText, LIMITS.ENTRY_TEXT_MAX)
      : e.rawText
    const tags = input.tags
      ? input.tags.map(t => sanitizeString(t, LIMITS.TAG_MAX_LEN)).filter(Boolean).slice(0, LIMITS.TAGS_COUNT_MAX)
      : e.tags
    const updated: Entry = {
      ...e,
      title: input.title !== undefined ? sanitizeString(input.title, LIMITS.TITLE_MAX) : e.title,
      rawText,
      enhancedText: input.enhancedText !== undefined ? input.enhancedText : e.enhancedText,
      mood: input.mood ?? e.mood,
      tags,
      weather: input.weather !== undefined ? input.weather : e.weather,
      gratitude: input.gratitude !== undefined ? input.gratitude : e.gratitude,
      favorite: input.favorite ?? e.favorite,
      mediaIds: input.mediaIds ?? e.mediaIds,
      isDraft: input.isDraft !== undefined ? input.isDraft : e.isDraft,
      updatedAt: new Date().toISOString(),
      wordCount: rawText.trim().split(/\s+/).filter(Boolean).length,
    }
    return updated
  })
}

export function deleteEntry(entries: Entry[], id: string): Entry[] {
  return entries.filter(e => e.id !== id)
}

export function toggleFavorite(entries: Entry[], id: string): Entry[] {
  return entries.map(e =>
    e.id === id
      ? { ...e, favorite: !e.favorite, updatedAt: new Date().toISOString() }
      : e,
  )
}

// ─── Streak & settings ────────────────────────────────────────────────────────

export function updateStreakAfterWrite(
  settings: AppSettings,
  entries: Entry[],
): AppSettings {
  const info = calculateStreak(entries)
  return {
    ...settings,
    streakDays:    info.current,
    longestStreak: info.longest,
    lastEntryDate: new Date().toISOString().slice(0, 10),
  }
}

// ─── Persistence helpers (wrap storage with service logic) ────────────────────

export function persistEntry(
  entry: Entry,
  existingEntries: Entry[],
): { entries: Entry[]; settings: AppSettings } {
  const entries  = [entry, ...existingEntries.filter(e => e.id !== entry.id)]
  const settings = updateStreakAfterWrite(loadSettings(), entries)
  saveEntries(entries)
  saveSettings(settings)
  return { entries, settings }
}

export function loadAllData(): { entries: Entry[]; settings: AppSettings } {
  return { entries: loadEntries(), settings: loadSettings() }
}

// ─── Search & filter ──────────────────────────────────────────────────────────

export interface SearchFilters {
  query?:    string
  mood?:     Mood | null
  tag?:      string | null
  favOnly?:  boolean
}

export function searchEntries(entries: Entry[], filters: SearchFilters): Entry[] {
  const { query = "", mood = null, tag = null, favOnly = false } = filters
  const q = query.toLowerCase().trim()
  return entries.filter(e => {
    if (favOnly && !e.favorite) return false
    if (mood && e.mood !== mood) return false
    if (tag && !e.tags.includes(tag)) return false
    if (q && !(
      e.title.toLowerCase().includes(q) ||
      e.rawText.toLowerCase().includes(q) ||
      (e.enhancedText?.toLowerCase().includes(q) ?? false)
    )) return false
    return true
  })
}

export function getAllTags(entries: Entry[]): string[] {
  const set = new Set<string>()
  entries.forEach(e => e.tags.forEach(t => set.add(t)))
  return Array.from(set).sort()
}

export function getThisDayLastYear(entries: Entry[]): Entry | null {
  const today    = new Date()
  const lastYear = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate())
  const dateStr  = lastYear.toISOString().slice(0, 10)
  return entries.find(e => e.createdAt.slice(0, 10) === dateStr) ?? null
}
