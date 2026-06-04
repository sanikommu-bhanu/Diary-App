"use client"

import { useEffect } from "react"
import { showToast } from "@/components/ui/Toast"

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return

    let refreshing = false

    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        // Check for updates periodically
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing
          if (!newWorker) return

          newWorker.addEventListener("statechange", () => {
            if (
              newWorker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              // New SW is ready — notify user
              showToast("App updated! Reload to get the latest version.", "info")
            }
          })
        })
      })
      .catch((err) => {
        if (process.env.NODE_ENV === "development") {
          console.warn("[SW] Registration failed:", err)
        }
      })

    // Auto-reload when SW activates (only once)
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (!refreshing) {
        refreshing = true
        window.location.reload()
      }
    })
  }, [])

  return null
}
