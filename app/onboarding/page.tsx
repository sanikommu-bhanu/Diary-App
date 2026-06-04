"use client"

import { FloatingParticles } from "@/components/ui/FloatingParticles"
import { Onboarding } from "@/features/auth/Onboarding"

export default function OnboardingPage() {
  return (
    <div className="min-h-screen relative">
      <FloatingParticles count={40} />
      <div className="relative z-10">
        <Onboarding />
      </div>
    </div>
  )
}
