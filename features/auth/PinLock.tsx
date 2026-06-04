"use client"

import { useEffect, useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"
import { useAppStore } from "@/store/app-store"
import {
  verifyPIN, createSession, getRemainingCooldownMs,
  registerFailedPINAttempt, registerSuccessfulPINEntry,
  requestBiometricUnlock, isLegacyPINHash,
} from "@/lib/auth"
import { getActiveProfile } from "@/lib/profiles"
import { cn } from "@/lib/utils"
import { Fingerprint, Lock, Users, AlertTriangle } from "lucide-react"
import { showToast } from "@/components/ui/Toast"
import { MagicButton } from "@/components/ui/MagicButton"

export function PinLock() {
  const router = useRouter()
  const { unlock, settings, forgotPinReset, activeProfileId } = useAppStore()
  const profile = getActiveProfile()
  const [pin, setPin]             = useState("")
  const [error, setError]         = useState("")
  const [attempts, setAttempts]   = useState(0)
  const [shaking, setShaking]     = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [cooldownMs, setCooldownMs]   = useState(0)
  const [legacyWarning, setLegacyWarning] = useState(false)
  const [forgotOpen, setForgotOpen] = useState(false)
  const [confirmName, setConfirmName] = useState("")
  const [resetting, setResetting] = useState(false)

  const requiredLength = settings.pinLength
  const displayName = profile?.displayName || settings.displayName || "My Diary"

  useEffect(() => {
    setAttempts(0)
    setCooldownMs(getRemainingCooldownMs())
    if (isLegacyPINHash()) setLegacyWarning(true)
  }, [])

  useEffect(() => {
    if (cooldownMs <= 0) return
    const timer = window.setInterval(() => setCooldownMs(getRemainingCooldownMs()), 250)
    return () => window.clearInterval(timer)
  }, [cooldownMs])

  useEffect(() => {
    if (pin.length === requiredLength && !shaking && !isVerifying && cooldownMs <= 0 && !forgotOpen) {
      handleVerify()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin, requiredLength, shaking, isVerifying, cooldownMs, forgotOpen])

  const handleVerify = async () => {
    if (pin.length !== requiredLength || isVerifying) return
    setIsVerifying(true)
    try {
      const valid = await verifyPIN(pin)
      if (valid) {
        registerSuccessfulPINEntry()
        createSession()
        unlock()
        router.replace("/home")
      } else {
        const lockState = registerFailedPINAttempt()
        setShaking(true)
        setError("Wrong PIN — try again")
        setAttempts(lockState.failedAttempts)
        setCooldownMs(getRemainingCooldownMs())
        setTimeout(() => {
          setPin("")
          setError("")
          setShaking(false)
        }, 600)
      }
    } finally {
      setIsVerifying(false)
    }
  }

  const onDigit = (digit: number) => {
    if (cooldownMs > 0 || isVerifying || forgotOpen) return
    setError("")
    setPin(prev => prev.length >= requiredLength ? prev : prev + String(digit))
  }

  const onDelete = () => {
    if (cooldownMs > 0 || isVerifying || forgotOpen) return
    setError("")
    setPin(prev => prev.slice(0, -1))
  }

  const onBiometric = async () => {
    const ok = await requestBiometricUnlock()
    if (ok) {
      createSession()
      unlock()
      router.replace("/home")
      return
    }
    showToast("Biometric unlock unavailable for this diary", "info")
  }

  const handleForgotReset = async () => {
    if (!activeProfileId) return
    if (confirmName.trim().toLowerCase() !== displayName.trim().toLowerCase()) {
      showToast("Diary name does not match", "error")
      return
    }
    if (!confirm(
      `This permanently deletes all entries and media in "${displayName}" and removes the PIN. This cannot be undone unless you have a JSON backup. Continue?`,
    )) return

    setResetting(true)
    try {
      await forgotPinReset(activeProfileId)
      showToast("Diary reset — set up again", "info")
      router.replace("/onboarding")
    } finally {
      setResetting(false)
    }
  }

  const cooldownLabel = useMemo(() => {
    const secs = Math.ceil(cooldownMs / 1000)
    if (secs <= 0) return ""
    return `Too many attempts — wait ${secs}s`
  }, [cooldownMs])

  const hour = new Date().getHours()
  const greeting =
    hour < 12 ? "Good morning ☀️"
    : hour < 17 ? "Good afternoon 🌸"
    : hour < 21 ? "Good evening 🌙"
    : "Hello, night owl 🌟"

  if (forgotOpen) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-fairy-glow opacity-40 pointer-events-none" aria-hidden="true" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm z-10 glass rounded-2xl p-6 border border-red-500/25 space-y-5"
          role="dialog"
          aria-labelledby="forgot-pin-title"
        >
          <div className="flex items-center gap-3 text-amber-400">
            <AlertTriangle size={22} aria-hidden="true" />
            <h2 id="forgot-pin-title" className="font-display text-lg font-bold text-fairy-text">
              Reset diary & PIN
            </h2>
          </div>
          <p className="text-sm text-fairy-text-muted leading-relaxed">
            There is no online password recovery. Resetting <strong className="text-fairy-text">{displayName}</strong> will
            delete all entries and photos for this diary on this device. Export a backup first if you still have access elsewhere.
          </p>
          <div>
            <label htmlFor="confirm-diary-name" className="text-xs text-fairy-text-muted block mb-2">
              Type the diary name to confirm: <span className="text-fairy-text">{displayName}</span>
            </label>
            <input
              id="confirm-diary-name"
              type="text"
              value={confirmName}
              onChange={(e) => setConfirmName(e.target.value)}
              className="w-full glass rounded-xl px-4 py-3 text-fairy-text focus:outline-none border border-fairy-border"
              autoComplete="off"
            />
          </div>
          <div className="flex flex-col gap-2">
            <MagicButton
              variant="danger"
              size="md"
              className="w-full"
              loading={resetting}
              onClick={handleForgotReset}
              disabled={!confirmName.trim()}
            >
              Delete data & reset PIN
            </MagicButton>
            <MagicButton
              variant="secondary"
              size="md"
              className="w-full"
              onClick={() => { setForgotOpen(false); setConfirmName("") }}
            >
              Cancel — try PIN again
            </MagicButton>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-fairy-glow opacity-40 pointer-events-none" aria-hidden="true" />

      <motion.div
        animate={shaking ? { x: [-10, 10, -10, 10, -8, 8, -5, 5, 0] } : { x: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-xs z-10 flex flex-col items-center space-y-8"
        role="main"
        aria-label="PIN entry screen"
      >
        <div className="text-center">
          <motion.div
            className="text-5xl mb-3"
            role="img"
            aria-label="Fairy emoji"
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 4, repeat: Infinity }}
          >
            🧚‍♀️
          </motion.div>
          <h1 className="font-display text-2xl font-bold gradient-text">FairyDiary</h1>
          <p className="text-fairy-text-muted text-sm mt-1" aria-live="polite">{greeting}</p>
          <p className="text-fairy-text text-lg mt-1 font-display">
            {displayName}
          </p>
          <p className="text-fairy-text-muted/70 text-xs mt-2">
            Enter your {requiredLength}-digit PIN
          </p>
        </div>

        <AnimatePresence>
          {legacyWarning && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="w-full glass rounded-xl p-3 border border-amber-500/30 bg-amber-500/5"
              role="alert"
            >
              <p className="text-amber-300 text-xs text-center leading-relaxed">
                ⚠️ Your PIN uses an older security format. After unlocking, reset your PIN in Settings.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <div
          className="flex gap-4"
          role="group"
          aria-label={`${pin.length} of ${requiredLength} digits entered`}
        >
          {Array.from({ length: requiredLength }).map((_, i) => (
            <motion.div
              key={i}
              aria-hidden="true"
              animate={i < pin.length ? { scale: [1, 1.3, 1] } : {}}
              transition={{ duration: 0.15 }}
              className={cn(
                "w-5 h-5 rounded-full border-2 transition-all duration-200",
                i < pin.length
                  ? "bg-gradient-to-r from-fairy-purple to-fairy-rose border-transparent shadow-[0_0_12px_rgba(192,132,252,0.7)]"
                  : "border-fairy-border bg-white/5",
              )}
            />
          ))}
        </div>

        <AnimatePresence>
          {(error || cooldownMs > 0) && (
            <motion.p
              key={error || "cooldown"}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              role="alert"
              aria-live="assertive"
              className={cn(
                "text-sm -mt-4 text-center",
                error ? "text-red-400" : "text-amber-300 text-xs",
              )}
            >
              {cooldownMs > 0 ? cooldownLabel : error}
            </motion.p>
          )}
        </AnimatePresence>

        <div
          className="grid grid-cols-3 gap-3 w-full relative z-30"
          role="group"
          aria-label="PIN numpad"
        >
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, null, 0, "del"].map((key, i) => {
            if (key === null) return <div key={i} aria-hidden="true" />
            const isDelete = key === "del"
            const disabled = cooldownMs > 0 || isVerifying
            return (
              <motion.button
                key={i}
                type="button"
                whileHover={{ scale: disabled ? 1 : 1.05 }}
                whileTap={{ scale: disabled ? 1 : 0.85 }}
                aria-label={isDelete ? "Delete last digit" : `${key}`}
                aria-disabled={disabled}
                className={cn(
                  "h-16 rounded-2xl glass flex items-center justify-center text-2xl font-medium",
                  isDelete ? "text-fairy-rose text-xl" : "text-fairy-text hover:bg-fairy-purple/20",
                  disabled && "opacity-50 pointer-events-none",
                )}
                onClick={() => isDelete ? onDelete() : onDigit(Number(key))}
              >
                {isDelete ? "⌫" : key}
              </motion.button>
            )
          })}
        </div>

        <div className="w-full flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBiometric}
              className="flex-1 glass rounded-xl py-3 text-sm text-fairy-text-muted hover:text-fairy-text flex items-center justify-center gap-2"
              aria-label="Use biometric unlock"
            >
              <Fingerprint size={15} aria-hidden="true" />
              Biometric
            </button>
            <div
              className="flex-1 glass rounded-xl py-3 text-xs text-fairy-text-muted/80 flex items-center justify-center gap-2"
              aria-label={`${attempts} failed attempts`}
            >
              <Lock size={14} aria-hidden="true" />
              {attempts} failed
            </div>
          </div>
          <button
            type="button"
            onClick={() => router.replace("/profiles")}
            className="w-full glass rounded-xl py-3 text-sm text-fairy-text-muted hover:text-fairy-purple flex items-center justify-center gap-2"
          >
            <Users size={15} aria-hidden="true" />
            Switch diary
          </button>
          <button
            type="button"
            onClick={() => setForgotOpen(true)}
            className="w-full text-sm text-fairy-rose/80 hover:text-fairy-rose underline underline-offset-2 py-1"
          >
            Forgot PIN?
          </button>
        </div>
      </motion.div>
    </div>
  )
}
