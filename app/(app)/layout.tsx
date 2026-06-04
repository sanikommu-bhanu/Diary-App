"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAppStore } from "@/store/app-store"
import { BottomNav } from "@/components/layout/BottomNav"
import { FloatingParticles } from "@/components/ui/FloatingParticles"
import { ToastContainer } from "@/components/ui/Toast"
import { ErrorBoundary } from "@/components/ErrorBoundary"
import { refreshSession } from "@/lib/auth"
import { applyTheme } from "@/lib/theme"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { hydrate, isHydrated, isLocked, settings, activeProfileId, storageError, dismissStorageError } = useAppStore()
  const [showParticles, setShowParticles] = useState(false)

  useEffect(() => { hydrate() }, [hydrate])

  // Guard routes
  useEffect(() => {
    if (!isHydrated) return
    if (!activeProfileId)       { router.replace("/profiles"); return }
    if (!settings.hasOnboarded) { router.replace("/onboarding"); return }
    if (isLocked)               { router.replace("/lock"); return }
  }, [isHydrated, isLocked, settings.hasOnboarded, activeProfileId, router])

  // Theme
  useEffect(() => {
    if (!isHydrated) return
    applyTheme(settings.theme)
  }, [isHydrated, settings.theme])

  // Particles (idle callback for perf)
  useEffect(() => {
    if (!isHydrated || !settings.animationsEnabled) { setShowParticles(false); return }

    type WindowWithIdle = Window & {
      requestIdleCallback: (cb: () => void, opts?: { timeout: number }) => number
      cancelIdleCallback: (id: number) => void
    }
    const win = window as unknown as WindowWithIdle

    if (win.requestIdleCallback) {
      const id = win.requestIdleCallback(() => setShowParticles(true), { timeout: 700 })
      return () => win.cancelIdleCallback(id)
    }
    const t = window.setTimeout(() => setShowParticles(true), 350)
    return () => window.clearTimeout(t)
  }, [isHydrated, settings.animationsEnabled])

  // Refresh session on user activity
  useEffect(() => {
    const onActivity = () => refreshSession()
    window.addEventListener("click",   onActivity, { passive: true })
    window.addEventListener("keydown", onActivity, { passive: true })
    return () => {
      window.removeEventListener("click",   onActivity)
      window.removeEventListener("keydown", onActivity)
    }
  }, [])

  if (!isHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div
          className="flex flex-col items-center gap-3"
          role="status"
          aria-label="Loading your diary"
        >
          <div className="text-4xl animate-pulse-soft" aria-hidden="true">✨</div>
          <p className="text-fairy-text-muted text-sm">Loading your diary…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative">
      {showParticles && <FloatingParticles count={18} />}

      {/* Storage error banner */}
      {storageError && (
        <div
          className="fixed top-0 left-0 right-0 z-50 bg-red-500/90 text-white text-sm px-4 py-3 flex items-center justify-between"
          role="alert"
          aria-live="assertive"
        >
          <span>⚠️ {storageError}</span>
          <button
            type="button"
            onClick={dismissStorageError}
            className="ml-4 underline text-white/80 hover:text-white"
            aria-label="Dismiss storage error"
          >
            Dismiss
          </button>
        </div>
      )}

      <ErrorBoundary>
        <div className="relative z-10 pb-24">
          {children}
        </div>
      </ErrorBoundary>

      <BottomNav />
      <ToastContainer />
    </div>
  )
}
