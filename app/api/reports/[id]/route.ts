import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.orgId) {
      return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 })
    }

    const report = await db.report.findFirst({
      where: { id: params.id, orgId: session.user.orgId },
    })
    if (!report) {
      return NextResponse.json({ error: 'Report not found', code: 'NOT_FOUND' }, { status: 404 })
    }

    // Compute a live summary for the report's period — works for any report
    // (seeded or generated), with no stored snapshot or PDF file needed.
    const [org, incidents] = await Promise.all([
      db.organisation.findUnique({
        where: { id: session.user.orgId },
        select: { name: true, gstin: true, vertical: true, complianceScore: true, activeFrameworks: true },
      }),
      db.incident.findMany({
        where: {
          orgId: session.user.orgId,
          occurredAt: { gte: report.periodStart, lte: report.periodEnd },
        },
        select: { severity: true, status: true, framework: true, ruleName: true, ruleCode: true, channel: true, occurredAt: true, entityTypes: true },
        orderBy: { occurredAt: 'desc' },
      }),
    ])

    const bySeverity: Record<string, number> = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 }
    const byStatus: Record<string, number> = { OPEN: 0, INVESTIGATING: 0, RESOLVED: 0, FALSE_POSITIVE: 0, ESCALATED: 0 }
    const byFramework: Record<string, number> = {}
    for (const i of incidents) {
      bySeverity[i.severity] = (bySeverity[i.severity] ?? 0) + 1
      byStatus[i.status] = (byStatus[i.status] ?? 0) + 1
      byFramework[i.framework] = (byFramework[i.framework] ?? 0) + 1
    }

    return NextResponse.json({
      report,
      org,
      summary: {
        total: incidents.length,
        bySeverity,
        byStatus,
        byFramework,
        resolved: byStatus.RESOLVED + byStatus.FALSE_POSITIVE,
        open: byStatus.OPEN + byStatus.INVESTIGATING + byStatus.ESCALATED,
        complianceScore: org?.complianceScore ?? null,
      },
      incidents: incidents.map((i) => ({
        ruleName: i.ruleName,
        ruleCode: i.ruleCode,
        severity: i.severity,
        status: i.status,
        framework: i.framework,
        channel: i.channel,
        occurredAt: i.occurredAt,
        entityTypes: i.entityTypes,
      })),
    })
  } catch (error) {
    console.error('[reports/[id] GET] Error:', error)
    return NextResponse.json({ error: 'Internal server error', code: 'INTERNAL_ERROR' }, { status: 500 })
  }
}
