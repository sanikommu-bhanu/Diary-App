"use client"

import { useEffect, useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Play } from "lucide-react"
import { loadMedia } from "@/lib/storage"
import { formatEntryDate } from "@/lib/utils"
import { MOOD_CONFIG } from "@/types"
import type { Entry, Media } from "@/types"

interface AlbumGalleryProps {
  entries: Entry[]
}

interface AlbumItem {
  id: string
  media: Media
  entryId: string
  mood: Entry["mood"]
  date: string
  title: string
}

export function AlbumGallery({ entries }: AlbumGalleryProps) {
  const [items, setItems] = useState<AlbumItem[]>([])
  const [viewer, setViewer] = useState<AlbumItem | null>(null)

  useEffect(() => {
    let mounted = true

    const load = async () => {
      const mediaMap = await Promise.all(
        entries.flatMap((entry) =>
          (entry.mediaIds ?? []).map(async (id) => {
            const media = await loadMedia(id)
            if (!media) return null
            return {
              id: `${entry.id}:${media.id}`,
              media,
              entryId: entry.id,
              mood: entry.mood,
              date: entry.createdAt,
              title: entry.title || "Untitled Entry",
            } satisfies AlbumItem
          })
        )
      )

      if (!mounted) return
      setItems(mediaMap.filter((item): item is AlbumItem => !!item))
    }

    load().catch(() => {
      if (mounted) setItems([])
    })

    return () => {
      mounted = false
    }
  }, [entries])

  const sorted = useMemo(
    () => [...items].sort((a, b) => b.date.localeCompare(a.date)),
    [items]
  )

  if (sorted.length === 0) {
    return (
      <div className="glass rounded-2xl border border-fairy-border/40 px-4 py-8 text-center">
        <p className="text-4xl mb-3">🖼️</p>
        <p className="text-sm text-fairy-text">No media yet</p>
        <p className="text-xs text-fairy-text-muted/70 mt-1">Attach photos or videos in Write to build your album</p>
      </div>
    )
  }

  return (
    <>
      <div className="columns-2 sm:columns-3 gap-3 space-y-3">
        {sorted.map((item, index) => {
          const mood = MOOD_CONFIG[item.mood]
          return (
            <motion.button
              key={item.id}
              type="button"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(index * 0.03, 0.25) }}
              className="relative w-full overflow-hidden rounded-2xl border border-fairy-border/35 break-inside-avoid group"
              onClick={() => setViewer(item)}
            >
              {item.media.type === "video" ? (
                <video src={item.media.dataUrl} className="w-full h-auto object-cover" />
              ) : (
                <img src={item.media.dataUrl} alt={item.title} className="w-full h-auto object-cover" />
              )}

              <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/70 to-transparent text-left">
                <p className="text-[10px] text-white/95 truncate">{formatEntryDate(item.date)}</p>
                <p className="text-[10px] text-white/85 truncate">{mood.emoji} {mood.label}</p>
              </div>

              {item.media.type === "video" && (
                <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/55 flex items-center justify-center">
                  <Play size={12} className="text-white ml-0.5" />
                </div>
              )}
            </motion.button>
          )
        })}
      </div>

      <AnimatePresence>
        {viewer && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[80] bg-black/90"
              onClick={() => setViewer(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="fixed inset-0 z-[81] p-4 flex flex-col"
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-xs text-white/90">{formatEntryDate(viewer.date)}</p>
                  <p className="text-xs text-white/70">{MOOD_CONFIG[viewer.mood].emoji} {MOOD_CONFIG[viewer.mood].label}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setViewer(null)}
                  className="glass rounded-xl p-2 text-white"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="flex-1 min-h-0 flex items-center justify-center">
                {viewer.media.type === "video" ? (
                  <video src={viewer.media.dataUrl} controls autoPlay className="max-w-full max-h-full rounded-2xl" />
                ) : (
                  <img src={viewer.media.dataUrl} alt={viewer.title} className="max-w-full max-h-full rounded-2xl" />
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
