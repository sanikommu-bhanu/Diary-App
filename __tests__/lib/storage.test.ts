import {
  loadEntries, saveEntries, loadSettings, saveSettings,
  DEFAULT_SETTINGS, runMigrations, clearActiveProfileData, SCHEMA_VERSION,
} from "@/lib/storage"
import {
  initProfiles, createProfile, profileStorageKey, getActiveProfileId,
} from "@/lib/profiles"
import type { Entry, AppSettings } from "@/types"

const makeEntry = (overrides: Partial<Entry> = {}): Entry => ({
  id: "test-id",
  title: "Test",
  rawText: "Hello",
  mood: "happy",
  tags: [],
  favorite: false,
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z",
  mediaIds: [],
  wordCount: 1,
  ...overrides,
})

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
  initProfiles()
  createProfile("Test User")
})

function entriesKey(): string {
  const id = getActiveProfileId()
  if (!id) throw new Error("no profile")
  return profileStorageKey(id, "entries")
}

function settingsKey(): string {
  const id = getActiveProfileId()
  if (!id) throw new Error("no profile")
  return profileStorageKey(id, "settings")
}

function metaKey(): string {
  const id = getActiveProfileId()
  if (!id) throw new Error("no profile")
  return profileStorageKey(id, "meta")
}

describe("loadEntries", () => {
  it("returns empty array when nothing stored", () => {
    expect(loadEntries()).toEqual([])
  })

  it("returns stored entries", () => {
    const entries = [makeEntry()]
    localStorage.setItem(entriesKey(), JSON.stringify(entries))
    expect(loadEntries()).toEqual(entries)
  })

  it("returns empty array on malformed JSON", () => {
    localStorage.setItem(entriesKey(), "not-json{{{")
    expect(loadEntries()).toEqual([])
  })

  it("returns empty array if stored value is not an array", () => {
    localStorage.setItem(entriesKey(), JSON.stringify({ not: "an array" }))
    expect(loadEntries()).toEqual([])
  })
})

describe("saveEntries / loadEntries roundtrip", () => {
  it("saves and reloads entries correctly", () => {
    const entries = [makeEntry({ id: "a" }), makeEntry({ id: "b" })]
    saveEntries(entries)
    expect(loadEntries()).toEqual(entries)
  })
})

describe("loadSettings", () => {
  it("returns DEFAULT_SETTINGS when nothing stored", () => {
    const settings = loadSettings()
    expect(settings.hasOnboarded).toBe(false)
    expect(settings.theme).toBe("fairy-purple")
    expect(settings.animationsEnabled).toBe(true)
  })

  it("merges stored settings with defaults", () => {
    localStorage.setItem(settingsKey(), JSON.stringify({ hasOnboarded: true, theme: "rose-pink" }))
    const settings = loadSettings()
    expect(settings.hasOnboarded).toBe(true)
    expect(settings.theme).toBe("rose-pink")
    expect(settings.animationsEnabled).toBe(true)
  })

  it("strips pinHash from loaded settings (migration)", () => {
    localStorage.setItem(settingsKey(), JSON.stringify({ pinHash: "secret-hash-value" }))
    const settings = loadSettings()
    expect((settings as AppSettings & { pinHash?: string }).pinHash).toBeUndefined()
  })

  it("rejects invalid theme value, falls back to default", () => {
    localStorage.setItem(settingsKey(), JSON.stringify({ theme: "invalid-theme" }))
    const settings = loadSettings()
    expect(settings.theme).toBe(DEFAULT_SETTINGS.theme)
  })

  it("clamps pinLength to valid values", () => {
    localStorage.setItem(settingsKey(), JSON.stringify({ pinLength: 99 }))
    const settings = loadSettings()
    expect(settings.pinLength).toBe(4)
  })
})

describe("saveSettings / loadSettings roundtrip", () => {
  it("persists and reloads settings", () => {
    const settings: AppSettings = {
      ...DEFAULT_SETTINGS,
      hasOnboarded: true,
      displayName: "Fairy",
      theme: "ocean-blue",
    }
    saveSettings(settings)
    const loaded = loadSettings()
    expect(loaded.hasOnboarded).toBe(true)
    expect(loaded.displayName).toBe("Fairy")
    expect(loaded.theme).toBe("ocean-blue")
  })

  it("does not persist hasPIN in storage", () => {
    const settings: AppSettings = { ...DEFAULT_SETTINGS, hasPIN: true }
    saveSettings(settings)
    const raw = JSON.parse(localStorage.getItem(settingsKey()) ?? "{}")
    expect(raw.hasPIN).toBeUndefined()
  })
})

describe("runMigrations", () => {
  it("adds wordCount and mediaIds to v1 entries", () => {
    const oldEntry = {
      id: "old",
      title: "Old",
      rawText: "three words here",
      mood: "neutral",
      tags: [],
      favorite: false,
      createdAt: "2023-01-01T00:00:00Z",
      updatedAt: "2023-01-01T00:00:00Z",
    }
    localStorage.setItem(entriesKey(), JSON.stringify([oldEntry]))
    runMigrations()
    const migrated = loadEntries()
    expect(migrated[0].wordCount).toBe(3)
    expect(Array.isArray(migrated[0].mediaIds)).toBe(true)
  })

  it("sets schemaVersion to current after migration", () => {
    runMigrations()
    const meta = JSON.parse(localStorage.getItem(metaKey()) ?? "{}")
    expect(meta.schemaVersion).toBe(SCHEMA_VERSION)
  })
})

describe("clearActiveProfileData", () => {
  it("removes active profile keys", () => {
    localStorage.setItem(entriesKey(), "[]")
    localStorage.setItem(settingsKey(), "{}")
    const id = getActiveProfileId()!
    localStorage.setItem(profileStorageKey(id, "pin_hash"), "hash")
    clearActiveProfileData()
    expect(localStorage.getItem(entriesKey())).toBeNull()
    expect(localStorage.getItem(profileStorageKey(id, "pin_hash"))).toBeNull()
  })
})
