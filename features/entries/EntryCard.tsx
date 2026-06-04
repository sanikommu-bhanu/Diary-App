"use client"

import { motion } from "framer-motion"
import { Heart, ArrowRight, Trash2 } from "lucide-react"
import { cn, formatEntryDate, truncateText, countWords } from "@/lib/utils"
import { MOOD_CONFIG, WEATHER_CONFIG } from "@/types"
import { useAppStore } from "@/store/app-store"
import { showToast } from "@/components/ui/Toast"
import type { Entry } from "@/types"

interface EntryCardProps {
  entry: Entry
  onClick: () => void
  compact?: boolean
  index?: number
}

export function EntryCard({ entry, onClick, compact = false, index = 0 }: EntryCardProps) {
  const { toggleFavorite, deleteEntry } = useAppStore()
  const mood = MOOD_CONFIG[entry.mood]
  const displayText = entry.enhancedText || entry.rawText
  const mediaCount = entry.mediaIds?.length ?? 0

  const handleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation()
    toggleFavorite(entry.id)
    showToast(entry.favorite ? "Removed from favorites" : "Added to favorites ❤️")
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm("Delete this entry?")) {
      deleteEntry(entry.id)
      showToast("Entry deleted")
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.06, ease: "easeOut" }}
      onClick={onClick}
      className="entry-card group cursor-pointer"
    >
      <div
        className={cn(
          "glass rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-glass-hover",
          "border border-fairy-border/50 hover:border-fairy-purple/30",
          compact ? "p-3" : "p-4"
        )}
      >
        {/* Mood accent line */}
        <div
          className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl opacity-60"
          style={{ background: `linear-gradient(90deg, ${mood.color}, transparent)` }}
        />

        <div className="relative">
          {/* Header */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex-1 min-w-0">
              <h3 className={cn(
                "font-display font-semibold text-fairy-text truncate",
                compact ? "text-sm" : "text-base"
              )}>
                {entry.title || "Untitled Entry"}
              </h3>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <span className="text-xs text-fairy-text-muted">{formatEntryDate(entry.createdAt)}</span>
                {entry.weather && (
                  <span className="text-xs text-fairy-text-muted">
                    {WEATHER_CONFIG[entry.weather].emoji}
                  </span>
                )}
                <span
                  className="text-xs px-1.5 py-0.5 rounded-full"
                  style={{ background: mood.bg, color: mood.color }}
                >
                  {mood.emoji} {mood.label}
                </span>
                {entry.isDraft && (
                  <span className="text-xs text-amber-400/80 bg-amber-400/10 px-1.5 py-0.5 rounded-full">
                    Draft
                  </span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <motion.button
                whileTap={{ scale: 0.85 }}
                onClick={handleFavorite}
                aria-label={entry.favorite ? "Remove from favorites" : "Add to favorites"}
                aria-pressed={entry.favorite}
                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
              >
                <Heart
                  size={15}
                  className={cn(
                    entry.favorite ? "text-rose-400 fill-rose-400" : "text-fairy-text-muted"
                  )}
                />
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.85 }}
                onClick={handleDelete}
                aria-label="Delete this entry"
                className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
              >
                <Trash2 size={15} className="text-red-400/60" />
              </motion.button>
              <ArrowRight
                size={15}
                className="text-fairy-text-muted/50 entry-arrow transition-transform duration-200"
              />
            </div>
          </div>

          {/* Preview text */}
          {!compact && displayText && (
            <p className="text-sm text-fairy-text-muted/80 leading-relaxed line-clamp-2 font-display italic">
              "{truncateText(displayText, 120)}"
            </p>
          )}

          {/* Tags */}
          {!compact && entry.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {entry.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="text-xs text-fairy-purple/80 bg-fairy-purple/10 px-2 py-0.5 rounded-full border border-fairy-purple/20"
                >
                  #{tag}
                </span>
              ))}
              {entry.tags.length > 3 && (
                <span className="text-xs text-fairy-text-muted">+{entry.tags.length - 3}</span>
              )}
            </div>
          )}

          {/* Footer */}
          {!compact && (
            <div className="flex items-center gap-3 mt-3 pt-2 border-t border-fairy-border/30">
              <span className="text-xs text-fairy-text-muted/60">
                {countWords(displayText)} words
              </span>
              {mediaCount > 0 && (
                <span className="text-xs text-fairy-text-muted/60">📎 {mediaCount}</span>
              )}
              {entry.gratitude && (
                <span className="text-xs text-amber-400/60">🙏 Grateful</span>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
