"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useEntries } from "@/hooks/useEntries"
import { EntryCard } from "@/features/entries/EntryCard"
import { EntryModal } from "@/features/entries/EntryModal"
import { MOOD_CONFIG } from "@/types"
import { cn } from "@/lib/utils"
import type { Entry, Mood } from "@/types"

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]

export default function CalendarPage() {
  const { byDate } = useEntries()
  const today = new Date()
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1))
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedEntry, setSelectedEntry] = useState<Entry | null>(null)

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const prevMonthDays = new Date(year, month, 0).getDate()

  const goToPrev = () => setViewDate(new Date(year, month - 1, 1))
  const goToNext = () => setViewDate(new Date(year, month + 1, 1))

  const getDateEntries = (day: number): Entry[] => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    return byDate[dateStr] || []
  }

  const getDotColor = (entries: Entry[]): string => {
    if (!entries.length) return ""
    const lastMood = entries[entries.length - 1].mood as Mood
    return MOOD_CONFIG[lastMood]?.color || "#c084fc"
  }

  const selectedEntries = selectedDate ? (byDate[selectedDate] || []) : []

  return (
    <div className="min-h-screen px-4 pt-12 pb-4 max-w-lg mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="font-display text-2xl font-bold gradient-text mb-1">Calendar</h1>
        <p className="text-fairy-text-muted text-sm">Your journaling journey</p>
      </motion.div>

      {/* Calendar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-4 mb-5 border border-fairy-border/50"
      >
        {/* Month navigation */}
        <div className="flex items-center justify-between mb-5">
          <button
            onClick={goToPrev}
            className="p-2 glass rounded-xl hover:bg-fairy-purple/10 text-fairy-text-muted hover:text-fairy-purple transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <h2 className="font-display text-lg font-semibold text-fairy-text">
            {MONTHS[month]} {year}
          </h2>
          <button
            onClick={goToNext}
            className="p-2 glass rounded-xl hover:bg-fairy-purple/10 text-fairy-text-muted hover:text-fairy-purple transition-colors"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Days header */}
        <div className="grid grid-cols-7 mb-2">
          {DAYS_OF_WEEK.map((d) => (
            <div key={d} className="text-center text-[10px] text-fairy-text-muted/50 font-medium uppercase pb-1">
              {d}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-y-1">
          {/* Prev month filler */}
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`prev-${i}`} className="aspect-square flex items-center justify-center">
              <span className="text-xs text-fairy-text-muted/20">
                {prevMonthDays - firstDay + i + 1}
              </span>
            </div>
          ))}

          {/* Current month days */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1
            const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
            const dayEntries = getDateEntries(day)
            const hasEntries = dayEntries.length > 0
            const isToday = dateStr === today.toISOString().slice(0, 10)
            const isSelected = dateStr === selectedDate
            const dotColor = getDotColor(dayEntries)

            return (
              <button
                key={day}
                onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                className={cn(
                  "aspect-square flex flex-col items-center justify-center rounded-xl text-xs relative transition-all duration-200",
                  isToday && "ring-1 ring-fairy-purple/60",
                  isSelected && "bg-fairy-purple/20 ring-1 ring-fairy-purple",
                  hasEntries && !isSelected && "hover:bg-fairy-purple/10",
                  !hasEntries && "opacity-50 cursor-default"
                )}
              >
                <span className={cn(
                  "font-medium",
                  isToday ? "text-fairy-purple" : "text-fairy-text",
                  !hasEntries && "text-fairy-text-muted/50"
                )}>
                  {day}
                </span>
                {hasEntries && (
                  <span
                    className="w-1.5 h-1.5 rounded-full absolute bottom-1"
                    style={{ background: dotColor }}
                  />
                )}
              </button>
            )
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-4 pt-3 border-t border-fairy-border/20">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-fairy-purple" />
            <span className="text-xs text-fairy-text-muted/60">Has entries</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full border border-fairy-purple/60" />
            <span className="text-xs text-fairy-text-muted/60">Today</span>
          </div>
        </div>
      </motion.div>

      {/* Selected day entries */}
      <AnimatePresence>
        {selectedDate && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
          >
            <p className="text-sm font-medium text-fairy-text mb-3">
              {new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </p>
            {selectedEntries.length === 0 ? (
              <div className="glass rounded-2xl p-6 text-center border border-fairy-border/30">
                <p className="text-3xl mb-2">📅</p>
                <p className="text-fairy-text-muted text-sm">No entries on this day</p>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedEntries.map((entry, i) => (
                  <EntryCard
                    key={entry.id}
                    entry={entry}
                    onClick={() => setSelectedEntry(entry)}
                    index={i}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <EntryModal entry={selectedEntry} onClose={() => setSelectedEntry(null)} />
    </div>
  )
}
