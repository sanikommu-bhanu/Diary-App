/**
 * lib/storage.ts — Persistent storage layer (per-profile)
 */
import type { Entry, AppSettings, Media } from "@/types"
import {
  getActiveProfileId,
  profileStorageKey,
  profileDbName,
  initProfiles,
} from "@/lib/profiles"

const MEDIA_STORE = "media"

/** Bump when the data schema changes — triggers migration on next load. */
export const SCHEMA_VERSION = 2

interface Meta {
  schemaVersion: number
  lastSavedAt: string
}

function requireProfileId(): string | null {
  return getActiveProfileId()
}

function entriesKey(profileId: string): string {
  return profileStorageKey(profileId, "entries")
}

function settingsKey(profileId: string): string {
  return profileStorageKey(profileId, "settings")
}

function metaKey(profileId: string): string {
  return profileStorageKey(profileId, "meta")
}

function getMeta(profileId: string): Meta {
  try {
    const raw = localStorage.getItem(metaKey(profileId))
    if (!raw) return { schemaVersion: 1, lastSavedAt: "" }
    return JSON.parse(raw) as Meta
  } catch {
    return { schemaVersion: 1, lastSavedAt: "" }
  }
}

function saveMeta(profileId: string, meta: Meta): void {
  try {
    localStorage.setItem(metaKey(profileId), JSON.stringify(meta))
  } catch { /* ignore */ }
}

/** Run migrations for the active profile. Call after initProfiles(). */
export function runMigrations(): void {
  if (typeof window === "undefined") return
  initProfiles()
  const profileId = requireProfileId()
  if (!profileId) return

  const meta = getMeta(profileId)
  let version = meta.schemaVersion

  if (version < 2) {
    try {
      const raw = localStorage.getItem(entriesKey(profileId))
      if (raw) {
        const entries = JSON.parse(raw) as Entry[]
        const migrated = entries.map((e) => ({
          ...e,
          wordCount:  e.wordCount  ?? e.rawText?.trim().split(/\s+/).filter(Boolean).length ?? 0,
          mediaIds:   Array.isArray(e.mediaIds) ? e.mediaIds : [],
          tags:       Array.isArray(e.tags)     ? e.tags     : [],
          favorite:   typeof e.favorite === "boolean" ? e.favorite : false,
        }))
        localStorage.setItem(entriesKey(profileId), JSON.stringify(migrated))
      }
    } catch { /* ignore */ }
    version = 2
  }

  if (version !== meta.schemaVersion) {
    saveMeta(profileId, { schemaVersion: version, lastSavedAt: new Date().toISOString() })
  }
}

function safeSetItem(key: string, value: string): { ok: boolean; error?: string } {
  try {
    localStorage.setItem(key, value)
    return { ok: true }
  } catch (e) {
    const isQuota = (e instanceof DOMException) && (
      e.name === "QuotaExceededError" ||
      e.name === "NS_ERROR_DOM_QUOTA_REACHED"
    )
    return {
      ok: false,
      error: isQuota
        ? "Storage quota exceeded. Please export and delete some older entries."
        : "Failed to save data.",
    }
  }
}

export function loadEntries(): Entry[] {
  if (typeof window === "undefined") return []
  const profileId = requireProfileId()
  if (!profileId) return []
  try {
    const raw = localStorage.getItem(entriesKey(profileId))
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed as Entry[]
  } catch {
    return []
  }
}

export function saveEntries(entries: Entry[]): void {
  if (typeof window === "undefined") return
  const profileId = requireProfileId()
  if (!profileId) return
  const result = safeSetItem(entriesKey(profileId), JSON.stringify(entries))
  if (!result.ok) {
    window.dispatchEvent(new CustomEvent("fairydiary:storage-error", {
      detail: { message: result.error, profileId },
    }))
    console.error("[storage] saveEntries failed:", result.error)
  }
}

export const DEFAULT_SETTINGS: AppSettings = {
  hasPIN: false,
  pinLength: 4,
  hasOnboarded: false,
  animationsEnabled: true,
  theme: "fairy-purple",
  streakDays: 0,
  longestStreak: 0,
  lastEntryDate: null,
  reminderEnabled: false,
  reminderTime: "20:00",
  biometricEnabled: false,
}

const ALLOWED_THEMES: AppSettings["theme"][] = [
  "fairy-purple", "rose-pink", "ocean-blue", "midnight-dark",
]

export function loadSettings(): AppSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS
  const profileId = requireProfileId()
  if (!profileId) return DEFAULT_SETTINGS
  try {
    const raw = localStorage.getItem(settingsKey(profileId))
    if (!raw) return DEFAULT_SETTINGS
    const parsed = JSON.parse(raw) as Partial<AppSettings> & { pinHash?: unknown }

    const { pinHash: _removed, ...safe } = parsed as { pinHash?: unknown } & Partial<AppSettings>
    void _removed

    const pinLength = safe.pinLength === 6 ? 6 : 4
    const theme     = ALLOWED_THEMES.includes(safe.theme as AppSettings["theme"])
      ? (safe.theme as AppSettings["theme"])
      : DEFAULT_SETTINGS.theme

    return {
      ...DEFAULT_SETTINGS,
      ...safe,
      pinLength,
      theme,
      hasPIN: typeof safe.hasPIN === "boolean" ? safe.hasPIN : false,
    }
  } catch {
    return DEFAULT_SETTINGS
  }
}

export function saveSettings(settings: AppSettings): void {
  if (typeof window === "undefined") return
  const profileId = requireProfileId()
  if (!profileId) return
  const { hasPIN: _skip, ...persisted } = settings as AppSettings & { pinHash?: unknown }
  void _skip
  safeSetItem(settingsKey(profileId), JSON.stringify(persisted))
}

export function clearActiveProfileData(): void {
  const profileId = requireProfileId()
  if (!profileId || typeof window === "undefined") return
  const keys = [
    entriesKey(profileId),
    settingsKey(profileId),
    metaKey(profileId),
    profileStorageKey(profileId, "pin_hash"),
    profileStorageKey(profileId, "pin_length"),
    profileStorageKey(profileId, "lock_state"),
    profileStorageKey(profileId, "biometric_id"),
  ]
  keys.forEach((k) => {
    try { localStorage.removeItem(k) } catch { /* ignore */ }
  })
  try { sessionStorage.removeItem(`fairy_p_${profileId}_session`) } catch { /* ignore */ }
}

function openDB(): Promise<IDBDatabase> {
  const profileId = requireProfileId()
  if (!profileId) return Promise.reject(new Error("No active profile"))
  const dbName = profileDbName(profileId)
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(dbName, 1)
    req.onerror = () => reject(req.error)
    req.onsuccess = () => resolve(req.result)
    req.onupgradeneeded = (ev) => {
      const db = (ev.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(MEDIA_STORE)) {
        db.createObjectStore(MEDIA_STORE, { keyPath: "id" })
      }
    }
  })
}

export async function saveMedia(media: Media): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(MEDIA_STORE, "readwrite")
    tx.objectStore(MEDIA_STORE).put(media)
    tx.oncomplete = () => resolve()
    tx.onerror    = () => reject(tx.error)
  })
}

export async function loadMedia(id: string): Promise<Media | null> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(MEDIA_STORE, "readonly")
    const req = tx.objectStore(MEDIA_STORE).get(id)
    req.onsuccess = () => resolve(req.result || null)
    req.onerror   = () => reject(req.error)
  })
}

export async function loadAllMedia(): Promise<Media[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(MEDIA_STORE, "readonly")
    const req = tx.objectStore(MEDIA_STORE).getAll()
    req.onsuccess = () => resolve(req.result || [])
    req.onerror   = () => reject(req.error)
  })
}

export async function deleteMedia(id: string): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(MEDIA_STORE, "readwrite")
    tx.objectStore(MEDIA_STORE).delete(id)
    tx.oncomplete = () => resolve()
    tx.onerror    = () => reject(tx.error)
  })
}

export async function clearAllMedia(): Promise<void> {
  const profileId = requireProfileId()
  if (!profileId) return
  try {
    const db = await openDB()
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(MEDIA_STORE, "readwrite")
      tx.objectStore(MEDIA_STORE).clear()
      tx.oncomplete = () => resolve()
      tx.onerror    = () => reject(tx.error)
    })
  } catch {
    // DB may not exist yet
  }
}

export async function deleteProfileMediaDb(profileId: string): Promise<void> {
  return new Promise((resolve) => {
    const req = indexedDB.deleteDatabase(profileDbName(profileId))
    req.onsuccess = () => resolve()
    req.onerror   = () => resolve()
    req.onblocked = () => resolve()
  })
}

export async function getStorageStats(entries: Entry[]): Promise<{
  entryCount:   number
  mediaCount:   number
  entriesBytes: number
  mediaBytes:   number
  totalBytes:   number
}> {
  const allMedia = await loadAllMedia().catch(() => [] as Media[])
  const entriesBytes = new Blob([JSON.stringify(entries)]).size
  const mediaBytes   = allMedia.reduce((s, m) => s + (m.size || 0), 0)
  return {
    entryCount:   entries.length,
    mediaCount:   allMedia.length,
    entriesBytes,
    mediaBytes,
    totalBytes:   entriesBytes + mediaBytes,
  }
}

export function getActiveEntriesStorageKey(): string | null {
  const profileId = requireProfileId()
  return profileId ? entriesKey(profileId) : null
}
