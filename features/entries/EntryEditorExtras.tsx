"use client"

import { motion } from "framer-motion"
import { Tag, Cloud } from "lucide-react"
import { WEATHER_CONFIG } from "@/types"
import { cn } from "@/lib/utils"
import type { Weather } from "@/types"

const SUGGESTED_TAGS = [
  "gratitude", "growth", "dreams", "family", "work",
  "health", "love", "adventure", "food", "nature", "reflection", "goals",
]

interface EntryEditorExtrasProps {
  weather:    Weather | undefined
  gratitude:  string
  tags:       string[]
  tagInput:   string
  onWeather:  (w: Weather | undefined) => void
  onGratitude:(v: string) => void
  onTagInput: (v: string) => void
  onAddTag:   (tag: string) => void
  onRemoveTag:(tag: string) => void
}

export function EntryEditorExtras({
  weather, gratitude, tags, tagInput,
  onWeather, onGratitude, onTagInput, onAddTag, onRemoveTag,
}: EntryEditorExtrasProps) {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="overflow-hidden space-y-4 mb-4"
    >
      {/* Weather */}
      <fieldset>
        <legend className="text-xs text-fairy-text-muted mb-2 flex items-center gap-1.5">
          <Cloud size={12} aria-hidden="true" />Weather
        </legend>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(WEATHER_CONFIG) as Weather[]).map(w => (
            <button
              key={w}
              type="button"
              onClick={() => onWeather(weather === w ? undefined : w)}
              aria-pressed={weather === w}
              className={cn(
                "px-3 py-1.5 rounded-xl text-sm glass border transition-all",
                weather === w
                  ? "border-fairy-purple/60 text-fairy-text bg-fairy-purple/15"
                  : "border-fairy-border text-fairy-text-muted hover:border-fairy-purple/30",
              )}
            >
              {WEATHER_CONFIG[w].emoji} {WEATHER_CONFIG[w].label}
            </button>
          ))}
        </div>
      </fieldset>

      {/* Gratitude */}
      <div>
        <label htmlFor="gratitude-input" className="text-xs text-fairy-text-muted mb-2 block">
          🙏 I am grateful for…
        </label>
        <textarea
          id="gratitude-input"
          value={gratitude}
          onChange={e => onGratitude(e.target.value)}
          placeholder="Something you appreciate today…"
          rows={2}
          className="w-full glass rounded-xl px-3 py-2 text-sm text-fairy-text placeholder-fairy-text-muted/40 focus:outline-none focus:border-fairy-purple/40 border border-fairy-border resize-none"
        />
      </div>

      {/* Tags */}
      <div>
        <p className="text-xs text-fairy-text-muted mb-2 flex items-center gap-1.5">
          <Tag size={12} aria-hidden="true" />Tags
        </p>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2" role="list" aria-label="Current tags">
            {tags.map(tag => (
              <span
                key={tag}
                role="listitem"
                className="inline-flex items-center gap-1 text-xs text-fairy-purple bg-fairy-purple/15 px-2 py-1 rounded-full border border-fairy-purple/20"
              >
                #{tag}
                <button
                  type="button"
                  onClick={() => onRemoveTag(tag)}
                  aria-label={`Remove tag ${tag}`}
                  className="text-fairy-purple/60 hover:text-fairy-rose ml-0.5"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
        <label htmlFor="tag-input" className="sr-only">Add a tag</label>
        <input
          id="tag-input"
          type="text"
          value={tagInput}
          onChange={e => onTagInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault()
              onAddTag(tagInput)
            }
          }}
          placeholder="Add a tag and press Enter"
          className="w-full glass rounded-xl px-3 py-2 text-sm text-fairy-text placeholder-fairy-text-muted/40 focus:outline-none border border-fairy-border"
          aria-describedby="tag-hint"
        />
        <p id="tag-hint" className="sr-only">Type a tag name and press Enter or comma to add</p>
        <div className="flex flex-wrap gap-1.5 mt-2" role="group" aria-label="Suggested tags">
          {SUGGESTED_TAGS.filter(t => !tags.includes(t)).slice(0, 6).map(tag => (
            <button
              key={tag}
              type="button"
              onClick={() => onAddTag(tag)}
              aria-label={`Add tag: ${tag}`}
              className="text-xs text-fairy-text-muted/60 bg-white/5 hover:bg-fairy-purple/10 hover:text-fairy-purple px-2 py-0.5 rounded-full border border-fairy-border/50 transition-all"
            >
              +{tag}
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  )
}
