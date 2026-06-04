import {
  sanitizeString,
  validatePIN,
  validateAITextRequest,
  validateAIRewriteRequest,
  validateAISummaryRequest,
  validateImportEntry,
  LIMITS,
} from "@/lib/validation"

describe("sanitizeString", () => {
  it("returns empty string for non-string input", () => {
    expect(sanitizeString(null, 100)).toBe("")
    expect(sanitizeString(42, 100)).toBe("")
    expect(sanitizeString(undefined, 100)).toBe("")
  })

  it("trims whitespace", () => {
    expect(sanitizeString("  hello  ", 100)).toBe("hello")
  })

  it("strips control characters", () => {
    expect(sanitizeString("hello\x00world", 100)).toBe("helloworld")
    expect(sanitizeString("line\x08back", 100)).toBe("lineback")
  })

  it("preserves newlines and tabs", () => {
    expect(sanitizeString("line1\nline2\ttabbed", 100)).toBe("line1\nline2\ttabbed")
  })

  it("truncates to maxLength", () => {
    expect(sanitizeString("hello world", 5)).toBe("hello")
  })
})

describe("validatePIN", () => {
  it("returns null for valid PINs", () => {
    expect(validatePIN("1234", 4)).toBeNull()
    expect(validatePIN("123456", 6)).toBeNull()
  })

  it("rejects non-string input", () => {
    expect(validatePIN(1234, 4)).not.toBeNull()
  })

  it("rejects non-digit characters", () => {
    expect(validatePIN("12ab", 4)).not.toBeNull()
    expect(validatePIN("12 4", 4)).not.toBeNull()
  })

  it("rejects wrong length", () => {
    expect(validatePIN("123", 4)).not.toBeNull()
    expect(validatePIN("12345", 4)).not.toBeNull()
  })
})

describe("validateAITextRequest", () => {
  it("returns error for empty body", () => {
    expect(validateAITextRequest(null)).toEqual({ error: "Invalid request body" })
    expect(validateAITextRequest({})).toEqual({ error: "text is required" })
  })

  it("returns validated text", () => {
    const result = validateAITextRequest({ text: "  hello world  " })
    expect(result).toEqual({ text: "hello world" })
  })

  it("truncates text over max length", () => {
    const longText = "a".repeat(LIMITS.AI_TEXT_MAX + 100)
    const result = validateAITextRequest({ text: longText }) as { text: string }
    expect(result.text.length).toBe(LIMITS.AI_TEXT_MAX)
  })
})

describe("validateAIRewriteRequest", () => {
  it("defaults mode to rewrite", () => {
    const result = validateAIRewriteRequest({ text: "hello" }) as { text: string; mode: string }
    expect(result.mode).toBe("rewrite")
  })

  it("rejects invalid mode, falls back to rewrite", () => {
    const result = validateAIRewriteRequest({ text: "hello", mode: "evil_mode" }) as { mode: string }
    expect(result.mode).toBe("rewrite")
  })

  it("accepts valid modes", () => {
    const result = validateAIRewriteRequest({ text: "hello", mode: "fairy" }) as { mode: string }
    expect(result.mode).toBe("fairy")
  })
})

describe("validateAISummaryRequest", () => {
  it("rejects empty entries array", () => {
    expect(validateAISummaryRequest({ entries: [] })).toEqual({ error: "entries must be a non-empty array" })
  })

  it("rejects too many entries", () => {
    const entries = Array.from({ length: 32 }, () => ({ rawText: "test" }))
    expect(validateAISummaryRequest({ entries })).toEqual({ error: "Too many entries" })
  })

  it("defaults type to weekly", () => {
    const result = validateAISummaryRequest({ entries: [{ rawText: "test" }] }) as { type: string }
    expect(result.type).toBe("weekly")
  })

  it("accepts monthly type", () => {
    const result = validateAISummaryRequest({ entries: [{ rawText: "test" }], type: "monthly" }) as { type: string }
    expect(result.type).toBe("monthly")
  })
})

describe("validateImportEntry", () => {
  const validEntry = {
    id: "abc-123",
    title: "Test Entry",
    rawText: "Hello world",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
    mood: "happy",
    tags: ["test"],
    favorite: false,
    mediaIds: [],
  }

  it("accepts valid entry", () => {
    expect(validateImportEntry(validEntry)).toBe(true)
  })

  it("rejects entry with missing fields", () => {
    const { title: _t, ...noTitle } = validEntry
    expect(validateImportEntry(noTitle)).toBe(false)
  })

  it("rejects entry with invalid mood", () => {
    expect(validateImportEntry({ ...validEntry, mood: "ecstatic" })).toBe(false)
  })

  it("rejects non-boolean favorite", () => {
    expect(validateImportEntry({ ...validEntry, favorite: "yes" })).toBe(false)
  })

  it("rejects null input", () => {
    expect(validateImportEntry(null)).toBe(false)
  })
})
