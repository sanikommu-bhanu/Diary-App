import type { AppTheme } from "@/types"

export const THEME_OPTIONS: Array<{ id: AppTheme; name: string; description: string; emoji: string }> = [
  {
    id: "fairy-purple",
    name: "Fairy Purple",
    description: "Magical violet glow",
    emoji: "🧚",
  },
  {
    id: "rose-pink",
    name: "Rose Pink",
    description: "Warm and romantic bloom",
    emoji: "🌹",
  },
  {
    id: "ocean-blue",
    name: "Ocean Blue",
    description: "Calm, airy, and focused",
    emoji: "🌊",
  },
  {
    id: "midnight-dark",
    name: "Midnight Dark",
    description: "Deep low-light comfort",
    emoji: "🌙",
  },
]

export function applyTheme(theme: AppTheme): void {
  if (typeof document === "undefined") return
  document.documentElement.setAttribute("data-theme", theme)
}
