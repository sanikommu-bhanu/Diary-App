/**
 * FairyDiary Service Worker
 * - Stale-while-revalidate for pages
 * - Cache-first for static assets
 * - Never cache API routes or auth pages
 */

const CACHE_VERSION = "fairydiary-v2"
const STATIC_ASSETS = [
  "/",
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
]

const NEVER_CACHE = [
  "/api/",
  "/lock",
  "/onboarding",
]

function shouldSkipCache(url) {
  return NEVER_CACHE.some(path => url.includes(path))
}

// ─── Install ──────────────────────────────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting()),
  )
})

// ─── Activate ─────────────────────────────────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k !== CACHE_VERSION)
            .map((k) => caches.delete(k)),
        ),
      )
      .then(() => {
        self.clients.claim()
        // Notify open tabs that a new SW has taken over
        self.clients.matchAll({ type: "window" }).then((clients) => {
          clients.forEach((client) =>
            client.postMessage({ type: "SW_ACTIVATED", version: CACHE_VERSION }),
          )
        })
      }),
  )
})

// ─── Fetch ────────────────────────────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return
  if (shouldSkipCache(event.request.url)) return  // pass-through

  // Static assets — cache-first
  if (event.request.url.includes("/_next/static/")) {
    event.respondWith(
      caches.match(event.request).then(
        (cached) => cached ?? fetch(event.request).then((res) => {
          if (res.ok) {
            const clone = res.clone()
            caches.open(CACHE_VERSION).then((c) => c.put(event.request, clone))
          }
          return res
        }),
      ),
    )
    return
  }

  // Pages — stale-while-revalidate
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const network = fetch(event.request)
        .then((response) => {
          if (response.ok && response.status < 400) {
            const clone = response.clone()
            caches.open(CACHE_VERSION).then((c) => c.put(event.request, clone))
          }
          return response
        })
        .catch(() => cached)
      return cached ?? network
    }),
  )
})
