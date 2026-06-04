import { useAppStore } from "@/store/app-store"
import type { AppTheme } from "@/types"

export function useSettings() {
  const { settings, updateSettings } = useAppStore()

  const toggleAnimations = () => {
    updateSettings({ animationsEnabled: !settings.animationsEnabled })
  }

  const setDisplayName = (name: string) => {
    updateSettings({ displayName: name })
  }

  const setTheme = (theme: AppTheme) => {
    updateSettings({ theme })
  }

  return {
    settings,
    updateSettings,
    toggleAnimations,
    setDisplayName,
    setTheme,
  }
}
