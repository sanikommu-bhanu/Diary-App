"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAppStore } from "@/store/app-store"
import { FloatingParticles } from "@/components/ui/FloatingParticles"
import { PinLock } from "@/features/auth/PinLock"
import { applyTheme } from "@/lib/theme"

export default function LockPage() {
  const router = useRouter()
  const { hydrate, isHydrated, isLocked, settings, activeProfileId } = useAppStore()

  useEffect(() => { hydrate() }, [hydrate])

  useEffect(() => {
    if (!isHydrated) return
    applyTheme(settings.theme)
    if (!activeProfileId) { router.replace("/profiles"); return }
    if (!settings.hasOnboarded) { router.replace("/onboarding"); return }
    if (!isLocked) { router.replace("/home") }
  }, [isHydrated, isLocked, settings.hasOnboarded, settings.theme, activeProfileId, router])

  if (!isHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-4xl animate-pulse-soft" role="status" aria-label="Loading" aria-hidden="true">✨</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative">
      <FloatingParticles count={30} />
      <div className="relative z-10">
        <PinLock />
      </div>
    </div>
  )
}
