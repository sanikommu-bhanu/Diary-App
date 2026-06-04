/**
 * hooks/useAuth.ts — Reactive auth state hook
 * Abstracts auth operations so components don't import lib/auth directly.
 */
import { useCallback, useEffect, useState } from "react"
import {
  hasPIN, getPINLength, isLegacyPINHash,
  setPIN, verifyPIN, removePIN,
  createSession, destroySession, isSessionValid, refreshSession,
  getRemainingCooldownMs, registerFailedPINAttempt, registerSuccessfulPINEntry,
} from "@/lib/auth"
import {
  isBiometricAvailable, hasBiometricRegistered,
  registerBiometric, authenticateBiometric,
} from "@/lib/webauthn"
import { useAppStore } from "@/store/app-store"

export function useAuth() {
  const { unlock, lock, updateSettings, settings } = useAppStore()
  const [biometricAvailable, setBiometricAvailable] = useState(false)
  const [biometricRegistered, setBiometricRegistered] = useState(false)

  useEffect(() => {
    isBiometricAvailable().then(setBiometricAvailable)
    setBiometricRegistered(hasBiometricRegistered())
  }, [])

  const setupPIN = useCallback(async (pin: string, length: 4 | 6 = 4) => {
    await setPIN(pin, length)
    updateSettings({ hasPIN: true, pinLength: length })
    createSession()
    unlock()
  }, [updateSettings, unlock])

  const changePIN = useCallback(async (
    currentPin: string,
    newPin: string,
    newLength: 4 | 6,
  ): Promise<{ success: boolean; error?: string }> => {
    if (settings.hasPIN) {
      const valid = await verifyPIN(currentPin)
      if (!valid) return { success: false, error: "Current PIN is incorrect" }
    }
    if (!/^\d+$/.test(newPin))          return { success: false, error: "PIN must contain only digits" }
    if (newPin.length !== newLength)    return { success: false, error: `PIN must be exactly ${newLength} digits` }
    await setPIN(newPin, newLength)
    updateSettings({ hasPIN: true, pinLength: newLength })
    return { success: true }
  }, [settings.hasPIN, updateSettings])

  const deletePIN = useCallback(async (
    currentPin: string,
  ): Promise<{ success: boolean; error?: string }> => {
    const valid = await verifyPIN(currentPin)
    if (!valid) return { success: false, error: "PIN is incorrect" }
    removePIN()
    updateSettings({ hasPIN: false, pinLength: 4 })
    return { success: true }
  }, [updateSettings])

  const attemptUnlock = useCallback(async (pin: string): Promise<boolean> => {
    const cooldown = getRemainingCooldownMs()
    if (cooldown > 0) return false

    const valid = await verifyPIN(pin)
    if (valid) {
      registerSuccessfulPINEntry()
      createSession()
      unlock()
      return true
    }
    registerFailedPINAttempt()
    return false
  }, [unlock])

  const attemptBiometricUnlock = useCallback(async (): Promise<boolean> => {
    const ok = await authenticateBiometric()
    if (ok) {
      createSession()
      unlock()
    }
    return ok
  }, [unlock])

  const setupBiometric = useCallback(async (): Promise<boolean> => {
    const ok = await registerBiometric()
    if (ok) {
      setBiometricRegistered(true)
      updateSettings({ biometricEnabled: true })
    }
    return ok
  }, [updateSettings])

  const doLock = useCallback(() => {
    destroySession()
    lock()
  }, [lock])

  return {
    // State
    hasPIN:             settings.hasPIN,
    pinLength:          settings.pinLength,
    isLegacy:           isLegacyPINHash(),
    biometricAvailable,
    biometricRegistered,
    biometricEnabled:   settings.biometricEnabled ?? false,
    isSessionValid:     isSessionValid(),
    remainingCooldownMs: getRemainingCooldownMs(),
    // Actions
    setupPIN,
    changePIN,
    deletePIN,
    attemptUnlock,
    attemptBiometricUnlock,
    setupBiometric,
    lock: doLock,
    refreshSession,
  }
}
