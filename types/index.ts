export type Mood = 'happy' | 'sad' | 'calm' | 'angry' | 'dreamy' | 'romantic' | 'neutral'

export type Weather = 'sunny' | 'cloudy' | 'rainy' | 'snowy' | 'windy' | 'stormy' | 'foggy'

export type AIMode =
  | 'rewrite'
  | 'fairy'
  | 'poetic'
  | 'calm'
  | 'mature'
  | 'minimal'
  | 'title'
  | 'mood'
  | 'reflection'

export interface Entry {
  id: string
  title: string
  rawText: string
  enhancedText?: string
  mood: Mood
  tags: string[]
  weather?: Weather
  gratitude?: string
  favorite: boolean
  createdAt: string
  updatedAt: string
  mediaIds: string[]
  isDraft?: boolean
  wordCount?: number
}

export interface Media {
  id: string
  type: 'image' | 'video'
  dataUrl: string
  name: string
  size: number
  createdAt: string
}

export type AppTheme = 'fairy-purple' | 'rose-pink' | 'ocean-blue' | 'midnight-dark'
export type PinLength = 4 | 6

/** A local diary profile (one person’s private journal on this device). */
export interface DiaryProfile {
  id: string
  displayName: string
  createdAt: string
}

export interface AppSettings {
  /**
   * Whether a PIN is currently set.
   * NOT the actual hash — that lives exclusively in auth.ts / localStorage "fairy_pin_hash".
   * This field is derived at runtime and never persisted to settings storage.
   */
  hasPIN: boolean
  /** @deprecated alias kept temporarily for migration — use hasPIN */
  pinHash?: null
  pinLength: PinLength
  hasOnboarded: boolean
  animationsEnabled: boolean
  theme: AppTheme
  streakDays: number
  longestStreak: number
  lastEntryDate: string | null
  displayName?: string
  reminderEnabled: boolean
  reminderTime?: string
  biometricEnabled?: boolean
}

export interface DailyMood {
  date: string
  mood: Mood
  entryCount: number
}

export interface WeekSummary {
  weekStart: string
  weekEnd: string
  entryCount: number
  moods: Record<Mood, number>
  totalWords: number
  topTags: string[]
}

export interface AIRequest {
  text: string
  mode: AIMode
  context?: string
}

export interface AIResponse {
  result: string
  mode: AIMode
  tokensUsed?: number
}

export interface StreakInfo {
  current: number
  longest: number
  isActive: boolean
  lastEntry: string | null
}

export const MOOD_CONFIG: Record<Mood, { emoji: string; label: string; color: string; bg: string; gradient: string }> = {
  happy: {
    emoji: '🌟',
    label: 'Happy',
    color: '#fbbf24',
    bg: 'rgba(251,191,36,0.15)',
    gradient: 'from-amber-400/20 to-yellow-300/10',
  },
  sad: {
    emoji: '🌧️',
    label: 'Sad',
    color: '#60a5fa',
    bg: 'rgba(96,165,250,0.15)',
    gradient: 'from-blue-400/20 to-sky-300/10',
  },
  calm: {
    emoji: '🌿',
    label: 'Calm',
    color: '#34d399',
    bg: 'rgba(52,211,153,0.15)',
    gradient: 'from-emerald-400/20 to-teal-300/10',
  },
  angry: {
    emoji: '🌹',
    label: 'Fierce',
    color: '#f87171',
    bg: 'rgba(248,113,113,0.15)',
    gradient: 'from-red-400/20 to-rose-300/10',
  },
  dreamy: {
    emoji: '✨',
    label: 'Dreamy',
    color: '#a78bfa',
    bg: 'rgba(167,139,250,0.15)',
    gradient: 'from-violet-400/20 to-purple-300/10',
  },
  romantic: {
    emoji: '🌸',
    label: 'Romantic',
    color: '#f472b6',
    bg: 'rgba(244,114,182,0.15)',
    gradient: 'from-pink-400/20 to-rose-300/10',
  },
  neutral: {
    emoji: '🌙',
    label: 'Neutral',
    color: '#9ca3af',
    bg: 'rgba(156,163,175,0.15)',
    gradient: 'from-gray-400/20 to-slate-300/10',
  },
}

export const WEATHER_CONFIG: Record<Weather, { emoji: string; label: string }> = {
  sunny:  { emoji: '☀️',  label: 'Sunny'  },
  cloudy: { emoji: '☁️',  label: 'Cloudy' },
  rainy:  { emoji: '🌧️', label: 'Rainy'  },
  snowy:  { emoji: '❄️',  label: 'Snowy'  },
  windy:  { emoji: '💨',  label: 'Windy'  },
  stormy: { emoji: '⛈️', label: 'Stormy' },
  foggy:  { emoji: '🌫️', label: 'Foggy'  },
}
