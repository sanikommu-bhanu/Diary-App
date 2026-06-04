"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion } from "framer-motion"
import { Home, PenLine, List, BarChart2, Settings } from "lucide-react"
import { cn } from "@/lib/utils"

const NAV_ITEMS = [
  { href: "/home",     icon: Home,     label: "Home"     },
  { href: "/timeline", icon: List,     label: "Timeline" },
  { href: "/write",    icon: PenLine,  label: "Write",   isAction: true },
  { href: "/insights", icon: BarChart2,label: "Insights" },
  { href: "/settings", icon: Settings, label: "Settings" },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40"
      aria-label="Main navigation"
    >
      <div className="glass-dark border-t border-fairy-border bottom-nav">
        <div className="flex items-center justify-around px-2 pt-2" role="list">
          {NAV_ITEMS.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href === "/insights" && pathname === "/calendar")
            const Icon = item.icon

            if (item.isAction) {
              return (
                <div key={item.href} role="listitem">
                  <Link
                    href={item.href}
                    className="relative -mt-5 block"
                    aria-label="Write new entry"
                    aria-current={isActive ? "page" : undefined}
                  >
                    <motion.div
                      className={cn(
                        "w-14 h-14 rounded-2xl bg-fairy-button shadow-button flex items-center justify-center",
                        isActive && "ring-2 ring-fairy-purple ring-offset-1 ring-offset-transparent",
                      )}
                      whileHover={{ scale: 1.08 }}
                      whileTap={{ scale: 0.92 }}
                    >
                      <Icon size={24} className="text-white" strokeWidth={2} aria-hidden="true" />
                      <span className="absolute -top-1 -right-1 text-xs animate-sparkle pointer-events-none" aria-hidden="true">✨</span>
                    </motion.div>
                    <p className="text-[10px] text-center mt-1 text-fairy-text-muted" aria-hidden="true">
                      {item.label}
                    </p>
                  </Link>
                </div>
              )
            }

            return (
              <div key={item.href} role="listitem">
                <Link
                  href={item.href}
                  aria-label={item.label}
                  aria-current={isActive ? "page" : undefined}
                  className="flex flex-col items-center gap-1 py-1 px-3 min-w-[60px]"
                >
                  <motion.div
                    className={cn(
                      "relative flex items-center justify-center w-8 h-8 rounded-xl transition-colors duration-200",
                      isActive ? "bg-fairy-purple/20" : "",
                    )}
                    whileTap={{ scale: 0.85 }}
                  >
                    <Icon
                      size={20}
                      className={cn(
                        "transition-colors duration-200",
                        isActive ? "text-fairy-purple" : "text-fairy-text-muted",
                      )}
                      strokeWidth={isActive ? 2.5 : 2}
                      aria-hidden="true"
                    />
                    {isActive && (
                      <motion.div
                        layoutId="nav-indicator"
                        className="absolute inset-0 rounded-xl bg-fairy-purple/20"
                        transition={{ type: "spring", stiffness: 500, damping: 40 }}
                        aria-hidden="true"
                      />
                    )}
                  </motion.div>
                  <span
                    className={cn(
                      "text-[10px] transition-colors duration-200",
                      isActive ? "text-fairy-purple font-medium" : "text-fairy-text-muted",
                    )}
                    aria-hidden="true"
                  >
                    {item.label}
                  </span>
                </Link>
              </div>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
