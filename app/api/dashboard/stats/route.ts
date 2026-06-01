import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { subDays, startOfDay, format } from 'date-fns'
import type { Severity, IncidentStatus, Framework, SourceType } from '@prisma/client'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.orgId) {
      return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 })
    }

    const { orgId } = session.user
    const now = new Date()
    const todayStart = startOfDay(now)
    const sevenDaysAgo = subDays(now, 7)
    const thirtyDaysAgo = subDays(now, 30)

    // Fetch all data in parallel
    const [
      org,
      openIncidents,
      eventsToday,
      lastEvent,
      lastCriticalOrHigh,
      thirtyDayIncidents,
      channelCounts,
      recentIncidents,
      activeRulesCount,
      scoreHistory,
      ruleOverrides,
    ] = await Promise.all([
      db.organisation.findUnique({
        where: { id: orgId },
        select: { complianceScore: true, activeFrameworks: true },
      }),

      db.incident.groupBy({
        by: ['severity'],
        where: { orgId, status: { in: ['OPEN', 'INVESTIGATING', 'ESCALATED'] } },
        _count: { id: true },
      }),

      db.incident.count({
        where: { orgId, occurredAt: { gte: todayStart } },
      }),

      db.incident.findFirst({
        where: { orgId },
        orderBy: { occurredAt: 'desc' },
        select: { occurredAt: true },
      }),

      db.incident.findFirst({
        where: {
          orgId,
          severity: { in: ['CRITICAL', 'HIGH'] },
          status: { not: 'FALSE_POSITIVE' },
        },
        orderBy: { occurredAt: 'desc' },
        select: { occurredAt: true },
      }),

      db.incident.findMany({
        where: { orgId, occurredAt: { gte: thirtyDaysAgo } },
        select: { occurredAt: true, severity: true },
        orderBy: { occurredAt: 'asc' },
      }),

      db.incident.groupBy({
        by: ['channel'],
        where: { orgId },
        _count: { id: true },
      }),

      db.incident.findMany({
        where: { orgId },
        orderBy: { occurredAt: 'desc' },
        take: 5,
        include: {
          staffMember: true,
          assignedTo: { select: { id: true, name: true, email: true, avatarUrl: true } },
          resolvedBy: { select: { id: true, name: true, email: true, avatarUrl: true } },
        },
      }),

      db.ruleOverride.count({
        where: { orgId, action: { not: 'MUTE' } },
      }),

      db.scoreHistory.findMany({
        where: { orgId, recordedAt: { gte: sevenDaysAgo } },
        orderBy: { recordedAt: 'asc' },
        take: 1,
      }),

      db.ruleOverride.findMany({
        where: { orgId },
        select: { ruleCode: true, action: true },
      }),
    ])

    // Compile open incidents by severity
    const openBySeverity: Record<string, number> = {}
    let openTotal = 0
    for (const row of openIncidents) {
      openBySeverity[row.severity] = row._count.id
      openTotal += row._count.id
    }

    // Last event minutes ago
    const lastEventMinutesAgo = lastEvent
      ? Math.floor((now.getTime() - lastEvent.occurredAt.getTime()) / 60_000)
      : null

    // Days clean
    let daysClean = 0
    if (!lastCriticalOrHigh) {
      const firstIncident = await db.incident.findFirst({
        where: { orgId },
        orderBy: { occurredAt: 'asc' },
        select: { occurredAt: true },
      })
      if (firstIncident) {
        daysClean = Math.floor((now.getTime() - firstIncident.occurredAt.getTime()) / 86_400_000)
      }
    } else {
      daysClean = Math.floor((now.getTime() - lastCriticalOrHigh.occurredAt.getTime()) / 86_400_000)
    }

    // Build 30-day risk trend
    const trendMap = new Map<string, { critical: number; high: number; medium: number; low: number }>()
    for (let i = 29; i >= 0; i--) {
      const date = format(subDays(now, i), 'yyyy-MM-dd')
      trendMap.set(date, { critical: 0, high: 0, medium: 0, low: 0 })
    }
    for (const incident of thirtyDayIncidents) {
      const date = format(incident.occurredAt, 'yyyy-MM-dd')
      const entry = trendMap.get(date)
      if (entry) {
        const sev = incident.severity.toLowerCase() as 'critical' | 'high' | 'medium' | 'low'
        if (sev in entry) entry[sev]++
      }
    }
    const riskTrend = Array.from(trendMap.entries()).map(([date, counts]) => ({
      date,
      ...counts,
    }))

    // Channel breakdown
    const channelBreakdown = channelCounts.map((row) => ({
      channel: row.channel as string,
      count: row._count.id,
    }))

    // Compliance score trend (delta vs 7 days ago)
    const oldScore = scoreHistory[0]?.score ?? org?.complianceScore ?? 100
    const currentScore = org?.complianceScore ?? 100
    const scoreTrend = currentScore - oldScore

    // Framework coverage (active rules vs overridden/muted)
    const frameworks = (org?.activeFrameworks ?? []) as Framework[]
    const mutedRuleCodes = new Set(
      ruleOverrides.filter((r) => r.action === 'MUTE').map((r) => r.ruleCode)
    )

    // Import compliance rules dynamically to avoid circular deps
    let allRules: Array<{ code: string; framework: string }> = []
    try {
      const { COMPLIANCE_RULES } = await import('@/lib/compliance/rules')
      allRules = COMPLIANCE_RULES as Array<{ code: string; framework: string }>
    } catch {
      // Rules may not be defined yet — return empty framework coverage
    }

    const frameworkCoverage = frameworks.map((fw) => {
      const frameworkRules = allRules.filter((r) => r.framework === fw)
      const totalRules = frameworkRules.length
      const cleanRules = frameworkRules.filter((r) => !mutedRuleCodes.has(r.code)).length
      return { framework: fw as string, cleanRules, totalRules }
    })

    return NextResponse.json({
      complianceScore: currentScore,
      scoreTrend,
      openIncidents: {
        total: openTotal,
        critical: openBySeverity['CRITICAL'] ?? 0,
        high: openBySeverity['HIGH'] ?? 0,
        medium: openBySeverity['MEDIUM'] ?? 0,
        low: openBySeverity['LOW'] ?? 0,
      },
      eventsScannedToday: eventsToday,
      lastEventMinutesAgo,
      daysClean,
      riskTrend,
      channelBreakdown,
      recentIncidents,
      frameworkCoverage,
      activeRulesCount,
    })
  } catch (error) {
    console.error('[dashboard/stats] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
