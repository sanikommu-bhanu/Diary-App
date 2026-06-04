"use client"

import { cn } from "@/lib/utils"
import { motion, type HTMLMotionProps } from "framer-motion"

interface MagicButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
  variant?: "primary" | "secondary" | "ghost" | "danger"
  size?: "sm" | "md" | "lg"
  loading?: boolean
  glow?: boolean
  children: React.ReactNode
}

export function MagicButton({
  variant = "primary",
  size = "md",
  loading = false,
  glow = false,
  className,
  children,
  disabled,
  type = "button",
  ...props
}: MagicButtonProps) {
  const base =
    "relative inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"

  const variants = {
    primary:
      "bg-fairy-button text-white shadow-button hover:shadow-button-hover hover:scale-[1.02] active:scale-[0.98]",
    secondary:
      "glass border border-fairy-border text-fairy-text hover:border-fairy-purple/40 hover:bg-fairy-purple/10",
    ghost:
      "text-fairy-text-muted hover:text-fairy-text hover:bg-white/5",
    danger:
      "bg-red-500/20 border border-red-500/30 text-red-300 hover:bg-red-500/30",
  }

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-5 py-2.5 text-sm",
    lg: "px-7 py-3.5 text-base",
  }

  return (
    <motion.button
      // eslint-disable-next-line react/button-has-type
      type={type}
      className={cn(
        base,
        variants[variant],
        sizes[size],
        glow && "animate-glow",
        className,
      )}
      whileTap={{ scale: 0.96 }}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <span className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        </span>
      )}
      <span className={cn(loading && "opacity-0")}>{children}</span>
      {loading && <span className="sr-only">Loading…</span>}
    </motion.button>
  )
}
