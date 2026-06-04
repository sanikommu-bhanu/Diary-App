import { rateLimit, getClientIP } from "@/lib/rate-limit"

describe("rateLimit", () => {
  it("allows requests within limit", () => {
    const r = rateLimit("test-key-1", 5, 60_000)
    expect(r.success).toBe(true)
    expect(r.limit).toBe(5)
    expect(r.remaining).toBe(4)
  })

  it("tracks multiple requests", () => {
    const key = "test-key-multi"
    rateLimit(key, 3, 60_000)
    rateLimit(key, 3, 60_000)
    const r = rateLimit(key, 3, 60_000)
    expect(r.success).toBe(true)
    expect(r.remaining).toBe(0)
  })

  it("blocks when limit exceeded", () => {
    const key = "test-key-block"
    rateLimit(key, 2, 60_000)
    rateLimit(key, 2, 60_000)
    const r = rateLimit(key, 2, 60_000)
    expect(r.success).toBe(false)
    expect(r.remaining).toBe(0)
  })

  it("resets after window expires", () => {
    const key = "test-key-reset"
    // Fill up the limit
    rateLimit(key, 1, 1) // 1ms window
    // Wait past the window
    return new Promise<void>(resolve => {
      setTimeout(() => {
        const r = rateLimit(key, 1, 1)
        expect(r.success).toBe(true)
        resolve()
      }, 10)
    })
  })

  it("treats different keys independently", () => {
    rateLimit("key-a", 1, 60_000)
    rateLimit("key-a", 1, 60_000) // key-a blocked
    const r = rateLimit("key-b", 1, 60_000) // key-b fresh
    expect(r.success).toBe(true)
  })

  it("returns correct resetAt timestamp", () => {
    const before = Date.now()
    const r = rateLimit("test-reset-ts", 5, 10_000)
    const after = Date.now()
    expect(r.resetAt).toBeGreaterThanOrEqual(before + 10_000)
    expect(r.resetAt).toBeLessThanOrEqual(after + 10_000 + 50)
  })
})

describe("getClientIP", () => {
  const makeRequest = (headers: Record<string, string>) => ({
    headers: new Headers(headers),
  })

  it("returns x-real-ip if present", () => {
    const req = makeRequest({ "x-real-ip": "1.2.3.4" })
    expect(getClientIP(req)).toBe("1.2.3.4")
  })

  it("returns first IP from x-forwarded-for", () => {
    const req = makeRequest({ "x-forwarded-for": "5.6.7.8, 9.10.11.12" })
    expect(getClientIP(req)).toBe("5.6.7.8")
  })

  it("prefers x-real-ip over x-forwarded-for", () => {
    const req = makeRequest({ "x-real-ip": "1.1.1.1", "x-forwarded-for": "2.2.2.2" })
    expect(getClientIP(req)).toBe("1.1.1.1")
  })

  it("returns unknown when no IP headers present", () => {
    const req = makeRequest({})
    expect(getClientIP(req)).toBe("unknown")
  })
})
