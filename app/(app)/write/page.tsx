"use client"

import { Suspense } from "react"
import { EntryEditor } from "@/features/entries/EntryEditor"

export default function WritePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-4xl animate-pulse-soft">✨</div>
      </div>
    }>
      <EntryEditor />
    </Suspense>
  )
}
