"use client"

import { useMemo } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell,
} from "recharts"
import { CalendarDays, TrendingUp } from "lucide-react"
import { useEntries } from "@/hooks/useEntries"
import { useStreak } from "@/hooks/useStreak"
import { getMoodFrequency, getMoodColor } from "@/lib/utils"
import { MOOD_CONFIG } from "@/types"
import { WeeklySummary } from "@/features/insights/WeeklySummary"
import { AIAnalytics } from "@/features/insights/AIAnalytics"
import { EmptyState } from "@/components/ui/EmptyState"
import type { Mood } from "@/types"

interface TooltipProps {
  active?:  boolean
  payload?: Array<{ value: number; name: string }>
  label?:   string
}

function ChartTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div className="glass rounded-xl px-3 py-2 text-xs text-fairy-text border border-fairy-border/50">
      <p className="font-medium mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-fairy-text-muted">{p.name}: <span className="text-fairy-text">{p.value}</span></p>
      ))}
    </div>
  )
}

export function InsightsContent() {
  const { entries, totalCount } = useEntries()
  const { currentStreak, longestStreak } = useStreak()

  const moodData = useMemo(() => {
    const freq = getMoodFrequency(entries)
    return Object.entries(freq)
      .filter(([, count]) => count > 0)
      .map(([mood, count]) => ({
        mood, count,
        label: MOOD_CONFIG[mood as Mood].label,
        emoji: MOOD_CONFIG[mood as Mood].emoji,
        color: getMoodColor(mood as Mood),
      }))
      .sort((a, b) => b.count - a.count)
  }, [entries])

  const monthlyData = useMemo(() => {
    const counts: Record<string, number> = {}
    entries.forEach(e => {
      const month = e.createdAt.slice(0, 7)
      counts[month] = (counts[month] || 0) + 1
    })
    return Object.entries(counts)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([month, count]) => ({
        month: new Date(month + "-01").toLocaleDateString("en-US", { month: "short" }),
        entries: count,
      }))
  }, [entries])

  const moodTrend = useMemo(() => {
    const moodScores: Record<Mood, number> = {
      happy: 5, romantic: 4.5, dreamy: 4, calm: 3.5, neutral: 3, sad: 2, angry: 1,
    }
    return Array.from({ length: 14 }, (_, i) => {
      const d = new Date(Date.now() - (13 - i) * 86400000)
      const dateStr = d.toISOString().slice(0, 10)
      const dayEntries = entries.filter(e => e.createdAt.slice(0, 10) === dateStr)
      if (!dayEntries.length) return null
      const avg = dayEntries.reduce((s, e) => s + moodScores[e.mood], 0) / dayEntries.length
      return {
        date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        moodScore: parseFloat(avg.toFixed(1)),
      }
    }).filter(Boolean) as { date: string; moodScore: number }[]
  }, [entries])

  const topTags = useMemo(() => {
    const tc: Record<string, number> = {}
    entries.forEach(e => e.tags.forEach(t => { tc[t] = (tc[t] || 0) + 1 }))
    return Object.entries(tc).sort(([, a], [, b]) => b - a).slice(0, 8)
  }, [entries])

  const totalWords = useMemo(
    () => entries.reduce((s, e) => s + (e.wordCount || 0), 0),
    [entries],
  )

  if (entries.length === 0) {
    return (
      <div className="min-h-screen px-4 pt-12 pb-4 max-w-lg mx-auto">
        <h1 className="font-display text-2xl font-bold gradient-text mb-8">Insights</h1>
        <EmptyState
          emoji="📊"
          title="No data yet"
          description="Write at least a few entries to unlock beautiful insights about your emotional patterns."
          action={{ label: "Write Your First Entry ✨", href: "/write" }}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen px-4 pt-12 pb-4 max-w-lg mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="font-display text-2xl font-bold gradient-text mb-1">Insights</h1>
        <p className="text-fairy-text-muted text-sm">Your emotional journey in numbers</p>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="grid grid-cols-2 gap-3 mb-6"
      >
        {[
          { label: "Total Entries",  value: totalCount,      emoji: "📖" },
          { label: "Total Words",    value: totalWords.toLocaleString(), emoji: "✍️" },
          { label: "Current Streak", value: `${currentStreak}d`, emoji: "🔥" },
          { label: "Best Streak",    value: `${longestStreak}d`, emoji: "⭐" },
        ].map(({ label, value, emoji }) => (
          <div key={label} className="glass rounded-2xl p-4 border border-fairy-border/50 text-center">
            <p className="text-2xl mb-1" aria-hidden="true">{emoji}</p>
            <p className="text-xl font-bold font-display text-fairy-text">{value}</p>
            <p className="text-xs text-fairy-text-muted mt-0.5">{label}</p>
          </div>
        ))}
      </motion.div>

      {/* Mood distribution */}
      {moodData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="glass rounded-2xl p-4 border border-fairy-border/50 mb-4"
        >
          <h2 className="text-sm font-medium text-fairy-text mb-4">Mood Distribution</h2>
          <div aria-label="Mood distribution chart" role="img">
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={moodData}
                  cx="50%"
                  cy="50%"
                  outerRadius={70}
                  dataKey="count"
                  label={({ emoji, percent }) => `${emoji} ${Math.round((percent ?? 0) * 100)}%`}
                  labelLine={false}
                >
                  {moodData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} fillOpacity={0.85} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-3">
            {moodData.map(d => (
              <div key={d.mood} className="flex items-center gap-2 text-xs text-fairy-text-muted">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: d.color }} aria-hidden="true" />
                {d.emoji} {d.label}
                <span className="ml-auto text-fairy-text">{d.count}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Monthly activity */}
      {monthlyData.length > 1 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="glass rounded-2xl p-4 border border-fairy-border/50 mb-4"
        >
          <h2 className="text-sm font-medium text-fairy-text mb-4">Monthly Activity</h2>
          <div aria-label="Monthly entry count chart" role="img">
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={monthlyData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "rgb(var(--fairy-text-muted-rgb))" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "rgb(var(--fairy-text-muted-rgb))" }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="entries" name="Entries" fill="rgb(var(--fairy-purple-rgb))" radius={[4, 4, 0, 0]} fillOpacity={0.8} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      )}

      {/* Mood trend */}
      {moodTrend.length > 1 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="glass rounded-2xl p-4 border border-fairy-border/50 mb-4"
        >
          <h2 className="text-sm font-medium text-fairy-text mb-1 flex items-center gap-2">
            <TrendingUp size={14} aria-hidden="true" />
            14-Day Mood Trend
          </h2>
          <p className="text-xs text-fairy-text-muted mb-4">5 = most positive, 1 = most intense</p>
          <div aria-label="14-day mood trend chart" role="img">
            <ResponsiveContainer width="100%" height={140}>
              <LineChart data={moodTrend} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "rgb(var(--fairy-text-muted-rgb))" }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                <YAxis domain={[1, 5]} tick={{ fontSize: 10, fill: "rgb(var(--fairy-text-muted-rgb))" }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Line
                  type="monotone" dataKey="moodScore" name="Mood" stroke="rgb(var(--fairy-rose-rgb))"
                  strokeWidth={2} dot={{ r: 3, fill: "rgb(var(--fairy-rose-rgb))" }} activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      )}

      {/* Top tags */}
      {topTags.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="glass rounded-2xl p-4 border border-fairy-border/50 mb-4"
        >
          <h2 className="text-sm font-medium text-fairy-text mb-3">Top Tags</h2>
          <div className="flex flex-wrap gap-2" role="list" aria-label="Most used tags">
            {topTags.map(([tag, count]) => (
              <span
                key={tag}
                role="listitem"
                className="inline-flex items-center gap-1.5 text-xs text-fairy-purple bg-fairy-purple/12 px-2.5 py-1 rounded-full border border-fairy-purple/25"
              >
                #{tag}
                <span className="text-fairy-text-muted/60">({count})</span>
              </span>
            ))}
          </div>
        </motion.div>
      )}

      {/* Calendar link */}
      <Link href="/calendar">
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="glass rounded-2xl p-4 border border-fairy-border/50 flex items-center gap-3 hover:border-fairy-purple/40 transition-colors"
        >
          <CalendarDays size={20} className="text-fairy-purple" aria-hidden="true" />
          <div className="flex-1">
            <p className="text-sm font-medium text-fairy-text">Mood Calendar</p>
            <p className="text-xs text-fairy-text-muted">View your daily mood patterns</p>
          </div>
          <span className="text-fairy-text-muted/50 text-sm" aria-hidden="true">→</span>
        </motion.div>
      </Link>

      {/* AI Writing Coach Analytics */}
      <div className="mt-4">
        <AIAnalytics />
      </div>

      {/* Weekly AI summary */}
      <div className="mt-4">
        <WeeklySummary />
      </div>
    </div>
  )
}
