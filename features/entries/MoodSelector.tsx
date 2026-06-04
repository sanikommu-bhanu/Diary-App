"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { MOOD_CONFIG } from "@/types"
import type { Mood } from "@/types"

interface MoodSelectorProps {
  value?: Mood
  onChange: (mood: Mood) => void
  compact?: boolean
}

export function MoodSelector({ value, onChange, compact = false }: MoodSelectorProps) {
  const moods = Object.entries(MOOD_CONFIG) as [Mood, typeof MOOD_CONFIG[Mood]][]

  return (
    <div>
      {!compact && (
        <p className="text-fairy-text-muted text-sm mb-3">How are you feeling?</p>
      )}
      <div className={cn(
        "flex flex-wrap gap-2",
        compact ? "justify-center" : ""
      )}>
        {moods.map(([mood, config]) => (
          <motion.button
            key={mood}
            type="button"
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            onClick={() => onChange(mood)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm border transition-all duration-200",
              compact ? "flex-col text-xs px-2 py-1.5 gap-1" : "",
              value === mood
                ? "border-transparent text-white shadow-button"
                : "glass border-fairy-border text-fairy-text-muted hover:border-fairy-purple/30"
            )}
            style={
              value === mood
                ? { background: config.color, boxShadow: `0 4px 20px ${config.color}50` }
                : {}
            }
          >
            <span className={compact ? "text-lg" : "text-base"}>{config.emoji}</span>
            {!compact && <span>{config.label}</span>}
            {compact && <span className="text-[10px]">{config.label}</span>}
          </motion.button>
        ))}
      </div>
    </div>
  )
}

export function MoodBadge({ mood }: { mood: Mood }) {
  const config = MOOD_CONFIG[mood]
  return (
    <span
      className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium"
      style={{ background: config.bg, color: config.color }}
    >
      {config.emoji} {config.label}
    </span>
  )
}
