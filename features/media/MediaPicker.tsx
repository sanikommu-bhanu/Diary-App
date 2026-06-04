"use client"

import { useState, useRef, useEffect } from "react"
import { motion } from "framer-motion"
import { ImageIcon, X, Plus } from "lucide-react"
import { saveMedia, loadMedia, deleteMedia } from "@/lib/storage"
import { generateId } from "@/lib/utils"
import { showToast } from "@/components/ui/Toast"
import type { Media } from "@/types"

interface MediaPickerProps {
  mediaIds: string[]
  onChange: (ids: string[]) => void
}

export function MediaPicker({ mediaIds, onChange }: MediaPickerProps) {
  const [previews, setPreviews] = useState<{ id: string; dataUrl: string; type: string }[]>([])
  const [loading, setLoading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    let mounted = true

    const hydrate = async () => {
      const loaded = await Promise.all(mediaIds.map((id) => loadMedia(id)))
      if (!mounted) return
      const next = loaded
        .filter((item): item is Media => !!item)
        .map((item) => ({ id: item.id, dataUrl: item.dataUrl, type: item.type }))
      setPreviews(next)
    }

    hydrate().catch(() => undefined)

    return () => {
      mounted = false
    }
  }, [mediaIds])

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    setLoading(true)

    const newIds: string[] = []
    const newPreviews: typeof previews = []

    for (const file of files.slice(0, 5)) {
      if (file.size > 10 * 1024 * 1024) {
        showToast("File too large (max 10MB)", "error")
        continue
      }
      const dataUrl = await readFileAsDataURL(file)
      const media: Media = {
        id: generateId(),
        type: file.type.startsWith("video") ? "video" : "image",
        dataUrl,
        name: file.name,
        size: file.size,
        createdAt: new Date().toISOString(),
      }
      await saveMedia(media)
      newIds.push(media.id)
      newPreviews.push({ id: media.id, dataUrl, type: media.type })
    }

    onChange([...mediaIds, ...newIds])
    setLoading(false)
    e.target.value = ""
  }

  const handleRemove = async (id: string) => {
    await deleteMedia(id)
    onChange(mediaIds.filter((mid) => mid !== id))
    setPreviews((p) => p.filter((prev) => prev.id !== id))
    showToast("Media removed")
  }

  return (
    <div>
      <p className="text-xs text-fairy-text-muted mb-2 flex items-center gap-1.5">
        <ImageIcon size={12} />Media Attachments
      </p>
      <div className="flex flex-wrap gap-2">
        {previews.map((p) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative w-16 h-16 rounded-xl overflow-hidden group"
          >
            {p.type === "video" ? (
              <video src={p.dataUrl} className="w-full h-full object-cover" />
            ) : (
              <img src={p.dataUrl} alt="" className="w-full h-full object-cover" />
            )}
            <button
              onClick={() => handleRemove(p.id)}
              className="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X size={10} className="text-white" />
            </button>
          </motion.div>
        ))}

        {/* Add button */}
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={loading || mediaIds.length >= 5}
          className="w-16 h-16 rounded-xl glass border border-dashed border-fairy-border/50 hover:border-fairy-purple/40 flex items-center justify-center text-fairy-text-muted hover:text-fairy-purple transition-colors disabled:opacity-50"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-fairy-purple/30 border-t-fairy-purple rounded-full animate-spin" />
          ) : (
            <Plus size={18} />
          )}
        </button>
      </div>
      <p className="text-[10px] text-fairy-text-muted/40 mt-1">Up to 5 images/videos, max 10MB each</p>
      <input
        ref={fileRef}
        type="file"
        accept="image/*,video/*"
        multiple
        className="hidden"
        onChange={handleFileSelect}
      />
    </div>
  )
}

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error("Failed to read file"))
    reader.readAsDataURL(file)
  })
}
