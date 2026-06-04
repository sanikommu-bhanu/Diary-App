"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Sparkles, ChevronDown, ChevronUp, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { showToast } from "@/components/ui/Toast"

interface AITool {
  id: string
  label: string
  emoji: string
  description: string
  prompt: string
}

const AI_TOOLS: AITool[] = [
  { id: "rewrite", label: "Rewrite Beautifully", emoji: "✨", description: "Polish your words", prompt: "rewrite" },
  { id: "fairy", label: "Fairy Mode", emoji: "🧚‍♀️", description: "Magical & enchanted", prompt: "fairy" },
  { id: "poetic", label: "Poetic Mode", emoji: "🌸", description: "Lyrical & expressive", prompt: "poetic" },
  { id: "calm", label: "Calm Mode", emoji: "🌿", description: "Peaceful & grounded", prompt: "calm" },
  { id: "mature", label: "Mature Mode", emoji: "📝", description: "Eloquent & refined", prompt: "mature" },
  { id: "minimal", label: "Minimal Mode", emoji: "🤍", description: "Clean & essential", prompt: "minimal" },
]

const QUICK_TOOLS = [
  { id: "title", label: "Smart Title", emoji: "🔮", endpoint: "/api/ai/title" },
  { id: "mood", label: "Detect Mood", emoji: "💫", endpoint: "/api/ai/mood" },
  { id: "reflection", label: "Reflect", emoji: "🪞", endpoint: "/api/ai/reflect" },
]

interface AIToolbarProps {
  text: string
  onResult: (result: any, type: "enhanced" | "title" | "mood" | "reflection") => void
  className?: string
}

export function AIToolbar({ text, onResult, className }: AIToolbarProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState<string | null>(null)

  const hasText = text.trim().length > 20

  const callAI = async (endpoint: string, mode: string, type: "enhanced" | "title" | "mood" | "reflection") => {
    if (!hasText) {
      showToast("Write a bit more first ✍️", "info")
      return
    }
    setLoading(mode)
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, mode }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "AI request failed")
      }
      const data = await res.json()
      onResult(data.result, type)
      showToast(
        type === "title" ? "Title generated! ✨" :
        type === "mood" ? "Mood detected! 💫" :
        type === "reflection" ? "Reflections ready 🪞" :
        "Writing enhanced! ✨"
      )
    } catch (err) {
      const msg = err instanceof Error ? err.message : "AI unavailable. Check your API key."
      showToast(msg || "AI unavailable. Check your API key.", "error")
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className={cn("w-full", className)}>
      {/* Trigger button */}
      <motion.button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center justify-between px-4 py-3 rounded-xl glass border border-fairy-purple/30",
          "hover:border-fairy-purple/60 hover:bg-fairy-purple/10 transition-all duration-200",
          !hasText && "opacity-60"
        )}
        whileTap={{ scale: 0.98 }}
      >
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-fairy-purple animate-pulse-soft" />
          <span className="text-sm text-fairy-text font-medium">AI Writing Tools</span>
          {!hasText && <span className="text-xs text-fairy-text-muted/60">(write more first)</span>}
        </div>
        {isOpen ? (
          <ChevronUp size={16} className="text-fairy-text-muted" />
        ) : (
          <ChevronDown size={16} className="text-fairy-text-muted" />
        )}
      </motion.button>

      {/* Expanded panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -10 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={{ opacity: 0, height: 0, y: -10 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="glass rounded-xl mt-2 p-4 border border-fairy-border/30 space-y-4">
              {/* Quick tools */}
              <div>
                <p className="text-xs text-fairy-text-muted mb-2 font-medium uppercase tracking-wider">Quick Tools</p>
                <div className="grid grid-cols-3 gap-2">
                  <QuickToolBtn
                    emoji="🔮"
                    label="Title"
                    loading={loading === "title"}
                    onClick={() => callAI("/api/ai/title", "title", "title")}
                  />
                  <QuickToolBtn
                    emoji="💫"
                    label="Mood"
                    loading={loading === "mood"}
                    onClick={() => callAI("/api/ai/mood", "mood", "mood")}
                  />
                  <QuickToolBtn
                    emoji="🪞"
                    label="Reflect"
                    loading={loading === "reflection"}
                    onClick={() => callAI("/api/ai/reflect", "reflection", "reflection")}
                  />
                </div>
              </div>

              {/* Rewrite tools */}
              <div>
                <p className="text-xs text-fairy-text-muted mb-2 font-medium uppercase tracking-wider">Rewrite Style</p>
                <div className="grid grid-cols-2 gap-2">
                  {AI_TOOLS.map((tool) => (
                    <motion.button
                      key={tool.id}
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.96 }}
                      disabled={!!loading || !hasText}
                      onClick={() => callAI("/api/ai/rewrite", tool.prompt, "enhanced")}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2.5 rounded-xl text-left transition-all duration-200",
                        "glass border border-fairy-border/50 hover:border-fairy-purple/30 hover:bg-fairy-purple/10",
                        loading === tool.prompt && "border-fairy-purple/50 bg-fairy-purple/10"
                      )}
                    >
                      <span className="text-lg flex-shrink-0">
                        {loading === tool.prompt ? (
                          <Loader2 size={18} className="text-fairy-purple animate-spin" />
                        ) : tool.emoji}
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-fairy-text truncate">{tool.label}</p>
                        <p className="text-[10px] text-fairy-text-muted/70 truncate">{tool.description}</p>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>

              <p className="text-[10px] text-fairy-text-muted/40 text-center">
                AI tools powered by OpenRouter • Your writing stays private
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function QuickToolBtn({
  emoji,
  label,
  loading,
  onClick,
}: {
  emoji: string
  label: string
  loading: boolean
  onClick: () => void
}) {
  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.92 }}
      disabled={loading}
      onClick={onClick}
      className="flex flex-col items-center gap-1 py-2.5 px-2 rounded-xl glass-purple border border-fairy-purple/20 hover:border-fairy-purple/50 transition-all"
    >
      <span className="text-xl">
        {loading ? <Loader2 size={18} className="text-fairy-purple animate-spin" /> : emoji}
      </span>
      <span className="text-[10px] text-fairy-text-muted">{label}</span>
    </motion.button>
  )
}
