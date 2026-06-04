import type { Metadata, Viewport } from "next"
import "./globals.css"
import { ServiceWorkerRegistration } from "@/components/ui/ServiceWorkerRegistration"
import { ErrorBoundary } from "@/components/ErrorBoundary"
import { SkipNav } from "@/components/ui/SkipNav"

export const metadata: Metadata = {
  title: "FairyDiary — Your Magical Journal",
  description: "A magical, private, emotionally intelligent digital diary",
  keywords: ["diary", "journal", "private", "magical", "ai writing"],
  authors: [{ name: "FairyDiary" }],
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "FairyDiary" },
  icons: { icon: "/icons/icon-512.svg", apple: "/icons/icon-512.svg" },
  robots: { index: false, follow: false },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#c084fc",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Inter:wght@300;400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        <SkipNav />
        <ServiceWorkerRegistration />
        <ErrorBoundary>
          <main id="main-content" tabIndex={-1}>
            {children}
          </main>
        </ErrorBoundary>
      </body>
    </html>
  )
}
