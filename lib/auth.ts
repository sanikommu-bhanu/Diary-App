/**
 * lib/auth.ts — Per-profile PIN authentication & session management
 */
import {
  getActiveProfileId,
  profileStorageKey,
} from "@/lib/profiles"

const SESSION_SUFFIX = "session"

const SESSION_IDLE_MS = 30 * 60 * 1000
const SESSION_MAX_MS  = 8 * 60 * 60 * 1000

const PBKDF2_ITERATIONS = 100_000
const PBKDF2_HASH       = "SHA-256"
const KEY_LENGTH_BITS   = 256
const SALT_BYTES        = 16

interface LockState {
  failedAttempts: number
  cooldownUntil: number
}

interface Session {
  createdAt: number
  expiresAt: number
  absoluteExpiry: number
}

const DEFAULT_LOCK_STATE: LockState = { failedAttempts: 0, cooldownUntil: 0 }

function requireProfileId(): string | null {
  return getActiveProfileId()
}

function pinKey(profileId: string): string {
  return profileStorageKey(profileId, "pin_hash")
}

function pinLengthKey(profileId: string): string {
  return profileStorageKey(profileId, "pin_length")
}

function lockKey(profileId: string): string {
  return profileStorageKey(profileId, "lock_state")
}

function sessionKey(profileId: string): string {
  return `fairy_p_${profileId}_${SESSION_SUFFIX}`
}

function hexFromBytes(bytes: Uint8Array): string {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join("")
}

function bytesFromHex(hex: string): Uint8Array {
  const pairs = hex.match(/.{2}/g)
  if (!pairs || pairs.length === 0) throw new Error("invalid hex")
  return new Uint8Array(pairs.map(b => parseInt(b, 16)))
}

async function deriveKey(pin: string, salt: Uint8Array): Promise<string> {
  const encoder = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(pin),
    "PBKDF2",
    false,
    ["deriveBits"],
  )
  const derived = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: salt as BufferSource, iterations: PBKDF2_ITERATIONS, hash: PBKDF2_HASH },
    keyMaterial,
    KEY_LENGTH_BITS,
  )
  return hexFromBytes(new Uint8Array(derived))
}

function isLegacyHash(stored: string): boolean {
  return !stored.startsWith("v2:")
}

export async function setPIN(pin: string, pinLength: 4 | 6 = pin.length === 6 ? 6 : 4): Promise<void> {
  if (typeof window === "undefined") return
  const profileId = requireProfileId()
  if (!profileId) return
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES))
  const hash = await deriveKey(pin, salt)
  const combined = `v2:${hexFromBytes(salt)}:${hash}`
  localStorage.setItem(pinKey(profileId), combined)
  localStorage.setItem(pinLengthKey(profileId), String(pinLength))
  clearLockState()
}

export async function verifyPIN(pin: string): Promise<boolean> {
  if (typeof window === "undefined") return false
  const profileId = requireProfileId()
  if (!profileId) return false
  const stored = localStorage.getItem(pinKey(profileId))
  if (!stored) return false

  const requiredLength = getPINLength()
  if (pin.length !== requiredLength) return false
  if (isLegacyHash(stored)) return false

  const parts = stored.split(":")
  if (parts.length !== 3 || parts[0] !== "v2") return false
  const [, saltHex, expectedHash] = parts
  try {
    const salt = bytesFromHex(saltHex)
    const hash = await deriveKey(pin, salt)
    return timingSafeEqual(hash, expectedHash)
  } catch {
    return false
  }
}

export function hasPIN(): boolean {
  if (typeof window === "undefined") return false
  const profileId = requireProfileId()
  if (!profileId) return false
  return !!localStorage.getItem(pinKey(profileId))
}

export function isLegacyPINHash(): boolean {
  if (typeof window === "undefined") return false
  const profileId = requireProfileId()
  if (!profileId) return false
  const stored = localStorage.getItem(pinKey(profileId))
  return !!stored && isLegacyHash(stored)
}

export function getPINLength(): 4 | 6 {
  if (typeof window === "undefined") return 4
  const profileId = requireProfileId()
  if (!profileId) return 4
  return localStorage.getItem(pinLengthKey(profileId)) === "6" ? 6 : 4
}

export function removePIN(): void {
  if (typeof window === "undefined") return
  const profileId = requireProfileId()
  if (!profileId) return
  localStorage.removeItem(pinKey(profileId))
  localStorage.removeItem(pinLengthKey(profileId))
  clearLockState()
}

export function getLockState(): LockState {
  const profileId = requireProfileId()
  if (!profileId) return DEFAULT_LOCK_STATE
  try {
    const raw = localStorage.getItem(lockKey(profileId))
    if (!raw) return DEFAULT_LOCK_STATE
    const p = JSON.parse(raw) as Partial<LockState>
    return {
      failedAttempts: Math.max(0, Number(p.failedAttempts) || 0),
      cooldownUntil:  Math.max(0, Number(p.cooldownUntil)  || 0),
    }
  } catch {
    return DEFAULT_LOCK_STATE
  }
}

function saveLockState(state: LockState): void {
  const profileId = requireProfileId()
  if (!profileId) return
  localStorage.setItem(lockKey(profileId), JSON.stringify(state))
}

export function clearLockState(): void {
  const profileId = requireProfileId()
  if (!profileId || typeof window === "undefined") return
  localStorage.removeItem(lockKey(profileId))
}

export function getRemainingCooldownMs(): number {
  return Math.max(0, getLockState().cooldownUntil - Date.now())
}

function getCooldownSeconds(attempts: number): number {
  if (attempts >= 10) return 300
  if (attempts >= 8)  return 120
  if (attempts >= 5)  return 30
  return 0
}

export function registerFailedPINAttempt(): LockState {
  const state = getLockState()
  const failedAttempts = state.failedAttempts + 1
  const cooldownSecs = getCooldownSeconds(failedAttempts)
  const next: LockState = {
    failedAttempts,
    cooldownUntil: cooldownSecs > 0 ? Date.now() + cooldownSecs * 1000 : 0,
  }
  saveLockState(next)
  return next
}

export function registerSuccessfulPINEntry(): void {
  clearLockState()
}

export function createSession(): void {
  if (typeof window === "undefined") return
  const profileId = requireProfileId()
  if (!profileId) return
  const now = Date.now()
  const session: Session = {
    createdAt:       now,
    expiresAt:       now + SESSION_IDLE_MS,
    absoluteExpiry:  now + SESSION_MAX_MS,
  }
  sessionStorage.setItem(sessionKey(profileId), JSON.stringify(session))
}

export function isSessionValid(): boolean {
  const profileId = requireProfileId()
  if (!profileId) return false
  try {
    const raw = sessionStorage.getItem(sessionKey(profileId))
    if (!raw) return false
    const s = JSON.parse(raw) as Partial<Session>
    const now = Date.now()
    const expires  = Number(s.expiresAt) || 0
    const absolute = Number(s.absoluteExpiry) || 0
    return now < expires && now < absolute
  } catch {
    return false
  }
}

export function refreshSession(): void {
  const profileId = requireProfileId()
  if (!profileId) return
  try {
    const raw = sessionStorage.getItem(sessionKey(profileId))
    if (!raw) return
    const s = JSON.parse(raw) as Session
    const now = Date.now()
    if (now >= (s.absoluteExpiry || 0)) return
    s.expiresAt = Math.min(now + SESSION_IDLE_MS, s.absoluteExpiry)
    sessionStorage.setItem(sessionKey(profileId), JSON.stringify(s))
  } catch { /* ignore */ }
}

export function destroySession(): void {
  const profileId = requireProfileId()
  if (!profileId || typeof window === "undefined") return
  sessionStorage.removeItem(sessionKey(profileId))
}

export function clearAuthData(): void {
  removePIN()
  destroySession()
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return diff === 0
}

export interface IAuthProvider {
  setLocalPIN(pin: string, length: 4 | 6): Promise<void>
  verifyLocalPIN(pin: string): Promise<boolean>
  hasPIN(): boolean
  createSession(): void
  isSessionValid(): boolean
  refreshSession(): void
  destroySession(): void
}

export const localAuthProvider: IAuthProvider = {
  setLocalPIN: setPIN,
  verifyLocalPIN: verifyPIN,
  hasPIN,
  createSession,
  isSessionValid,
  refreshSession,
  destroySession,
}

export async function requestBiometricUnlock(): Promise<boolean> {
  if (typeof window === "undefined") return false
  try {
    const { authenticateBiometric } = await import("@/lib/webauthn")
    return authenticateBiometric()
  } catch {
    return false
  }
}
