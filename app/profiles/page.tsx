"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { FloatingParticles } from "@/components/ui/FloatingParticles"
import { ProfilePicker } from "@/features/auth/ProfilePicker"
import { useAppStore } from "@/store/app-store"
export default function ProfilesPage() {
  const router = useRouter()
  const { hydrate, isHydrated, profiles } = useAppStore()

  useEffect(() => { hydrate() }, [hydrate])

  useEffect(() => {
    if (!isHydrated) return
    if (profiles.length === 0) {
      router.replace("/onboarding")
    }
  }, [isHydrated, profiles.length, router])

  if (!isHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-4xl animate-pulse-soft" role="status" aria-label="Loading">✨</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative">
      <FloatingParticles count={35} />
      <div className="relative z-10">
        <ProfilePicker />
      </div>
    </div>
  )
}
