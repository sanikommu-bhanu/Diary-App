"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Sparkles, Loader2, ChevronDown, Award, Brain, Heart, TrendingUp } from "lucide-react"
import { useEntries } from "@/hooks/useEntries"
import { showToast } from "@/components/ui/Toast"
import { cn } from "@/lib/utils"

interface AnalyticsData {
  result: string
  stats: {
    totalEntries: number
    totalWords: number
    avgWordsPerEntry: number
    moodDistribution: Record<string, number>
    topTags: string[]
  }
}

export function AIAnalytics() {
  const { entries } = useEntries()
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState(false)

  const handleGenerate = async () => {
    if (entries.length < 3) {
      showToast("Write at least 3 entries to unlock AI Analytics ✨", "info")
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/ai/analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entries: entries.slice(0, 30) }), // Analyze up to last 30 entries
      })
      const responseData = await res.json()
      if (!res.ok) throw new Error(responseData.error)
      setData(responseData)
      setExpanded(true)
      showToast("Analysis complete! 🔮")
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to generate analytics", "error")
    } finally {
      setLoading(false)
    }
  }

  // Helper to render markdown headers with icons
  const renderFormattedResult = (text: string) => {
    const lines = text.split("\n")
    return lines.map((line, idx) => {
      if (line.startsWith("## Emotional Journey")) {
        return (
          <div key={idx} className="mt-4 first:mt-0">
            <h3 className="text-sm font-semibold text-fairy-rose flex items-center gap-2 mb-1.5">
              <Heart size={14} className="fill-fairy-rose/25 text-fairy-rose" />
              Emotional Journey
            </h3>
          </div>
        )
      }
      if (line.startsWith("## Writing Patterns")) {
        return (
          <div key={idx} className="mt-5">
            <h3 className="text-sm font-semibold text-fairy-purple flex items-center gap-2 mb-1.5">
              <TrendingUp size={14} className="text-fairy-purple" />
              Writing Patterns
            </h3>
          </div>
        )
      }
      if (line.startsWith("## Growth Insights")) {
        return (
          <div key={idx} className="mt-5">
            <h3 className="text-sm font-semibold text-amber-400 flex items-center gap-2 mb-1.5">
              <Brain size={14} className="text-amber-400" />
              Growth Insights
            </h3>
          </div>
        )
      }
      if (line.startsWith("## Encouragement")) {
        return (
          <div key={idx} className="mt-5">
            <h3 className="text-sm font-semibold text-emerald-400 flex items-center gap-2 mb-1.5">
              <Award size={14} className="text-emerald-400" />
              Coach's Encouragement
            </h3>
          </div>
        )
      }
      if (line.startsWith("- ")) {
        return (
          <li key={idx} className="text-xs text-fairy-text/80 leading-relaxed ml-4 list-disc mb-1">
            {line.replace(/^- /, "")}
          </li>
        )
      }
      if (line.trim().length > 0) {
        return (
          <p key={idx} className="text-xs text-fairy-text/80 leading-relaxed mb-2">
            {line}
          </p>
        )
      }
      return null
    })
  }

  const hasEnoughEntries = entries.length >= 3

  return (
    <div className={cn(
      "glass rounded-2xl overflow-hidden border transition-all duration-300",
      data ? "border-fairy-purple/35 shadow-fairy" : "border-fairy-purple/15"
    )}>
      <button
        onClick={data ? () => setExpanded(!expanded) : handleGenerate}
        disabled={loading}
        className="w-full px-5 py-4 flex items-center justify-between hover:bg-fairy-purple/5 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            {loading ? (
              <Loader2 size={20} className="text-fairy-purple animate-spin" />
            ) : (
              <>
                <Brain size={20} className="text-fairy-purple" />
                <Sparkles size={10} className="absolute -top-1 -right-1 text-fairy-rose animate-pulse" />
              </>
            )}
          </div>
          <div>
            <p className="text-sm font-semibold text-fairy-text flex items-center gap-1.5">
              AI Journal Coach & Insights
              {hasEnoughEntries && !data && (
                <span className="text-[10px] bg-fairy-purple/20 text-fairy-purple px-1.5 py-0.5 rounded-full font-normal animate-pulse-soft">
                  New
                </span>
              )}
            </p>
            <p className="text-xs text-fairy-text-muted/60">
              {loading
                ? "Analyzing emotional patterns…"
                : data
                  ? "Tap to " + (expanded ? "collapse" : "view full analysis")
                  : hasEnoughEntries
                    ? "Get deep writing feedback & encouragement"
                    : "Write 3 entries to unlock AI coach feedback"}
            </p>
          </div>
        </div>
        {data && !loading ? (
          <ChevronDown
            size={16}
            className={cn("text-fairy-text-muted transition-transform", expanded && "rotate-180")}
          />
        ) : (
          !loading && (
            <span className={cn(
              "text-xs border px-2.5 py-1 rounded-lg transition-all",
              hasEnoughEntries
                ? "text-fairy-purple border-fairy-purple/30 hover:bg-fairy-purple/10"
                : "text-fairy-text-muted/40 border-fairy-border/30 cursor-not-allowed"
            )}>
              Analyze
            </span>
          )
        )}
      </button>

      <AnimatePresence>
        {data && expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 pt-1">
              <div className="h-px bg-gradient-to-r from-fairy-purple/30 to-transparent mb-4" />
              
              {/* Report Stats */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="glass rounded-xl p-2.5 border border-fairy-border/30 text-center">
                  <p className="text-[10px] text-fairy-text-muted/70">Analyzed</p>
                  <p className="text-sm font-bold text-fairy-purple mt-0.5">{data.stats.totalEntries} entries</p>
                </div>
                <div className="glass rounded-xl p-2.5 border border-fairy-border/30 text-center">
                  <p className="text-[10px] text-fairy-text-muted/70">Avg. Length</p>
                  <p className="text-sm font-bold text-fairy-rose mt-0.5">{data.stats.avgWordsPerEntry} words</p>
                </div>
                <div className="glass rounded-xl p-2.5 border border-fairy-border/30 text-center">
                  <p className="text-[10px] text-fairy-text-muted/70">Total Words</p>
                  <p className="text-sm font-bold text-emerald-400 mt-0.5">{data.stats.totalWords}</p>
                </div>
              </div>

              {/* Report Body */}
              <div className="glass rounded-xl p-4 border border-fairy-purple/10 bg-fairy-purple/5 space-y-1">
                {renderFormattedResult(data.result)}
              </div>

              <div className="flex items-center justify-between mt-4">
                <button
                  onClick={handleGenerate}
                  className="text-xs text-fairy-purple/70 hover:text-fairy-purple hover:underline"
                >
                  ↺ Refresh Analysis
                </button>
                <span className="text-[10px] text-fairy-text-muted/40 italic">
                  Analyzed by OpenRouter AI
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
