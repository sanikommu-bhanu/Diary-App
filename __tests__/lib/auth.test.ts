/**
 * Auth tests — PIN, session, lock state (per-profile)
 */
import {
  hasPIN, getPINLength, removePIN, isLegacyPINHash,
  getLockState, registerFailedPINAttempt, registerSuccessfulPINEntry,
  getRemainingCooldownMs,
  createSession, isSessionValid, destroySession, refreshSession,
} from "@/lib/auth"
import {
  initProfiles, createProfile, getActiveProfileId, profileStorageKey,
} from "@/lib/profiles"

function pinKey(): string {
  const id = getActiveProfileId()
  if (!id) throw new Error("no profile")
  return profileStorageKey(id, "pin_hash")
}

function pinLengthKey(): string {
  const id = getActiveProfileId()
  if (!id) throw new Error("no profile")
  return profileStorageKey(id, "pin_length")
}

function sessionKey(): string {
  const id = getActiveProfileId()
  if (!id) throw new Error("no profile")
  return `fairy_p_${id}_session`
}

jest.mock("@/lib/auth", () => {
  const actual = jest.requireActual("@/lib/auth")
  return {
    ...actual,
    setPIN: jest.fn(async (_pin: string, pinLength: 4 | 6 = 4) => {
      const id = getActiveProfileId()
      if (!id) return
      localStorage.setItem(pinKey(), "v2:aabbccddeeff00112233445566778899:mockhash")
      localStorage.setItem(pinLengthKey(), String(pinLength))
    }),
    verifyPIN: jest.fn(async (pin: string) => {
      const stored = localStorage.getItem(pinKey())
      if (!stored || !stored.startsWith("v2:")) return false
      return pin === "1234"
    }),
  }
})

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
  initProfiles()
  createProfile("Test")
})

describe("hasPIN", () => {
  it("returns false when no PIN stored", () => {
    expect(hasPIN()).toBe(false)
  })

  it("returns true when PIN hash exists", () => {
    localStorage.setItem(pinKey(), "v2:salt:hash")
    expect(hasPIN()).toBe(true)
  })
})

describe("removePIN", () => {
  it("clears PIN from storage", () => {
    localStorage.setItem(pinKey(), "v2:salt:hash")
    localStorage.setItem(pinLengthKey(), "4")
    removePIN()
    expect(hasPIN()).toBe(false)
    expect(localStorage.getItem(pinKey())).toBeNull()
  })
})

describe("getPINLength", () => {
  it("returns 4 by default", () => {
    expect(getPINLength()).toBe(4)
  })

  it("returns 6 when stored as 6", () => {
    localStorage.setItem(pinLengthKey(), "6")
    expect(getPINLength()).toBe(6)
  })
})

describe("isLegacyPINHash", () => {
  it("detects legacy v1 hash", () => {
    localStorage.setItem(pinKey(), "abc123def456")
    expect(isLegacyPINHash()).toBe(true)
  })

  it("returns false for v2 hash", () => {
    localStorage.setItem(pinKey(), "v2:salt:hash")
    expect(isLegacyPINHash()).toBe(false)
  })
})

describe("registerFailedPINAttempt", () => {
  it("increments failedAttempts", () => {
    const s = registerFailedPINAttempt()
    expect(s.failedAttempts).toBe(1)
  })

  it("applies cooldown after 5 attempts", () => {
    for (let i = 0; i < 5; i++) registerFailedPINAttempt()
    expect(getRemainingCooldownMs()).toBeGreaterThan(0)
  })
})

describe("registerSuccessfulPINEntry", () => {
  it("clears lock state", () => {
    registerFailedPINAttempt()
    registerSuccessfulPINEntry()
    expect(getLockState().failedAttempts).toBe(0)
  })
})

describe("createSession / isSessionValid", () => {
  it("creates a valid session", () => {
    createSession()
    expect(isSessionValid()).toBe(true)
  })

  it("session is invalid before creation", () => {
    expect(isSessionValid()).toBe(false)
  })
})

describe("destroySession", () => {
  it("invalidates session", () => {
    createSession()
    destroySession()
    expect(isSessionValid()).toBe(false)
  })
})

describe("refreshSession", () => {
  it("extends idle expiry", () => {
    createSession()
    const raw1 = JSON.parse(sessionStorage.getItem(sessionKey()) ?? "{}")
    const expires1 = raw1.expiresAt as number

    jest.useFakeTimers()
    jest.advanceTimersByTime(60_000)
    refreshSession()
    jest.useRealTimers()

    const raw2 = JSON.parse(sessionStorage.getItem(sessionKey()) ?? "{}")
    expect(raw2.expiresAt).toBeGreaterThan(expires1)
  })
})
