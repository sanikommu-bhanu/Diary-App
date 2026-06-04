/**
 * lib/profiles.ts — Multi-profile registry (free, local-only)
 *
 * Each profile has isolated entries, settings, PIN, session, and IndexedDB media.
 * Legacy single-user data is migrated automatically on first load.
 */
import { generateId } from "@/lib/utils"
import type { DiaryProfile } from "@/types"

const REGISTRY_KEY = "fairy_profiles"

const LEGACY_KEYS = [
  "fairy_entries",
  "fairy_settings",
  "fairy_meta",
  "fairy_pin_hash",
  "fairy_pin_length",
  "fairy_lock_state",
] as const

export type ProfileStorageSuffix =
  | "entries"
  | "settings"
  | "meta"
  | "pin_hash"
  | "pin_length"
  | "lock_state"
  | "biometric_id"

interface ProfileRegistry {
  version: 1
  activeProfileId: string | null
  profiles: DiaryProfile[]
}

let activeProfileId: string | null = null

function loadRegistry(): ProfileRegistry {
  if (typeof window === "undefined") {
    return { version: 1, activeProfileId: null, profiles: [] }
  }
  try {
    const raw = localStorage.getItem(REGISTRY_KEY)
    if (!raw) return { version: 1, activeProfileId: null, profiles: [] }
    const parsed = JSON.parse(raw) as Partial<ProfileRegistry>
    return {
      version: 1,
      activeProfileId: typeof parsed.activeProfileId === "string" ? parsed.activeProfileId : null,
      profiles: Array.isArray(parsed.profiles) ? parsed.profiles : [],
    }
  } catch {
    return { version: 1, activeProfileId: null, profiles: [] }
  }
}

function saveRegistry(registry: ProfileRegistry): void {
  if (typeof window === "undefined") return
  localStorage.setItem(REGISTRY_KEY, JSON.stringify(registry))
}

export function profileStorageKey(profileId: string, suffix: ProfileStorageSuffix): string {
  return `fairy_p_${profileId}_${suffix}`
}

export function getActiveProfileId(): string | null {
  return activeProfileId
}

export function setActiveProfileId(profileId: string | null): void {
  activeProfileId = profileId
  const registry = loadRegistry()
  registry.activeProfileId = profileId
  saveRegistry(registry)
}

export function listProfiles(): DiaryProfile[] {
  return loadRegistry().profiles
}

export function getActiveProfile(): DiaryProfile | null {
  const id = getActiveProfileId()
  if (!id) return null
  return listProfiles().find((p) => p.id === id) ?? null
}

export function getProfileById(id: string): DiaryProfile | null {
  return listProfiles().find((p) => p.id === id) ?? null
}

export function updateProfileDisplayName(profileId: string, displayName: string): void {
  const registry = loadRegistry()
  const profile = registry.profiles.find((p) => p.id === profileId)
  if (!profile) return
  profile.displayName = displayName.trim() || profile.displayName
  saveRegistry(registry)
}

export function createProfile(displayName: string): DiaryProfile {
  const profile: DiaryProfile = {
    id: generateId(),
    displayName: displayName.trim() || "My Diary",
    createdAt: new Date().toISOString(),
  }
  const registry = loadRegistry()
  registry.profiles.push(profile)
  saveRegistry(registry)
  setActiveProfileId(profile.id)
  return profile
}

export function removeProfileFromRegistry(profileId: string): void {
  const registry = loadRegistry()
  registry.profiles = registry.profiles.filter((p) => p.id !== profileId)
  if (registry.activeProfileId === profileId) {
    registry.activeProfileId = registry.profiles[0]?.id ?? null
    activeProfileId = registry.activeProfileId
  }
  saveRegistry(registry)
}

/** Move legacy global keys into the first profile. */
export function migrateLegacyToProfiles(): void {
  if (typeof window === "undefined") return
  const registry = loadRegistry()
  if (registry.profiles.length > 0) {
    activeProfileId = registry.activeProfileId ?? registry.profiles[0]?.id ?? null
    return
  }

  const hasLegacy =
    LEGACY_KEYS.some((k) => localStorage.getItem(k) !== null)

  if (!hasLegacy) {
    activeProfileId = null
    return
  }

  let displayName = "My Diary"
  try {
    const settingsRaw = localStorage.getItem("fairy_settings")
    if (settingsRaw) {
      const s = JSON.parse(settingsRaw) as { displayName?: string }
      if (s.displayName?.trim()) displayName = s.displayName.trim()
    }
  } catch { /* ignore */ }

  const profileId = generateId()
  const profile: DiaryProfile = {
    id: profileId,
    displayName,
    createdAt: new Date().toISOString(),
  }

  const suffixMap: Record<(typeof LEGACY_KEYS)[number], ProfileStorageSuffix | null> = {
    fairy_entries:     "entries",
    fairy_settings:    "settings",
    fairy_meta:        "meta",
    fairy_pin_hash:    "pin_hash",
    fairy_pin_length:  "pin_length",
    fairy_lock_state:  "lock_state",
  }

  for (const legacyKey of LEGACY_KEYS) {
    const value = localStorage.getItem(legacyKey)
    if (value === null) continue
    const suffix = suffixMap[legacyKey]
    if (suffix) {
      localStorage.setItem(profileStorageKey(profileId, suffix), value)
    }
    localStorage.removeItem(legacyKey)
  }

  const legacyBio = localStorage.getItem("fairy_biometric_id")
  if (legacyBio) {
    localStorage.setItem(profileStorageKey(profileId, "biometric_id"), legacyBio)
    localStorage.removeItem("fairy_biometric_id")
  }

  try {
    sessionStorage.removeItem("fairy_session")
  } catch { /* ignore */ }

  saveRegistry({
    version: 1,
    activeProfileId: profileId,
    profiles: [profile],
  })
  activeProfileId = profileId
}

export function initProfiles(): void {
  migrateLegacyToProfiles()
  const registry = loadRegistry()
  activeProfileId = registry.activeProfileId
}

/** Remove all data for one profile (forgot PIN / delete profile). */
export function clearProfileStorage(profileId: string): void {
  if (typeof window === "undefined") return

  const suffixes: ProfileStorageSuffix[] = [
    "entries", "settings", "meta", "pin_hash", "pin_length", "lock_state", "biometric_id",
  ]
  suffixes.forEach((s) => {
    try { localStorage.removeItem(profileStorageKey(profileId, s)) } catch { /* ignore */ }
  })

  try {
    sessionStorage.removeItem(`fairy_p_${profileId}_session`)
  } catch { /* ignore */ }

  try { sessionStorage.removeItem("fairy_session") } catch { /* ignore */ }
}

export function profileDbName(profileId: string): string {
  return `fairydiary_db_${profileId}`
}
