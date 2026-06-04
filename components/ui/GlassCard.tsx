"use client"

import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import type { HTMLMotionProps } from "framer-motion"

interface GlassCardProps extends HTMLMotionProps<"div"> {
  glow?: boolean
  hover?: boolean
  className?: string
  children: React.ReactNode
}

export function GlassCard({
  glow = false,
  hover = false,
  className,
  children,
  ...props
}: GlassCardProps) {
  return (
    <motion.div
      className={cn(
        "glass rounded-2xl p-4",
        glow && "fairy-glow",
        hover && "cursor-pointer",
        className
      )}
      whileHover={hover ? { scale: 1.01, y: -2 } : undefined}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      {...props}
    >
      {children}
    </motion.div>
  )
}
