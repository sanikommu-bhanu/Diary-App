/**
 * Profile lifecycle: switch, reset (forgot PIN), delete.
 */
import {
  clearProfileStorage,
  removeProfileFromRegistry,
  setActiveProfileId,
  getActiveProfileId,
  listProfiles,
  updateProfileDisplayName,
} from "@/lib/profiles"
import {
  clearActiveProfileData,
  deleteProfileMediaDb,
  saveSettings,
  DEFAULT_SETTINGS,
} from "@/lib/storage"
import { destroySession } from "@/lib/auth"

/** Forgot PIN — wipes this profile’s diary and PIN (no insecure unlock). */
export async function resetProfileAfterForgotPin(profileId: string): Promise<void> {
  setActiveProfileId(profileId)
  destroySession()
  clearProfileStorage(profileId)
  await deleteProfileMediaDb(profileId)
  saveSettings({ ...DEFAULT_SETTINGS, hasOnboarded: false, hasPIN: false })
}

/** Remove profile and all its data from this device. */
export async function deleteProfileFully(profileId: string): Promise<void> {
  destroySession()
  clearProfileStorage(profileId)
  await deleteProfileMediaDb(profileId)
  removeProfileFromRegistry(profileId)
  const remaining = listProfiles()
  if (remaining.length > 0 && getActiveProfileId() === null) {
    setActiveProfileId(remaining[0].id)
  }
}

export function switchToProfile(profileId: string): void {
  destroySession()
  setActiveProfileId(profileId)
}
