"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Heart, Edit, Share } from "lucide-react"
import { formatEntryDate, formatRelativeTime, countWords } from "@/lib/utils"
import { MOOD_CONFIG, WEATHER_CONFIG } from "@/types"
import { useAppStore } from "@/store/app-store"
import { showToast } from "@/components/ui/Toast"
import { MagicButton } from "@/components/ui/MagicButton"
import { useRouter } from "next/navigation"
import { loadMedia } from "@/lib/storage"
import type { Entry, Media } from "@/types"

interface EntryModalProps {
  entry: Entry | null
  onClose: () => void
  onEdit?: () => void
}

export function EntryModal({ entry, onClose, onEdit }: EntryModalProps) {
  const { toggleFavorite } = useAppStore()
  const router = useRouter()
  const [mediaItems, setMediaItems] = useState<Media[]>([])
  const [viewerMedia, setViewerMedia] = useState<Media | null>(null)

  const handleFavorite = () => {
    if (!entry) return
    toggleFavorite(entry.id)
    showToast(entry.favorite ? "Removed from favorites" : "Added to favorites ❤️")
  }

  const handleEdit = () => {
    if (!entry) return
    onClose()
    router.push(`/write?id=${entry.id}`)
  }

  useEffect(() => {
    let mounted = true
    const run = async () => {
      if (!entry?.mediaIds?.length) {
        setMediaItems([])
        return
      }
      const list = await Promise.all(entry.mediaIds.map((id) => loadMedia(id)))
      if (!mounted) return
      setMediaItems(list.filter((item): item is Media => !!item))
    }
    run().catch(() => setMediaItems([]))
    return () => {
      mounted = false
    }
  }, [entry?.id, entry?.mediaIds])

  if (!entry) return null

  const mood = MOOD_CONFIG[entry.mood]
  const displayText = entry.enhancedText || entry.rawText

  return (
    <AnimatePresence>
      {entry && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 80, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 80, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
            className="fixed inset-x-0 bottom-0 z-50 max-h-[92vh] overflow-hidden rounded-t-3xl"
          >
            <div className="glass-dark border border-fairy-border/50 flex flex-col h-full max-h-[92vh]">
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-2 flex-shrink-0">
                <div className="w-10 h-1 bg-fairy-border rounded-full" />
              </div>

              {/* Header */}
              <div
                className="px-5 pb-4 flex-shrink-0"
                style={{ borderBottom: `1px solid ${mood.color}20` }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h2 className="font-display text-xl font-bold text-fairy-text mb-1">
                      {entry.title || "Untitled Entry"}
                    </h2>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-fairy-text-muted">{formatEntryDate(entry.createdAt)}</span>
                      <span className="text-xs text-fairy-text-muted/60">·</span>
                      <span className="text-xs text-fairy-text-muted/60">{formatRelativeTime(entry.createdAt)}</span>
                      {entry.weather && (
                        <>
                          <span className="text-xs text-fairy-text-muted/60">·</span>
                          <span className="text-xs text-fairy-text-muted">
                            {WEATHER_CONFIG[entry.weather].emoji} {WEATHER_CONFIG[entry.weather].label}
                          </span>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ background: mood.bg, color: mood.color }}
                      >
                        {mood.emoji} {mood.label}
                      </span>
                      <span className="text-xs text-fairy-text-muted/60">{countWords(displayText)} words</span>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 glass rounded-xl text-fairy-text-muted hover:text-fairy-text flex-shrink-0"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
                <p className="diary-text leading-loose whitespace-pre-wrap">
                  {displayText}
                </p>

                {entry.enhancedText && entry.rawText !== entry.enhancedText && (
                  <div className="glass rounded-xl p-3">
                    <p className="text-xs text-fairy-purple/70 mb-2">✨ Enhanced with AI</p>
                    <p className="text-xs text-fairy-text-muted/70 italic line-clamp-2">
                      Original: "{entry.rawText.slice(0, 100)}…"
                    </p>
                  </div>
                )}

                {entry.gratitude && (
                  <div className="glass rounded-xl p-4">
                    <p className="text-xs text-amber-400/70 mb-1.5">🙏 Grateful for</p>
                    <p className="text-sm text-fairy-text/80 italic font-display">{entry.gratitude}</p>
                  </div>
                )}

                {entry.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {entry.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs text-fairy-purple/80 bg-fairy-purple/10 px-2.5 py-1 rounded-full border border-fairy-purple/20"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                {mediaItems.length > 0 && (
                  <div>
                    <p className="text-xs text-fairy-text-muted/70 mb-2">Media</p>
                    <div className="grid grid-cols-3 gap-2">
                      {mediaItems.map((media) => (
                        <button
                          key={media.id}
                          type="button"
                          onClick={() => setViewerMedia(media)}
                          className="relative rounded-xl overflow-hidden aspect-square glass border border-fairy-border/30"
                        >
                          {media.type === "video" ? (
                            <video src={media.dataUrl} className="w-full h-full object-cover" />
                          ) : (
                            <img src={media.dataUrl} alt={media.name} className="w-full h-full object-cover" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer actions */}
              <div className="px-5 py-4 border-t border-fairy-border/30 flex gap-3 flex-shrink-0 safe-bottom">
                <button
                  onClick={handleFavorite}
                  className={`flex items-center gap-2 px-4 py-2.5 glass rounded-xl text-sm transition-colors ${
                    entry.favorite ? "text-rose-400 border-rose-400/30" : "text-fairy-text-muted"
                  }`}
                >
                  <Heart size={16} className={entry.favorite ? "fill-rose-400" : ""} />
                  {entry.favorite ? "Favorited" : "Favorite"}
                </button>
                <MagicButton variant="secondary" size="sm" onClick={handleEdit} className="flex-1">
                  <Edit size={15} />
                  Edit Entry
                </MagicButton>
              </div>
            </div>
          </motion.div>

          <AnimatePresence>
            {viewerMedia && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[70] bg-black/90"
                  onClick={() => setViewerMedia(null)}
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="fixed inset-0 z-[71] flex items-center justify-center p-4"
                >
                  <button
                    type="button"
                    onClick={() => setViewerMedia(null)}
                    className="absolute top-4 right-4 glass rounded-xl p-2 text-fairy-text"
                  >
                    <X size={18} />
                  </button>
                  {viewerMedia.type === "video" ? (
                    <video src={viewerMedia.dataUrl} controls autoPlay className="max-w-full max-h-full rounded-2xl" />
                  ) : (
                    <img src={viewerMedia.dataUrl} alt={viewerMedia.name} className="max-w-full max-h-full rounded-2xl" />
                  )}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </>
      )}
    </AnimatePresence>
  )
}
