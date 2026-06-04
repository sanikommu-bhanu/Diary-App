"use client"

import { create } from "zustand"
import { subscribeWithSelector } from "zustand/middleware"
import type { Entry, AppSettings, Mood, DiaryProfile } from "@/types"
import {
  loadEntries, saveEntries, loadSettings, saveSettings, runMigrations,
  deleteProfileMediaDb, DEFAULT_SETTINGS,
} from "@/lib/storage"
import { generateId, calculateStreak } from "@/lib/utils"
import {
  isSessionValid, destroySession, hasPIN, getPINLength,
} from "@/lib/auth"
import {
  initProfiles,
  listProfiles,
  getActiveProfileId,
  getActiveProfile,
  createProfile,
  updateProfileDisplayName,
  clearProfileStorage,
} from "@/lib/profiles"
import { switchToProfile, resetProfileAfterForgotPin, deleteProfileFully } from "@/lib/profile-actions"

interface AppState {
  entries:  Entry[]
  settings: AppSettings
  profiles: DiaryProfile[]
  activeProfileId: string | null
  isLocked:    boolean
  isHydrated:  boolean
  currentMood: Mood | null
  selectedEntryId: string | null
  storageError: string | null
  hydrate: () => void
  reloadActiveProfile: () => void
  lock:    () => void
  unlock:  () => void
  switchProfile: (profileId: string) => void
  addProfile: (displayName: string) => DiaryProfile
  forgotPinReset: (profileId: string) => Promise<void>
  removeProfile: (profileId: string) => Promise<void>
  addEntry:       (data: Omit<Entry, "id" | "createdAt" | "updatedAt">) => Entry
  updateEntry:    (id: string, data: Partial<Entry>) => void
  deleteEntry:    (id: string) => void
  toggleFavorite: (id: string) => void
  updateSettings: (data: Partial<AppSettings>) => void
  clearAllData:   () => void
  setCurrentMood:    (mood: Mood | null) => void
  setSelectedEntry:  (id: string | null) => void
  dismissStorageError: () => void
}

function loadProfileState() {
  const entries       = loadEntries()
  const settings      = loadSettings()
  const sessionValid  = isSessionValid()
  const pinExists     = hasPIN()
  const pinLength     = getPINLength()
  const needsLock     = settings.hasOnboarded && pinExists && !sessionValid

  const streakInfo = calculateStreak(entries)
  const updatedSettings: AppSettings = {
    ...settings,
    hasPIN: pinExists,
    pinLength,
    streakDays:    streakInfo.current,
    longestStreak: streakInfo.longest,
  }

  return {
    entries,
    settings: updatedSettings,
    isLocked: needsLock,
  }
}

export const useAppStore = create<AppState>()(
  subscribeWithSelector((set, get) => ({
    entries:  [],
    settings: DEFAULT_SETTINGS,
    profiles: [],
    activeProfileId: null,
    isLocked:    true,
    isHydrated:  false,
    currentMood: null,
    selectedEntryId: null,
    storageError: null,

    hydrate: () => {
      if (get().isHydrated) return

      initProfiles()
      runMigrations()

      const profiles = listProfiles()
      const activeProfileId = getActiveProfileId()
      const profileState = activeProfileId ? loadProfileState() : {
        entries: [] as Entry[],
        settings: DEFAULT_SETTINGS,
        isLocked: true,
      }

      set({
        profiles,
        activeProfileId,
        ...profileState,
        isHydrated: true,
      })

      if (typeof window !== "undefined") {
        window.addEventListener("storage", handleStorageEvent)
        window.addEventListener("fairydiary:storage-error", handleStorageError as EventListener)
      }
    },

    reloadActiveProfile: () => {
      const profiles = listProfiles()
      const activeProfileId = getActiveProfileId()
      if (!activeProfileId) {
        set({ profiles, activeProfileId: null, entries: [], settings: DEFAULT_SETTINGS, isLocked: true })
        return
      }
      set({ profiles, activeProfileId, ...loadProfileState() })
    },

    lock: () => {
      destroySession()
      set({ isLocked: true })
    },

    unlock: () => {
      set({ isLocked: false })
    },

    switchProfile: (profileId) => {
      switchToProfile(profileId)
      get().reloadActiveProfile()
    },

    addProfile: (displayName) => {
      const profile = createProfile(displayName)
      saveSettings({ ...DEFAULT_SETTINGS, hasOnboarded: false, hasPIN: false })
      set({
        profiles: listProfiles(),
        activeProfileId: profile.id,
        entries: [],
        settings: DEFAULT_SETTINGS,
        isLocked: false,
      })
      return profile
    },

    forgotPinReset: async (profileId) => {
      await resetProfileAfterForgotPin(profileId)
      get().reloadActiveProfile()
    },

    removeProfile: async (profileId) => {
      await deleteProfileFully(profileId)
      get().reloadActiveProfile()
      set({ profiles: listProfiles(), activeProfileId: getActiveProfileId() })
    },

    addEntry: (data) => {
      const now = new Date().toISOString()
      const entry: Entry = {
        ...data,
        id:        generateId(),
        createdAt: now,
        updatedAt: now,
        wordCount: data.rawText?.trim().split(/\s+/).filter(Boolean).length ?? 0,
      }
      const entries = [entry, ...get().entries]
      saveEntries(entries)

      const streakInfo = calculateStreak(entries)
      const settings: AppSettings = {
        ...get().settings,
        streakDays:    streakInfo.current,
        longestStreak: streakInfo.longest,
        lastEntryDate: now.slice(0, 10),
      }
      saveSettings(settings)
      set({ entries, settings })
      return entry
    },

    updateEntry: (id, data) => {
      const entries = get().entries.map((e) =>
        e.id === id
          ? { ...e, ...data, updatedAt: new Date().toISOString(),
              wordCount: (data.rawText ?? e.rawText)?.trim().split(/\s+/).filter(Boolean).length ?? 0 }
          : e,
      )
      saveEntries(entries)
      set({ entries })
    },

    deleteEntry: (id) => {
      const entries = get().entries.filter((e) => e.id !== id)
      saveEntries(entries)
      set({ entries })
    },

    toggleFavorite: (id) => {
      const entries = get().entries.map((e) =>
        e.id === id
          ? { ...e, favorite: !e.favorite, updatedAt: new Date().toISOString() }
          : e,
      )
      saveEntries(entries)
      set({ entries })
    },

    updateSettings: (data) => {
      const settings = { ...get().settings, ...data }
      saveSettings(settings)
      const active = getActiveProfile()
      if (active && data.displayName !== undefined) {
        updateProfileDisplayName(active.id, data.displayName)
        set({ settings, profiles: listProfiles() })
      } else {
        set({ settings })
      }
    },

    clearAllData: () => {
      if (typeof window === "undefined") return
      const all = listProfiles()
      all.forEach((p) => clearProfileStorage(p.id))
      void Promise.all(all.map((p) => deleteProfileMediaDb(p.id)))
      localStorage.removeItem("fairy_profiles")
      sessionStorage.clear()
      set({
        entries: [],
        settings: DEFAULT_SETTINGS,
        profiles: [],
        activeProfileId: null,
        isLocked: true,
      })
    },

    setCurrentMood:    (mood) => set({ currentMood: mood }),
    setSelectedEntry:  (id)   => set({ selectedEntryId: id }),
    dismissStorageError: ()   => set({ storageError: null }),
  })),
)

function handleStorageEvent(e: StorageEvent): void {
  const activeId = getActiveProfileId()
  if (!activeId) return
  const entriesKey = `fairy_p_${activeId}_entries`
  const pinKey = `fairy_p_${activeId}_pin_hash`

  if (e.key === entriesKey && e.newValue) {
    try {
      const entries = JSON.parse(e.newValue) as Entry[]
      if (Array.isArray(entries)) {
        useAppStore.setState({ entries })
      }
    } catch { /* ignore */ }
  }
  if (e.key === pinKey) {
    const pinExists = !!e.newValue
    useAppStore.setState((s) => ({
      settings: { ...s.settings, hasPIN: pinExists },
    }))
  }
  if (e.key === "fairy_profiles") {
    useAppStore.setState({ profiles: listProfiles(), activeProfileId: getActiveProfileId() })
  }
}

function handleStorageError(e: CustomEvent<{ message: string }>): void {
  useAppStore.setState({ storageError: e.detail?.message ?? "Storage error" })
}
