import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

/**
 * Lightweight health-check endpoint for hosting platforms (Render, Fly, etc.)
 * and uptime monitors. Returns 200 when the app can reach its database.
 * Public (no auth) — exposes only status, never data.
 */
export async function GET() {
  const checks: Record<string, 'ok' | 'error'> = {}

  try {
    await db.$queryRaw`SELECT 1`
    checks.database = 'ok'
  } catch {
    checks.database = 'error'
  }

  const healthy = Object.values(checks).every((v) => v === 'ok')

  return NextResponse.json(
    {
      status: healthy ? 'ok' : 'degraded',
      checks,
      timestamp: new Date().toISOString(),
    },
    { status: healthy ? 200 : 503 }
  )
}
