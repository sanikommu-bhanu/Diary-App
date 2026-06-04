"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { PenLine, Lock, Flame, Star, BookOpen, ChevronRight } from "lucide-react"
import { useAppStore } from "@/store/app-store"
import { useEntries } from "@/hooks/useEntries"
import { useStreak } from "@/hooks/useStreak"
import { EntryCard } from "@/features/entries/EntryCard"
import { EntryModal } from "@/features/entries/EntryModal"
import { MoodSelector } from "@/features/entries/MoodSelector"
import { GlassCard } from "@/components/ui/GlassCard"
import { MagicButton } from "@/components/ui/MagicButton"
import { getDailyQuote } from "@/lib/quotes"
import { EmptyState } from "@/components/ui/EmptyState"
import { getGreeting, cn } from "@/lib/utils"
import type { Entry, Mood } from "@/types"

export default function HomePage() {
  const router = useRouter()
  const { settings, lock, setCurrentMood } = useAppStore()
  const { recentEntries, todayEntries, getThisDayLastYear, totalCount } = useEntries()
  const { currentStreak, longestStreak, hasWrittenToday, streakMessage } = useStreak()
  const [selectedEntry, setSelectedEntry] = useState<Entry | null>(null)
  const [checkedMood, setCheckedMood] = useState<Mood | null>(null)

  const { greeting, subtext } = getGreeting(settings.displayName)
  const quote = getDailyQuote()
  const memoryEntry = getThisDayLastYear()

  const handleMoodCheck = (mood: Mood) => {
    setCheckedMood(mood)
    setCurrentMood(mood)
  }

  return (
    <div className="min-h-screen px-4 pt-12 pb-4 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-display text-2xl font-bold text-fairy-text text-glow"
          >
            {greeting}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="text-fairy-text-muted text-sm mt-1"
          >
            {subtext}
          </motion.p>
        </div>
        <button
          onClick={() => {
            lock()
            router.replace("/lock")
          }}
          className="p-2 glass rounded-xl text-fairy-text-muted hover:text-fairy-rose transition-colors mt-1"
        >
          <Lock size={18} />
        </button>
      </div>

      {/* Hero / Quick Write */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-6"
      >
        <Link href="/write">
          <div className="relative rounded-3xl overflow-hidden cursor-pointer group">
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-fairy-purple/30 via-fairy-rose/20 to-transparent" />
            <div className="absolute inset-0 glass" />
            <div className="absolute inset-0 bg-fairy-glow opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <div className="relative p-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-3xl">
                  {hasWrittenToday ? "📖" : "📝"}
                </span>
                <div className="flex items-center gap-2 glass rounded-full px-3 py-1.5">
                  <PenLine size={14} className="text-fairy-purple" />
                  <span className="text-xs text-fairy-text-muted">New Entry</span>
                </div>
              </div>
              <h2 className="font-display text-xl font-bold text-fairy-text mb-1">
                {hasWrittenToday ? "Continue writing…" : "What happened today?"}
              </h2>
              <p className="text-fairy-text-muted text-sm">
                {hasWrittenToday
                  ? `${todayEntries.length} ${todayEntries.length === 1 ? "entry" : "entries"} written today ✨`
                  : "Your story is waiting to be told…"}
              </p>
            </div>
          </div>
        </Link>
      </motion.div>

      {/* Stats row */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-3 gap-3 mb-6"
      >
        <StatCard
          icon={<Flame size={18} className="text-orange-400" />}
          value={currentStreak}
          label="Day Streak"
          color="orange"
        />
        <StatCard
          icon={<BookOpen size={18} className="text-fairy-purple" />}
          value={totalCount}
          label="Entries"
          color="purple"
        />
        <StatCard
          icon={<Star size={18} className="text-yellow-400" />}
          value={longestStreak}
          label="Best Streak"
          color="yellow"
        />
      </motion.div>

      {/* Streak message */}
      {currentStreak > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.25 }}
          className="glass rounded-2xl px-4 py-3 mb-6 border border-orange-400/20 flex items-center gap-3"
        >
          <span className="text-2xl">🔥</span>
          <p className="text-sm text-fairy-text">{streakMessage}</p>
        </motion.div>
      )}

      {/* Mood check-in */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass rounded-2xl p-4 mb-6 border border-fairy-border/50"
      >
        <p className="text-sm font-medium text-fairy-text mb-3">
          {checkedMood ? `Feeling ${checkedMood} today 💫` : "How are you feeling right now?"}
        </p>
        <MoodSelector value={checkedMood || undefined} onChange={handleMoodCheck} compact />
      </motion.div>

      {/* This day last year */}
      <AnimatePresence>
        {memoryEntry && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="mb-6"
          >
            <p className="text-xs text-fairy-text-muted/70 mb-2 flex items-center gap-1.5">
              <span>🕰️</span> This day last year
            </p>
            <EntryCard
              entry={memoryEntry}
              onClick={() => setSelectedEntry(memoryEntry)}
              compact
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quote of the day */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="glass rounded-2xl p-5 mb-6 border border-fairy-purple/20 bg-gradient-to-br from-fairy-purple/10 to-transparent"
      >
        <p className="text-xs text-fairy-purple/70 mb-2 font-medium uppercase tracking-wide">Today's Thought</p>
        <p className="font-display text-base italic text-fairy-text/90 leading-relaxed mb-2">
          "{quote.text}"
        </p>
        <p className="text-xs text-fairy-text-muted/60">— {quote.author}</p>
      </motion.div>

      {/* Recent entries */}
      {recentEntries.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-fairy-text">Recent Entries</p>
            <Link href="/timeline" className="text-xs text-fairy-purple flex items-center gap-1 hover:text-fairy-rose transition-colors">
              View all <ChevronRight size={13} />
            </Link>
          </div>
          <div className="space-y-3">
            {recentEntries.slice(0, 4).map((entry, i) => (
              <EntryCard
                key={entry.id}
                entry={entry}
                onClick={() => setSelectedEntry(entry)}
                index={i}
              />
            ))}
          </div>
        </motion.div>
      )}

      {/* Empty state */}
      {recentEntries.length === 0 && (
        <EmptyState
          emoji="🌟"
          title="Your first entry awaits"
          description="Every great story begins with a single word. What will yours be?"
          action={{ label: "Begin Writing ✨", href: "/write" }}
        />
      )}

      {/* Entry modal */}
      <EntryModal entry={selectedEntry} onClose={() => setSelectedEntry(null)} />
    </div>
  )
}

function StatCard({
  icon,
  value,
  label,
  color,
}: {
  icon: React.ReactNode
  value: number
  label: string
  color: string
}) {
  return (
    <div className="glass rounded-2xl p-3 text-center border border-fairy-border/50">
      <div className="flex justify-center mb-1">{icon}</div>
      <p className={cn(
        "text-2xl font-bold font-display",
        color === "orange" && "text-orange-400",
        color === "purple" && "text-fairy-purple",
        color === "yellow" && "text-yellow-400"
      )}>
        {value}
      </p>
      <p className="text-[10px] text-fairy-text-muted mt-0.5">{label}</p>
    </div>
  )
}
