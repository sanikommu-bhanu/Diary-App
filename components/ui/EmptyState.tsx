"use client"
import { motion } from "framer-motion"
import Link from "next/link"
import { MagicButton } from "@/components/ui/MagicButton"

interface EmptyStateProps {
  emoji:       string
  title:       string
  description: string
  action?:     { label: string; href?: string; onClick?: () => void }
  compact?:    boolean
}

export function EmptyState({ emoji, title, description, action, compact }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`flex flex-col items-center text-center ${compact ? "py-10" : "py-16"}`}
      role="status"
      aria-label={title}
    >
      <motion.div
        className={`${compact ? "text-5xl mb-3" : "text-7xl mb-5"} select-none`}
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        aria-hidden="true"
      >
        {emoji}
      </motion.div>
      <h3 className={`font-display font-bold text-fairy-text mb-2 ${compact ? "text-lg" : "text-xl"}`}>
        {title}
      </h3>
      <p className="text-fairy-text-muted text-sm max-w-xs mx-auto leading-relaxed mb-6">
        {description}
      </p>
      {action && (
        action.href ? (
          <Link href={action.href}>
            <MagicButton glow size={compact ? "sm" : "md"}>{action.label}</MagicButton>
          </Link>
        ) : (
          <MagicButton glow size={compact ? "sm" : "md"} onClick={action.onClick}>
            {action.label}
          </MagicButton>
        )
      )}
    </motion.div>
  )
}
