"use client"

import { cn } from "@/lib/utils"

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg"
  className?: string
}

export function LoadingSpinner({ size = "md", className }: LoadingSpinnerProps) {
  const sizes = {
    sm: "w-4 h-4 border-2",
    md: "w-8 h-8 border-2",
    lg: "w-12 h-12 border-3",
  }

  return (
    <div
      className={cn(
        "rounded-full border-fairy-purple/20 border-t-fairy-purple animate-spin",
        sizes[size],
        className
      )}
    />
  )
}

export function LoadingPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6">
      <div className="relative">
        <div className="text-6xl animate-float">✨</div>
        <div className="absolute inset-0 fairy-glow rounded-full" />
      </div>
      <div className="text-fairy-text-muted text-sm animate-pulse">
        Sprinkling fairy dust…
      </div>
    </div>
  )
}
