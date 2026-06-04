/** @type {import('next').NextConfig} */
const isDev = process.env.NODE_ENV === "development"

const cspDirectives = {
  "default-src":     ["'self'"],
  "script-src":      ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
  "style-src":       ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
  "font-src":        ["'self'", "https://fonts.gstatic.com"],
  "img-src":         ["'self'", "data:", "blob:"],
  "connect-src":     ["'self'", "https://openrouter.ai", "https://fonts.googleapis.com"],
  "media-src":       ["'self'", "blob:"],
  "worker-src":      ["'self'", "blob:"],
  "frame-ancestors": ["'none'"],
  "object-src":      ["'none'"],
  "base-uri":        ["'self'"],
  "form-action":     ["'self'"],
  "report-uri":      ["/api/csp-report"],
}

const csp = Object.entries(cspDirectives)
  .map(([k, v]) => `${k} ${v.join(" ")}`)
  .join("; ")

const securityHeaders = [
  { key: "X-Frame-Options",              value: "DENY" },
  { key: "X-Content-Type-Options",       value: "nosniff" },
  { key: "Referrer-Policy",              value: "strict-origin-when-cross-origin" },
  { key: "X-DNS-Prefetch-Control",       value: "on" },
  { key: "Permissions-Policy",           value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), bluetooth=()" },
  { key: "Strict-Transport-Security",    value: "max-age=63072000; includeSubDomains; preload" },
  { key: "Content-Security-Policy",      value: isDev ? "" : csp },
  { key: "Cross-Origin-Opener-Policy",   value: "same-origin" },
  { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
].filter(h => h.value !== "")

const nextConfig = {
  reactStrictMode: true,
  eslint:     { ignoreDuringBuilds: false },
  typescript: { ignoreBuildErrors: false },
  images: {
    contentDispositionType: "attachment",
    contentSecurityPolicy:  "default-src 'self'; script-src 'none'; sandbox;",
  },
  async headers() {
    return [
      { source: "/(.*)", headers: securityHeaders },
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control",          value: "no-cache, no-store, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
      {
        source: "/_next/static/(.*)",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      {
        source: "/api/health",
        headers: [{ key: "Cache-Control", value: "no-store" }],
      },
    ]
  },
}

module.exports = nextConfig
