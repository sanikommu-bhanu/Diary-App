import {
  cn, truncateText, countWords, generateId,
  calculateStreak, getMoodColor, getMoodFrequency,
  groupEntriesByDate, groupEntriesByMonth,
} from "@/lib/utils"
import type { Entry, Mood } from "@/types"

const makeEntry = (overrides: Partial<Entry> = {}): Entry => ({
  id: generateId(),
  title: "Test Entry",
  rawText: "Hello world test",
  mood: "happy",
  tags: [],
  favorite: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  mediaIds: [],
  ...overrides,
})

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("a", "b")).toBe("a b")
    expect(cn("a", false && "b")).toBe("a")
    expect(cn("px-2", "px-4")).toBe("px-4") // tailwind-merge behaviour
  })
})

describe("countWords", () => {
  it("counts words correctly", () => {
    expect(countWords("hello world")).toBe(2)
    expect(countWords("  spaces  everywhere  ")).toBe(2)
    expect(countWords("")).toBe(0)
    expect(countWords("single")).toBe(1)
  })
})

describe("truncateText", () => {
  it("does not truncate short text", () => {
    expect(truncateText("hi", 10)).toBe("hi")
  })

  it("truncates and appends ellipsis", () => {
    const result = truncateText("hello world this is long", 10)
    expect(result.endsWith("…")).toBe(true)
    expect(result.length).toBeLessThanOrEqual(11)
  })
})

describe("generateId", () => {
  it("generates unique IDs", () => {
    const ids = new Set(Array.from({ length: 100 }, generateId))
    expect(ids.size).toBe(100)
  })

  it("includes timestamp component", () => {
    const id = generateId()
    const parts = id.split("-")
    expect(parts.length).toBe(2)
    expect(Number(parts[0])).toBeGreaterThan(0)
  })
})

describe("calculateStreak", () => {
  it("returns zeros for empty entries", () => {
    const result = calculateStreak([])
    expect(result).toEqual({ current: 0, longest: 0, isActive: false, lastEntry: null })
  })

  it("calculates single-day streak", () => {
    const today = new Date().toISOString()
    const entries = [makeEntry({ createdAt: today })]
    const result = calculateStreak(entries)
    expect(result.current).toBeGreaterThanOrEqual(1)
    expect(result.isActive).toBe(true)
  })

  it("handles consecutive days", () => {
    const today = new Date()
    const entries = [0, 1, 2].map(daysAgo => {
      const d = new Date(today.getTime() - daysAgo * 86400000)
      return makeEntry({ createdAt: d.toISOString() })
    })
    const result = calculateStreak(entries)
    expect(result.current).toBe(3)
    expect(result.longest).toBeGreaterThanOrEqual(3)
  })
})

describe("getMoodColor", () => {
  const moods: Mood[] = ["happy", "sad", "calm", "angry", "dreamy", "romantic", "neutral"]
  it.each(moods)("returns hex color for %s", (mood) => {
    const color = getMoodColor(mood)
    expect(color).toMatch(/^#[0-9a-f]{6}$/i)
  })
})

describe("getMoodFrequency", () => {
  it("counts all moods including zeros", () => {
    const entries = [
      makeEntry({ mood: "happy" }),
      makeEntry({ mood: "happy" }),
      makeEntry({ mood: "sad" }),
    ]
    const freq = getMoodFrequency(entries)
    expect(freq.happy).toBe(2)
    expect(freq.sad).toBe(1)
    expect(freq.calm).toBe(0)
  })
})

describe("groupEntriesByDate", () => {
  it("groups entries by date correctly", () => {
    const entries = [
      makeEntry({ createdAt: "2024-01-15T10:00:00Z" }),
      makeEntry({ createdAt: "2024-01-15T20:00:00Z" }),
      makeEntry({ createdAt: "2024-01-16T10:00:00Z" }),
    ]
    const grouped = groupEntriesByDate(entries)
    expect(grouped["2024-01-15"]).toHaveLength(2)
    expect(grouped["2024-01-16"]).toHaveLength(1)
  })
})

describe("groupEntriesByMonth", () => {
  it("groups entries by month", () => {
    const entries = [
      makeEntry({ createdAt: "2024-01-15T10:00:00Z" }),
      makeEntry({ createdAt: "2024-01-20T10:00:00Z" }),
      makeEntry({ createdAt: "2024-02-01T10:00:00Z" }),
    ]
    const grouped = groupEntriesByMonth(entries)
    expect(grouped["2024-01"]).toHaveLength(2)
    expect(grouped["2024-02"]).toHaveLength(1)
  })
})
