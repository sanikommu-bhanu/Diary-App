"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { useRouter, useSearchParams } from "next/navigation"
import { ChevronDown, Sparkles } from "lucide-react"
import { useAppStore } from "@/store/app-store"
import { MoodSelector } from "./MoodSelector"
import { AIToolbar } from "@/features/ai/AIToolbar"
import { MediaPicker } from "@/features/media/MediaPicker"
import { EntryEditorHeader } from "./EntryEditorHeader"
import { EntryEditorExtras } from "./EntryEditorExtras"
import { MagicButton } from "@/components/ui/MagicButton"
import { showToast } from "@/components/ui/Toast"
import { countWords, cn } from "@/lib/utils"
import { sanitizeString } from "@/lib/validation"
import { LIMITS } from "@/lib/validation"
import type { Mood, Weather } from "@/types"

export function EntryEditor() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const editId       = searchParams.get("id")
  const { addEntry, updateEntry, entries } = useAppStore()

  const existing = editId ? entries.find(e => e.id === editId) : null

  const [title,        setTitle]        = useState(existing?.title || "")
  const [rawText,      setRawText]      = useState(existing?.rawText || "")
  const [enhancedText, setEnhancedText] = useState(existing?.enhancedText || "")
  const [mood,         setMood]         = useState<Mood>(existing?.mood || "neutral")
  const [weather,      setWeather]      = useState<Weather | undefined>(existing?.weather)
  const [gratitude,    setGratitude]    = useState(existing?.gratitude || "")
  const [tags,         setTags]         = useState<string[]>(existing?.tags || [])
  const [tagInput,     setTagInput]     = useState("")
  const [favorite,     setFavorite]     = useState(existing?.favorite || false)
  const [mediaIds,     setMediaIds]     = useState<string[]>(existing?.mediaIds || [])
  const [showExtras,   setShowExtras]   = useState(false)
  const [saveState,    setSaveState]    = useState<"idle" | "saving" | "saved">("idle")
  const [activeTab,    setActiveTab]    = useState<"write" | "enhanced">("write")
  const [reflectionQs, setReflectionQs] = useState<string[]>([])

  const autoSaveTimer = useRef<ReturnType<typeof setTimeout>>()
  const textareaRef   = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current
    if (ta) { ta.style.height = "auto"; ta.style.height = ta.scrollHeight + "px" }
  }, [rawText])

  // Autosave draft (only for edits)
  const doSaveDraft = useCallback(() => {
    if (!rawText.trim() || !editId || !existing) return
    setSaveState("saving")
    updateEntry(editId, {
      title: title || "Untitled",
      rawText, enhancedText: enhancedText || undefined,
      mood, tags, weather, gratitude: gratitude || undefined,
      favorite, mediaIds, isDraft: true,
      wordCount: countWords(rawText),
    })
    setSaveState("saved")
    setTimeout(() => setSaveState("idle"), 2000)
  }, [rawText, title, enhancedText, mood, tags, weather, gratitude, favorite, mediaIds, editId, existing, updateEntry])

  useEffect(() => {
    clearTimeout(autoSaveTimer.current)
    autoSaveTimer.current = setTimeout(doSaveDraft, 3000)
    return () => clearTimeout(autoSaveTimer.current)
  }, [rawText, title, doSaveDraft])

  const handleSave = (asDraft = false) => {
    const cleanText = sanitizeString(rawText, LIMITS.ENTRY_TEXT_MAX)
    if (!cleanText) { showToast("Write something first ✍️", "info"); return }

    const data = {
      title: sanitizeString(title, LIMITS.TITLE_MAX) || `Entry — ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric" })}`,
      rawText: cleanText,
      enhancedText: enhancedText || undefined,
      mood, tags, weather,
      gratitude: gratitude || undefined,
      favorite, mediaIds, isDraft: asDraft,
      wordCount: countWords(cleanText),
    }

    if (editId && existing) {
      updateEntry(editId, data)
      showToast("Entry updated! ✨")
    } else {
      addEntry(data)
      showToast(asDraft ? "Draft saved 📝" : "Entry saved! ✨")
    }
    router.push("/home")
  }

  const handleAIResult = (result: string | string[], type: "enhanced" | "title" | "mood" | "reflection") => {
    if (type === "enhanced" && typeof result === "string") { setEnhancedText(result); setActiveTab("enhanced") }
    else if (type === "title" && typeof result === "string") { setTitle(result.replace(/^["'“”]/g, "").replace(/["'“”]$/g, "")) }
    else if (type === "mood" && typeof result === "string") {
      const valid: Mood[] = ["happy", "sad", "calm", "angry", "dreamy", "romantic", "neutral"]
      const detected = result.toLowerCase().trim() as Mood
      if (valid.includes(detected)) setMood(detected)
    } else if (type === "reflection") {
      if (Array.isArray(result)) {
        setReflectionQs(result)
      } else if (typeof result === "string") {
        setReflectionQs(result.split("\n").filter(l => l.match(/^\d+\./)).map(q => q.replace(/^\d+\.\s*/, "")))
      }
    }
  }

  const addTag = (tag: string) => {
    const clean = tag.trim().toLowerCase().replace(/[^a-z0-9-]/g, "")
    if (clean && !tags.includes(clean) && tags.length < LIMITS.TAGS_COUNT_MAX) setTags([...tags, clean])
    setTagInput("")
  }

  const wordCount = countWords(activeTab === "write" ? rawText : enhancedText)

  return (
    <div className="min-h-screen px-4 pt-6 pb-8 max-w-2xl mx-auto">
      <EntryEditorHeader
        favorite={favorite}
        saveState={saveState}
        onBack={() => router.back()}
        onFavorite={() => setFavorite(f => !f)}
        onSave={() => handleSave(false)}
      />

      {/* Title */}
      <label htmlFor="entry-title" className="sr-only">Entry title</label>
      <input
        id="entry-title"
        type="text"
        placeholder="Give your entry a title…"
        value={title}
        onChange={e => setTitle(e.target.value)}
        maxLength={LIMITS.TITLE_MAX}
        className="w-full bg-transparent text-2xl font-display font-bold text-fairy-text placeholder-fairy-text-muted/30 focus:outline-none mb-1"
      />

      {/* Meta row */}
      <div className="flex items-center gap-3 mb-5 text-xs text-fairy-text-muted/60" aria-live="polite">
        <time dateTime={new Date().toISOString().slice(0, 10)}>
          {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
        </time>
        <span aria-hidden="true">·</span>
        <span>{wordCount} words</span>
        {rawText.length > LIMITS.ENTRY_TEXT_MAX * 0.9 && (
          <span className="text-amber-400">Near character limit</span>
        )}
      </div>

      {/* Mood */}
      <div className="mb-5">
        <MoodSelector value={mood} onChange={setMood} />
      </div>

      {/* Tab switcher */}
      {enhancedText && (
        <div className="flex gap-1 mb-2" role="tablist" aria-label="Entry view">
          {(["write", "enhanced"] as const).map(tab => (
            <button
              key={tab}
              role="tab"
              type="button"
              id={`tab-${tab}`}
              aria-selected={activeTab === tab}
              aria-controls={`panel-${tab}`}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-3 py-1.5 text-xs rounded-lg transition-all",
                activeTab === tab ? "bg-fairy-purple/20 text-fairy-purple" : "text-fairy-text-muted hover:text-fairy-text",
              )}
            >
              {tab === "write" ? "✍️ Original" : "✨ Enhanced"}
            </button>
          ))}
        </div>
      )}

      {/* Writing area */}
      <div
        role="tabpanel"
        id={`panel-${activeTab}`}
        aria-labelledby={`tab-${activeTab}`}
        className="relative mb-4"
      >
        <label htmlFor="entry-text" className="sr-only">
          {activeTab === "write" ? "Write your diary entry" : "AI-enhanced version"}
        </label>
        <textarea
          id="entry-text"
          ref={textareaRef}
          value={activeTab === "write" ? rawText : enhancedText}
          onChange={e => activeTab === "write" ? setRawText(e.target.value) : setEnhancedText(e.target.value)}
          placeholder="Pour your heart out… write about your day, your feelings, your dreams. This space is entirely yours. ✨"
          maxLength={activeTab === "write" ? LIMITS.ENTRY_TEXT_MAX : undefined}
          className="w-full min-h-[200px] bg-transparent text-fairy-text placeholder-fairy-text-muted/30 focus:outline-none diary-text resize-none leading-loose"
          aria-describedby="word-count-hint"
        />
        {activeTab === "enhanced" && (
          <div className="absolute top-0 right-0 text-xs text-fairy-purple/60 bg-fairy-purple/10 px-2 py-1 rounded-lg" aria-hidden="true">
            ✨ AI Enhanced
          </div>
        )}
      </div>
      <p id="word-count-hint" className="sr-only">{wordCount} words written</p>

      {/* Reflection questions */}
      <AnimatePresence>
        {reflectionQs.length > 0 && (
          <motion.aside
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            aria-label="Reflection questions"
            className="glass rounded-xl p-4 mb-4 border border-fairy-purple/20"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-fairy-purple">🪞 Reflection Questions</p>
              <button
                type="button"
                onClick={() => setReflectionQs([])}
                aria-label="Dismiss reflection questions"
                className="text-fairy-text-muted text-xs"
              >
                dismiss
              </button>
            </div>
            <ol className="space-y-2 list-decimal list-inside">
              {reflectionQs.map((q, i) => (
                <li key={i} className="text-sm text-fairy-text/80 leading-relaxed">{q}</li>
              ))}
            </ol>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* AI toolbar */}
      <div className="mb-4">
        <AIToolbar text={activeTab === "write" ? rawText : enhancedText} onResult={handleAIResult} />
      </div>

      {/* Media */}
      <div className="mb-4">
        <MediaPicker mediaIds={mediaIds} onChange={setMediaIds} />
      </div>

      {/* Extras toggle */}
      <button
        type="button"
        onClick={() => setShowExtras(!showExtras)}
        aria-expanded={showExtras}
        aria-controls="entry-extras"
        className="flex items-center gap-2 text-sm text-fairy-text-muted mb-3 hover:text-fairy-text transition-colors"
      >
        <ChevronDown
          size={16}
          aria-hidden="true"
          className={cn("transition-transform duration-200", showExtras && "rotate-180")}
        />
        {showExtras ? "Hide" : "Add"} weather, gratitude & tags
      </button>

      <div id="entry-extras">
        <AnimatePresence>
          {showExtras && (
            <EntryEditorExtras
              weather={weather}
              gratitude={gratitude}
              tags={tags}
              tagInput={tagInput}
              onWeather={setWeather}
              onGratitude={setGratitude}
              onTagInput={setTagInput}
              onAddTag={addTag}
              onRemoveTag={tag => setTags(tags.filter(t => t !== tag))}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Save buttons */}
      <div className="flex gap-3 pt-2">
        <MagicButton variant="secondary" size="md" onClick={() => handleSave(true)} className="flex-1">
          Save Draft
        </MagicButton>
        <MagicButton size="md" onClick={() => handleSave(false)} className="flex-1" glow>
          <Sparkles size={16} aria-hidden="true" />
          Save Entry
        </MagicButton>
      </div>
    </div>
  )
}
