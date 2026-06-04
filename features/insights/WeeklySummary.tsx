"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Sparkles, Loader2, ChevronDown } from "lucide-react"
import { useEntries } from "@/hooks/useEntries"
import { showToast } from "@/components/ui/Toast"
import { cn } from "@/lib/utils"

interface WeeklySummaryProps {
  type?: "weekly" | "monthly"
}

export function WeeklySummary({ type = "weekly" }: WeeklySummaryProps) {
  const { entries } = useEntries()
  const [summary, setSummary] = useState("")
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState(false)

  const getRelevantEntries = () => {
    const now = Date.now()
    const cutoff = type === "monthly" ? 30 * 86400000 : 7 * 86400000
    return entries.filter((e) => now - new Date(e.createdAt).getTime() < cutoff)
  }

  const handleGenerate = async () => {
    const relevant = getRelevantEntries()
    if (relevant.length === 0) {
      showToast(`No entries in the past ${type === "monthly" ? "month" : "week"}`, "info")
      return
    }
    setLoading(true)
    try {
      const res = await fetch("/api/ai/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entries: relevant, type }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setSummary(data.result)
      setExpanded(true)
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to generate summary", "error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="glass rounded-2xl overflow-hidden border border-fairy-purple/20">
      <button
        onClick={summary ? () => setExpanded(!expanded) : handleGenerate}
        className="w-full px-5 py-4 flex items-center justify-between hover:bg-fairy-purple/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          {loading ? (
            <Loader2 size={18} className="text-fairy-purple animate-spin" />
          ) : (
            <Sparkles size={18} className="text-fairy-purple" />
          )}
          <div className="text-left">
            <p className="text-sm font-medium text-fairy-text">
              {type === "monthly" ? "Monthly Reflection" : "Weekly Summary"}
            </p>
            <p className="text-xs text-fairy-text-muted/60">
              {loading ? "Generating…" : summary ? "Tap to " + (expanded ? "collapse" : "expand") : `AI-powered ${type} recap`}
            </p>
          </div>
        </div>
        {summary && !loading && (
          <ChevronDown
            size={16}
            className={cn("text-fairy-text-muted transition-transform", expanded && "rotate-180")}
          />
        )}
        {!summary && !loading && (
          <span className="text-xs text-fairy-purple border border-fairy-purple/30 px-2 py-1 rounded-lg">
            Generate
          </span>
        )}
      </button>

      <AnimatePresence>
        {summary && expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 pt-1">
              <div className="h-px bg-gradient-to-r from-fairy-purple/30 to-transparent mb-4" />
              <p className="text-sm text-fairy-text/80 font-display italic leading-relaxed whitespace-pre-wrap">
                {summary}
              </p>
              <button
                onClick={handleGenerate}
                className="mt-3 text-xs text-fairy-purple/70 hover:text-fairy-purple"
              >
                ↺ Regenerate
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
