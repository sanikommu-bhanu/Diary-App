"use client"

import { useState, useMemo, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search, Filter, X, Heart, SortDesc, SortAsc, Images, List } from "lucide-react"
import { useEntries } from "@/hooks/useEntries"
import { EntryCard } from "@/features/entries/EntryCard"
import { EntryModal } from "@/features/entries/EntryModal"
import { AlbumGallery } from "@/features/media/AlbumGallery"
import { EmptyState } from "@/components/ui/EmptyState"
import { cn, formatMonthYear } from "@/lib/utils"
import { MOOD_CONFIG } from "@/types"
import type { Entry, Mood } from "@/types"

type SortOrder = "newest" | "oldest"

export default function TimelinePage() {
  const { entries, searchEntries, getAllTags } = useEntries()
  const [query,       setQuery]       = useState("")
  const [moodFilter,  setMoodFilter]  = useState<Mood | null>(null)
  const [tagFilter,   setTagFilter]   = useState<string | null>(null)
  const [favOnly,     setFavOnly]     = useState(false)
  const [sort,        setSort]        = useState<SortOrder>("newest")
  const [showFilters, setShowFilters] = useState(false)
  const [selectedEntry, setSelectedEntry] = useState<Entry | null>(null)
  const [viewMode,    setViewMode]    = useState<"list" | "album">("list")

  const allTags = getAllTags()
  const moods   = Object.keys(MOOD_CONFIG) as Mood[]

  const filtered = useMemo(() => {
    let results = searchEntries(query, moodFilter, tagFilter)
    if (favOnly) results = results.filter(e => e.favorite)
    if (sort === "oldest") results = [...results].reverse()
    return results
  }, [query, moodFilter, tagFilter, favOnly, sort, searchEntries])

  const grouped = useMemo(() => {
    const groups: Record<string, Entry[]> = {}
    filtered.forEach(e => {
      const month = e.createdAt.slice(0, 7)
      if (!groups[month]) groups[month] = []
      groups[month].push(e)
    })
    return Object.entries(groups).sort(([a], [b]) =>
      sort === "newest" ? b.localeCompare(a) : a.localeCompare(b),
    )
  }, [filtered, sort])

  const hasFilters = query || moodFilter || tagFilter || favOnly

  const clearFilters = useCallback(() => {
    setMoodFilter(null); setTagFilter(null); setFavOnly(false); setQuery("")
  }, [])

  return (
    <div className="min-h-screen px-4 pt-12 pb-4 max-w-lg mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="font-display text-2xl font-bold gradient-text mb-1">Timeline</h1>
        <p className="text-fairy-text-muted text-sm">
          {entries.length === 0
            ? "Your diary awaits its first entry"
            : `${entries.length} ${entries.length === 1 ? "entry" : "entries"} in your diary`}
        </p>
      </motion.div>

      {/* Search + controls */}
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="flex gap-2 mb-4"
      >
        <div className="flex-1 relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-fairy-text-muted/60" aria-hidden="true" />
          <label htmlFor="timeline-search" className="sr-only">Search entries</label>
          <input
            id="timeline-search"
            type="search"
            placeholder="Search entries…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full glass rounded-xl pl-9 pr-4 py-2.5 text-sm text-fairy-text placeholder-fairy-text-muted/40 focus:outline-none border border-fairy-border/50 focus:border-fairy-purple/40"
            aria-label="Search your diary entries"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-fairy-text-muted"
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          aria-expanded={showFilters}
          aria-controls="filter-panel"
          aria-label={hasFilters ? "Filters active" : "Open filters"}
          className={cn(
            "px-3 glass rounded-xl border transition-all text-sm flex items-center gap-1.5",
            showFilters || hasFilters
              ? "border-fairy-purple/60 text-fairy-purple"
              : "border-fairy-border/50 text-fairy-text-muted",
          )}
        >
          <Filter size={14} aria-hidden="true" />
          {hasFilters ? "Filtered" : "Filter"}
        </button>
        <button
          type="button"
          onClick={() => setSort(s => s === "newest" ? "oldest" : "newest")}
          aria-label={sort === "newest" ? "Sorted newest first, click for oldest" : "Sorted oldest first, click for newest"}
          className="p-2.5 glass rounded-xl border border-fairy-border/50 text-fairy-text-muted hover:text-fairy-purple"
        >
          {sort === "newest" ? <SortDesc size={16} aria-hidden="true" /> : <SortAsc size={16} aria-hidden="true" />}
        </button>
      </motion.div>

      {/* View toggle */}
      <div className="mb-4" role="group" aria-label="View mode">
        <div className="glass rounded-2xl p-1 border border-fairy-border/35 inline-flex w-full">
          {(["list", "album"] as const).map(mode => (
            <button
              key={mode}
              type="button"
              onClick={() => setViewMode(mode)}
              aria-pressed={viewMode === mode}
              className={cn(
                "flex-1 rounded-xl py-2 text-sm flex items-center justify-center gap-1.5",
                viewMode === mode ? "bg-fairy-purple/20 text-fairy-purple" : "text-fairy-text-muted",
              )}
            >
              {mode === "list" ? <List size={14} aria-hidden="true" /> : <Images size={14} aria-hidden="true" />}
              {mode === "list" ? "Timeline" : "Album"}
            </button>
          ))}
        </div>
      </div>

      {/* Filter panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            id="filter-panel"
            role="region"
            aria-label="Filters"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-4"
          >
            <div className="glass rounded-2xl p-4 border border-fairy-border/30 space-y-3">
              <fieldset>
                <legend className="text-xs text-fairy-text-muted mb-2">Mood</legend>
                <div className="flex flex-wrap gap-1.5">
                  {moods.map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMoodFilter(moodFilter === m ? null : m)}
                      aria-pressed={moodFilter === m}
                      className={cn(
                        "text-xs px-2.5 py-1.5 rounded-xl border transition-all",
                        moodFilter === m
                          ? "text-white border-transparent"
                          : "glass border-fairy-border/50 text-fairy-text-muted hover:border-fairy-purple/30",
                      )}
                      style={moodFilter === m ? { background: MOOD_CONFIG[m].color } : {}}
                    >
                      {MOOD_CONFIG[m].emoji} {MOOD_CONFIG[m].label}
                    </button>
                  ))}
                </div>
              </fieldset>

              {allTags.length > 0 && (
                <fieldset>
                  <legend className="text-xs text-fairy-text-muted mb-2">Tag</legend>
                  <div className="flex flex-wrap gap-1.5">
                    {allTags.slice(0, 10).map(tag => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => setTagFilter(tagFilter === tag ? null : tag)}
                        aria-pressed={tagFilter === tag}
                        className={cn(
                          "text-xs px-2.5 py-1 rounded-full border transition-all",
                          tagFilter === tag
                            ? "bg-fairy-purple/30 border-fairy-purple text-fairy-text"
                            : "glass border-fairy-border/50 text-fairy-text-muted hover:border-fairy-purple/30",
                        )}
                      >
                        #{tag}
                      </button>
                    ))}
                  </div>
                </fieldset>
              )}

              <button
                type="button"
                onClick={() => setFavOnly(!favOnly)}
                role="switch"
                aria-checked={favOnly}
                className={cn(
                  "flex items-center gap-2 text-sm px-3 py-2 rounded-xl border transition-all w-full",
                  favOnly
                    ? "bg-rose-400/15 border-rose-400/40 text-rose-300"
                    : "glass border-fairy-border/50 text-fairy-text-muted hover:border-rose-400/30",
                )}
              >
                <Heart size={14} className={favOnly ? "fill-rose-400 text-rose-400" : ""} aria-hidden="true" />
                Favorites only
              </button>

              {hasFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-xs text-fairy-rose hover:underline"
                >
                  Clear all filters
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Result count */}
      {hasFilters && (
        <p className="text-xs text-fairy-text-muted/60 mb-3" role="status" aria-live="polite">
          {filtered.length} {filtered.length === 1 ? "entry" : "entries"} found
        </p>
      )}

      {/* Empty states */}
      {entries.length === 0 && (
        <EmptyState
          emoji="📖"
          title="Your diary is empty"
          description="Every great story begins with a single word. Write your first entry and start your journey."
          action={{ label: "Write First Entry ✨", href: "/write" }}
        />
      )}

      {entries.length > 0 && filtered.length === 0 && (
        <EmptyState
          emoji="🔍"
          title="No entries found"
          description={hasFilters ? "No entries match your current filters." : "Nothing to show here."}
          action={hasFilters ? { label: "Clear Filters", onClick: clearFilters } : undefined}
          compact
        />
      )}

      {/* Content */}
      {viewMode === "album" ? (
        <AlbumGallery entries={filtered} />
      ) : (
        <div className="space-y-6" role="feed" aria-label="Diary entries">
          {grouped.map(([month, monthEntries]) => (
            <motion.section
              key={month}
              aria-label={formatMonthYear(month + "-01")}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <p className="text-xs text-fairy-text-muted/70 font-medium uppercase tracking-wider mb-3">
                {formatMonthYear(month + "-01")}
                <span className="ml-2 text-fairy-text-muted/40">({monthEntries.length})</span>
              </p>
              <div className="space-y-3">
                {monthEntries.map((entry, i) => (
                  <EntryCard
                    key={entry.id}
                    entry={entry}
                    onClick={() => setSelectedEntry(entry)}
                    index={i}
                  />
                ))}
              </div>
            </motion.section>
          ))}
        </div>
      )}

      <EntryModal entry={selectedEntry} onClose={() => setSelectedEntry(null)} />
    </div>
  )
}
