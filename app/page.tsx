"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAppStore } from "@/store/app-store"
import { resolveAppRoute } from "@/lib/routing"

export default function RootPage() {
  const router = useRouter()
  const { hydrate, isHydrated } = useAppStore()

  useEffect(() => { hydrate() }, [hydrate])

  useEffect(() => {
    if (!isHydrated) return
    router.replace(resolveAppRoute())
  }, [isHydrated, router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4" role="status" aria-label="Loading">
        <div className="text-5xl animate-pulse-soft" aria-hidden="true">✨</div>
        <p className="text-fairy-text-muted text-sm">Loading your diary…</p>
      </div>
    </div>
  )
}
