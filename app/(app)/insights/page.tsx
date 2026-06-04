"use client"

import dynamic from "next/dynamic"
import { Suspense } from "react"
import { PageSkeleton } from "@/components/ui/Skeleton"

// Recharts is ~200 KB — only load it when the insights tab is actually visited
const InsightsContent = dynamic(
  () => import("@/features/insights/InsightsContent").then(m => ({ default: m.InsightsContent })),
  {
    loading: () => <PageSkeleton rows={4} />,
    ssr: false,
  },
)

export default function InsightsPage() {
  return (
    <Suspense fallback={<PageSkeleton rows={4} />}>
      <InsightsContent />
    </Suspense>
  )
}
