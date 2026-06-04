import { useMemo } from "react"
import { useAppStore } from "@/store/app-store"
import type { Entry, Mood } from "@/types"
import { groupEntriesByDate, groupEntriesByMonth } from "@/lib/utils"

export function useEntries() {
  const { entries, addEntry, updateEntry, deleteEntry, toggleFavorite } = useAppStore()

  const sorted = useMemo(
    () => [...entries].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [entries]
  )

  const favorites = useMemo(() => sorted.filter((e) => e.favorite), [sorted])

  const byDate = useMemo(() => groupEntriesByDate(sorted), [sorted])

  const byMonth = useMemo(() => groupEntriesByMonth(sorted), [sorted])

  const todayEntries = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    return sorted.filter((e) => e.createdAt.slice(0, 10) === today)
  }, [sorted])

  const recentEntries = useMemo(() => sorted.slice(0, 10), [sorted])

  const searchEntries = (query: string, mood?: Mood | null, tag?: string | null): Entry[] => {
    return sorted.filter((e) => {
      const matchesQuery =
        !query ||
        e.title.toLowerCase().includes(query.toLowerCase()) ||
        e.rawText.toLowerCase().includes(query.toLowerCase()) ||
        (e.enhancedText?.toLowerCase().includes(query.toLowerCase()) ?? false)
      const matchesMood = !mood || e.mood === mood
      const matchesTag = !tag || e.tags.includes(tag)
      return matchesQuery && matchesMood && matchesTag
    })
  }

  const getAllTags = (): string[] => {
    const tagSet = new Set<string>()
    entries.forEach((e) => e.tags.forEach((t) => tagSet.add(t)))
    return Array.from(tagSet).sort()
  }

  const getThisDayLastYear = (): Entry | null => {
    const today = new Date()
    const lastYear = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate())
    const dateStr = lastYear.toISOString().slice(0, 10)
    return entries.find((e) => e.createdAt.slice(0, 10) === dateStr) || null
  }

  const getEntryById = (id: string): Entry | undefined => {
    return entries.find((e) => e.id === id)
  }

  return {
    entries: sorted,
    favorites,
    byDate,
    byMonth,
    todayEntries,
    recentEntries,
    totalCount: entries.length,
    addEntry,
    updateEntry,
    deleteEntry,
    toggleFavorite,
    searchEntries,
    getAllTags,
    getThisDayLastYear,
    getEntryById,
  }
}
