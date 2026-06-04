"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { X } from "lucide-react"

interface Toast {
  id: string
  message: string
  type: "success" | "error" | "info"
}

let toastListeners: ((toasts: Toast[]) => void)[] = []
let toastQueue: Toast[] = []

export function showToast(message: string, type: Toast["type"] = "success") {
  const toast: Toast = {
    id: `${Date.now()}-${Math.random()}`,
    message,
    type,
  }
  toastQueue = [toast, ...toastQueue].slice(0, 3)
  toastListeners.forEach((l) => l([...toastQueue]))
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([])

  useEffect(() => {
    toastListeners.push(setToasts)
    return () => {
      toastListeners = toastListeners.filter((l) => l !== setToasts)
    }
  }, [])

  const remove = (id: string) => {
    toastQueue = toastQueue.filter((t) => t.id !== id)
    setToasts([...toastQueue])
  }

  useEffect(() => {
    if (toasts.length > 0) {
      const timer = setTimeout(() => {
        if (toastQueue.length > 0) {
          toastQueue = toastQueue.slice(0, -1)
          setToasts([...toastQueue])
        }
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [toasts])

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-xs">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 40, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 40, scale: 0.9 }}
            className={cn(
              "glass rounded-xl px-4 py-3 flex items-start gap-3 shadow-glass text-sm",
              toast.type === "success" && "border-green-500/20",
              toast.type === "error" && "border-red-500/20",
              toast.type === "info" && "border-fairy-purple/20"
            )}
          >
            <span className="mt-0.5">
              {toast.type === "success" && "✅"}
              {toast.type === "error" && "❌"}
              {toast.type === "info" && "✨"}
            </span>
            <span className="text-fairy-text flex-1">{toast.message}</span>
            <button onClick={() => remove(toast.id)} className="text-fairy-text-muted hover:text-fairy-text mt-0.5">
              <X size={14} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
