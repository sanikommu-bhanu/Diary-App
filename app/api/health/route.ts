import { NextResponse } from "next/server"
import { env } from "@/lib/env"

const START_TIME = Date.now()

export async function GET() {
  const uptime = Math.floor((Date.now() - START_TIME) / 1000)
  return NextResponse.json({
    status:    "ok",
    version:   process.env.npm_package_version ?? "1.1.0",
    env:       env.NODE_ENV,
    aiEnabled: !!env.OPENROUTER_API_KEY,
    uptime,
    timestamp: new Date().toISOString(),
  })
}
