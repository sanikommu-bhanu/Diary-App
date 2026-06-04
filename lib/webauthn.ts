/**
 * lib/webauthn.ts — Real WebAuthn biometric integration
 * Uses platform authenticators (FaceID, TouchID, Windows Hello)
 */

import { getActiveProfileId, profileStorageKey } from "@/lib/profiles"

function credentialKey(): string | null {
  const profileId = getActiveProfileId()
  if (!profileId) return null
  return profileStorageKey(profileId, "biometric_id")
}

function base64url(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

function base64urlToUint8(str: string): Uint8Array {
  const b64 = str.replace(/-/g, "+").replace(/_/g, "/")
  const bin = atob(b64)
  return new Uint8Array(Array.from(bin, c => c.charCodeAt(0)))
}

/** True if this browser supports platform biometrics */
export async function isBiometricAvailable(): Promise<boolean> {
  if (typeof window === "undefined") return false
  if (!window.PublicKeyCredential) return false
  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
  } catch {
    return false
  }
}

/** True if the user has already registered a biometric credential */
export function hasBiometricRegistered(): boolean {
  const key = credentialKey()
  return key ? !!localStorage.getItem(key) : false
}

/**
 * Register a biometric credential for this device.
 * Should be called once during settings setup.
 */
export async function registerBiometric(userId: string = "fairydiary-user"): Promise<boolean> {
  if (!(await isBiometricAvailable())) return false
  try {
    const challenge = crypto.getRandomValues(new Uint8Array(32))
    const credential = await navigator.credentials.create({
      publicKey: {
        challenge,
        rp: {
          name: "FairyDiary",
          id: window.location.hostname,
        },
        user: {
          id: new TextEncoder().encode(userId),
          name: userId,
          displayName: "FairyDiary",
        },
        pubKeyCredParams: [
          { type: "public-key", alg: -7   }, // ES256
          { type: "public-key", alg: -257 }, // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: "platform",
          residentKey:             "preferred",
          userVerification:        "required",
        },
        timeout: 60_000,
        attestation: "none",
      },
    }) as PublicKeyCredential | null

    if (!credential) return false
    const credId = base64url(credential.rawId)
    const key = credentialKey()
    if (!key) return false
    localStorage.setItem(key, credId)
    return true
  } catch (err) {
    if ((err as Error).name === "NotAllowedError") return false // user cancelled
    if ((err as Error).name === "InvalidStateError") return false // already registered
    throw err
  }
}

/**
 * Authenticate using a previously registered biometric credential.
 * Returns true if the user successfully verified.
 */
export async function authenticateBiometric(): Promise<boolean> {
  if (!(await isBiometricAvailable())) return false
  const key = credentialKey()
  if (!key) return false
  const credIdStr = localStorage.getItem(key)
  if (!credIdStr) return false

  try {
    const credId    = base64urlToUint8(credIdStr)
    const challenge = crypto.getRandomValues(new Uint8Array(32))

    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge: challenge as BufferSource,
        rpId: window.location.hostname,
        allowCredentials: [{ type: "public-key", id: credId as BufferSource }],
        userVerification: "required",
        timeout: 60_000,
      },
    })

    return !!assertion
  } catch (err) {
    if ((err as Error).name === "NotAllowedError") return false // user cancelled
    if ((err as Error).name === "NotFoundError")   return false // credential not found
    throw err
  }
}

/** Remove biometric registration */
export function removeBiometric(): void {
  const key = credentialKey()
  if (key) localStorage.removeItem(key)
}
