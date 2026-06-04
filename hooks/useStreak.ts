import { useAppStore } from "@/store/app-store"
import { useEntries } from "./useEntries"
import { calculateStreak } from "@/lib/utils"
import { useMemo } from "react"

export function useStreak() {
  const { settings } = useAppStore()
  const { entries } = useEntries()

  const streakInfo = useMemo(() => calculateStreak(entries), [entries])

  const hasWrittenToday = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    return entries.some((e) => e.createdAt.slice(0, 10) === today)
  }, [entries])

  const streakMessage = useMemo(() => {
    if (streakInfo.current === 0) return "Start your streak today! ✨"
    if (streakInfo.current === 1) return "1 day streak! You started! 🌱"
    if (streakInfo.current < 7) return `${streakInfo.current} days in a row! Keep going! 🔥`
    if (streakInfo.current < 30) return `${streakInfo.current} days strong! Amazing! 💫`
    return `${streakInfo.current} days! You're unstoppable! 👑`
  }, [streakInfo.current])

  return {
    currentStreak: streakInfo.current,
    longestStreak: streakInfo.longest,
    isActive: streakInfo.isActive,
    lastEntry: streakInfo.lastEntry,
    hasWrittenToday,
    streakMessage,
  }
}
