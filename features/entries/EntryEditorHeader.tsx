"use client"

import { AnimatePresence, motion } from "framer-motion"
import { X, Save, Heart, Check } from "lucide-react"
import { MagicButton } from "@/components/ui/MagicButton"
import { cn } from "@/lib/utils"

interface EntryEditorHeaderProps {
  favorite:   boolean
  saveState:  "idle" | "saving" | "saved"
  onBack:     () => void
  onFavorite: () => void
  onSave:     () => void
}

export function EntryEditorHeader({
  favorite, saveState, onBack, onFavorite, onSave,
}: EntryEditorHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <button
        type="button"
        onClick={onBack}
        aria-label="Discard and go back"
        className="p-2 glass rounded-xl text-fairy-text-muted hover:text-fairy-text"
      >
        <X size={20} aria-hidden="true" />
      </button>
      <div className="flex items-center gap-2">
        <AnimatePresence>
          {saveState !== "idle" && (
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              role="status"
              aria-live="polite"
              className={cn(
                "text-xs flex items-center gap-1 px-2 py-1 rounded-lg",
                saveState === "saving" ? "text-fairy-text-muted" : "text-green-400",
              )}
            >
              {saveState === "saving"
                ? <><span className="w-2 h-2 rounded-full bg-current animate-pulse" aria-hidden="true" />Saving…</>
                : <><Check size={12} aria-hidden="true" />Saved</>}
            </motion.span>
          )}
        </AnimatePresence>
        <button
          type="button"
          onClick={onFavorite}
          aria-label={favorite ? "Remove from favorites" : "Add to favorites"}
          aria-pressed={favorite}
          className="p-2 glass rounded-xl"
        >
          <Heart
            size={18}
            className={favorite ? "text-rose-400 fill-rose-400" : "text-fairy-text-muted"}
            aria-hidden="true"
          />
        </button>
        <MagicButton size="sm" onClick={onSave} aria-label="Save entry">
          <Save size={15} aria-hidden="true" />
          Save
        </MagicButton>
      </div>
    </div>
  )
}
