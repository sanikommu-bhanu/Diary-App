import { NextRequest, NextResponse } from "next/server"
import { logger } from "@/lib/logger"
import { rateLimit, getClientIP } from "@/lib/rate-limit"

export async function POST(req: NextRequest) {
  const ip = getClientIP(req)
  const rl = rateLimit(`csp:${ip}`, 10, 60_000)
  if (!rl.success) return new NextResponse(null, { status: 429 })

  try {
    const body = await req.json() as { "csp-report"?: Record<string, unknown> }
    const report: Record<string, unknown> = body["csp-report"] ?? (body as Record<string, unknown>)
    logger.warn("CSP violation", {
      documentUri:   report["document-uri"]   ?? report.documentUri,
      violatedDir:   report["violated-directive"] ?? report.violatedDirective,
      blockedUri:    report["blocked-uri"]    ?? report.blockedUri,
      sourceFile:    report["source-file"]    ?? report.sourceFile,
    })
  } catch {
    // Ignore malformed reports
  }
  return new NextResponse(null, { status: 204 })
}
