/**
 * Central routing rules after hydration.
 */
import { listProfiles, getActiveProfileId } from "@/lib/profiles"
import { loadSettings } from "@/lib/storage"
import { hasPIN, isSessionValid } from "@/lib/auth"

export type AppRoute =
  | "/profiles"
  | "/onboarding"
  | "/lock"
  | "/home"

export function resolveAppRoute(): AppRoute {
  const profiles = listProfiles()
  if (profiles.length === 0) return "/onboarding"

  const activeId = getActiveProfileId()
  if (!activeId) return "/profiles"

  const settings = loadSettings()
  if (!settings.hasOnboarded) return "/onboarding"

  const pinExists = hasPIN()
  if (pinExists && !isSessionValid()) return "/lock"

  return "/home"
}
