"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { Plus, ChevronRight, BookOpen } from "lucide-react"
import { useAppStore } from "@/store/app-store"
import { MagicButton } from "@/components/ui/MagicButton"
import { hasPIN } from "@/lib/auth"
import { cn } from "@/lib/utils"
import type { DiaryProfile } from "@/types"

export function ProfilePicker() {
  const router = useRouter()
  const { profiles, switchProfile } = useAppStore()
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState("")

  const openProfile = (profile: DiaryProfile) => {
    switchProfile(profile.id)
    const { settings } = useAppStore.getState()
    if (!settings.hasOnboarded) {
      router.replace("/onboarding")
      return
    }
    if (hasPIN()) {
      router.replace("/lock")
      return
    }
    router.replace("/home")
  }

  const handleAddDiary = () => {
    const name = newName.trim()
    if (!name) return
    const { addProfile } = useAppStore.getState()
    addProfile(name)
    setAdding(false)
    setNewName("")
    router.replace("/onboarding")
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm z-10 space-y-8">
        <div className="text-center">
          <motion.div
            className="text-6xl mb-4"
            animate={{ rotate: [0, 8, -8, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
            role="img"
            aria-label="Fairy"
          >
            🧚‍♀️
          </motion.div>
          <h1 className="font-display text-3xl font-bold gradient-text mb-2">Who&apos;s writing?</h1>
          <p className="text-fairy-text-muted text-sm leading-relaxed">
            Each diary is private with its own PIN and entries on this device.
          </p>
        </div>

        <div className="space-y-3" role="list" aria-label="Diary profiles">
          {profiles.map((profile, i) => (
            <motion.button
              key={profile.id}
              type="button"
              role="listitem"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              onClick={() => openProfile(profile)}
              className={cn(
                "w-full glass rounded-2xl p-4 border border-fairy-border/50",
                "flex items-center gap-4 hover:border-fairy-purple/40 hover:bg-fairy-purple/5 transition-all text-left",
              )}
            >
              <div className="w-12 h-12 rounded-xl bg-fairy-purple/20 flex items-center justify-center flex-shrink-0">
                <BookOpen size={22} className="text-fairy-purple" aria-hidden="true" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-display font-semibold text-fairy-text truncate">{profile.displayName}</p>
                <p className="text-xs text-fairy-text-muted/70 mt-0.5">
                  Tap to open · PIN protected
                </p>
              </div>
              <ChevronRight size={18} className="text-fairy-text-muted/50 flex-shrink-0" aria-hidden="true" />
            </motion.button>
          ))}
        </div>

        {adding ? (
          <div className="glass rounded-2xl p-4 border border-fairy-purple/30 space-y-3">
            <label htmlFor="new-diary-name" className="text-sm text-fairy-text font-medium block">
              Name this diary
            </label>
            <input
              id="new-diary-name"
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Work journal, Personal"
              maxLength={30}
              autoFocus
              className="w-full glass rounded-xl px-4 py-3 text-fairy-text placeholder-fairy-text-muted/40 focus:outline-none border border-fairy-border"
              onKeyDown={(e) => e.key === "Enter" && handleAddDiary()}
            />
            <div className="flex gap-2">
              <MagicButton variant="secondary" size="sm" className="flex-1" onClick={() => setAdding(false)}>
                Cancel
              </MagicButton>
              <MagicButton size="sm" className="flex-1" onClick={handleAddDiary} disabled={!newName.trim()}>
                Create
              </MagicButton>
            </div>
          </div>
        ) : (
          <MagicButton
            variant="secondary"
            size="lg"
            className="w-full"
            onClick={() => setAdding(true)}
          >
            <Plus size={18} aria-hidden="true" />
            Add another diary
          </MagicButton>
        )}

        <p className="text-[11px] text-fairy-text-muted/50 text-center leading-relaxed px-2">
          Forgot your PIN? Use &quot;Forgot PIN&quot; on the lock screen to reset that diary only.
          Your data stays on this device — we cannot recover a lost PIN online.
        </p>
      </div>
    </div>
  )
}
