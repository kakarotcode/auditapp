import { Suspense } from 'react'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { subDays, startOfDay, format } from 'date-fns'
import { ComplianceScoreCard } from '@/components/dashboard/ComplianceScoreCard'
import { RiskTrendChart } from '@/components/dashboard/RiskTrendChart'
import { ChannelBreakdown } from '@/components/dashboard/ChannelBreakdown'
import { RecentIncidentsList } from '@/components/dashboard/RecentIncidentsList'
import { TopViolatorsTable } from '@/components/dashboard/TopViolatorsTable'
import { StatCard } from '@/components/dashboard/StatCard'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, Scan, CalendarCheck, Shield } from 'lucide-react'
import type { Framework } from '@prisma/client'

async function getDashboardStats(orgId: string) {
  const now = new Date()
  const todayStart = startOfDay(now)
  const sevenDaysAgo = subDays(now, 7)
  const thirtyDaysAgo = subDays(now, 30)

  const [
    org,
    openIncidents,
    eventsToday,
    lastEvent,
    lastCriticalOrHigh,
    thirtyDayIncidents,
    channelCounts,
    recentIncidents,
    scoreHistory,
    ruleOverrides,
    topViolatorsRaw,
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
    db.incident.count({ where: { orgId, occurredAt: { gte: todayStart } } }),
    db.incident.findFirst({
      where: { orgId },
      orderBy: { occurredAt: 'desc' },
      select: { occurredAt: true },
    }),
    db.incident.findFirst({
      where: { orgId, severity: { in: ['CRITICAL', 'HIGH'] }, status: { not: 'FALSE_POSITIVE' } },
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
      select: {
        id: true, severity: true, ruleCode: true, ruleName: true,
        channel: true, occurredAt: true, status: true, framework: true,
        staffIdentifier: true,
      },
    }),
    db.scoreHistory.findMany({
      where: { orgId, recordedAt: { gte: sevenDaysAgo } },
      orderBy: { recordedAt: 'asc' },
      take: 1,
    }),
    db.ruleOverride.findMany({ where: { orgId }, select: { ruleCode: true, action: true } }),
    db.staffMember.findMany({
      where: { orgId, totalIncidents: { gt: 0 } },
      orderBy: { totalIncidents: 'desc' },
      take: 10,
      select: {
        id: true, name: true, department: true, totalIncidents: true, lastIncidentAt: true,
        incidents: { where: { orgId }, select: { severity: true } },
      },
    }),
  ])

  const openBySeverity: Record<string, number> = {}
  let openTotal = 0
  for (const row of openIncidents) {
    openBySeverity[row.severity] = row._count.id
    openTotal += row._count.id
  }

  const lastEventMinutesAgo = lastEvent
    ? Math.floor((now.getTime() - lastEvent.occurredAt.getTime()) / 60_000)
    : null

  let daysClean = 0
  if (!lastCriticalOrHigh) {
    const first = await db.incident.findFirst({
      where: { orgId },
      orderBy: { occurredAt: 'asc' },
      select: { occurredAt: true },
    })
    if (first) daysClean = Math.floor((now.getTime() - first.occurredAt.getTime()) / 86_400_000)
  } else {
    daysClean = Math.floor((now.getTime() - lastCriticalOrHigh.occurredAt.getTime()) / 86_400_000)
  }

  const trendMap = new Map<string, { critical: number; high: number; medium: number; low: number }>()
  for (let i = 29; i >= 0; i--) {
    trendMap.set(format(subDays(now, i), 'yyyy-MM-dd'), { critical: 0, high: 0, medium: 0, low: 0 })
  }
  for (const inc of thirtyDayIncidents) {
    const date = format(inc.occurredAt, 'yyyy-MM-dd')
    const entry = trendMap.get(date)
    if (entry) {
      const sev = inc.severity.toLowerCase() as 'critical' | 'high' | 'medium' | 'low'
      if (sev in entry) entry[sev]++
    }
  }

  const oldScore = scoreHistory[0]?.score ?? org?.complianceScore ?? 100
  const currentScore = org?.complianceScore ?? 100
  const frameworks = (org?.activeFrameworks ?? []) as Framework[]
  const mutedRuleCodes = new Set(ruleOverrides.filter(r => r.action === 'MUTE').map(r => r.ruleCode))

  let allRules: Array<{ code: string; framework: string }> = []
  try {
    const { COMPLIANCE_RULES } = await import('@/lib/compliance/rules')
    allRules = COMPLIANCE_RULES
  } catch { /* rules not available */ }

  const frameworkCoverage = frameworks.map((fw) => {
    const fwRules = allRules.filter(r => r.framework === fw)
    const totalRules = fwRules.length
    const cleanRules = fwRules.filter(r => !mutedRuleCodes.has(r.code)).length
    return { framework: fw as string, cleanRules, totalRules }
  })

  const topViolators = topViolatorsRaw.map(sm => {
    const counts = { critical: 0, high: 0, medium: 0, low: 0 }
    for (const inc of sm.incidents) {
      const sev = inc.severity.toLowerCase() as keyof typeof counts
      if (sev in counts) counts[sev]++
    }
    return {
      id: sm.id, name: sm.name, department: sm.department,
      totalIncidents: sm.totalIncidents,
      lastIncidentAt: sm.lastIncidentAt?.toISOString() ?? null,
      ...counts,
    }
  })

  return {
    complianceScore: currentScore,
    scoreTrend: currentScore - oldScore,
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
    riskTrend: Array.from(trendMap.entries()).map(([date, counts]) => ({ date, ...counts })),
    channelBreakdown: channelCounts.map(r => ({ channel: r.channel as string, count: r._count.id })),
    recentIncidents: recentIncidents.map(inc => ({
      ...inc,
      occurredAt: inc.occurredAt.toISOString(),
      framework: inc.framework as string,
    })),
    frameworkCoverage,
    activeRulesCount: allRules.length,
    topViolators,
  }
}

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user?.orgId) redirect('/login')

  const stats = await getDashboardStats(session.user.orgId)
  const { complianceScore: score, scoreTrend, openIncidents } = stats

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Compliance Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Real-time DPDP monitoring for your organisation</p>
        </div>
        <div className="hidden sm:flex items-center gap-2 rounded-xl bg-white border border-gray-100 shadow-card px-3 py-2">
          <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs font-medium text-gray-600">Live monitoring</span>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* Compliance Score */}
        <div className="relative bg-white rounded-2xl p-5 shadow-card border border-gray-100 border-t-[3px] border-t-blue-500 overflow-hidden group card-hover">
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-blue-50/40 to-transparent pointer-events-none rounded-2xl" />
          <div className="relative">
            <div className="flex items-start justify-between mb-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 shadow-sm">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                scoreTrend > 0 ? 'bg-green-50 text-green-700' :
                scoreTrend < 0 ? 'bg-red-50 text-red-600' : 'bg-gray-50 text-gray-500'
              }`}>
                {scoreTrend >= 0 ? '↑' : '↓'} {Math.abs(scoreTrend)}pts
              </span>
            </div>
            <div className={`text-3xl font-bold tracking-tight ${
              score >= 80 ? 'text-gray-900' : score >= 60 ? 'text-amber-600' : 'text-red-600'
            }`}>
              {score}<span className="text-lg text-gray-400 font-semibold">/100</span>
            </div>
            <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-gray-400">Compliance Score</p>
            <ComplianceScoreCard score={score} trend={scoreTrend} lastUpdated="Just now" inline />
          </div>
        </div>

        {/* Open Incidents */}
        <StatCard
          label="Open Incidents"
          value={openIncidents.total}
          icon={<AlertTriangle className="h-5 w-5 text-white" />}
          iconBg="bg-gradient-to-br from-orange-400 to-red-500"
          accentColor="border-t-[3px] border-t-orange-500"
          subtext={
            <div className="flex flex-wrap gap-1.5 mt-1">
              {openIncidents.critical > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-600">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-500" />{openIncidents.critical}C
                </span>
              )}
              {openIncidents.high > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2 py-0.5 text-[10px] font-semibold text-orange-600">
                  <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />{openIncidents.high}H
                </span>
              )}
              {openIncidents.medium > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-600">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />{openIncidents.medium}M
                </span>
              )}
              {openIncidents.low > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-gray-50 px-2 py-0.5 text-[10px] font-semibold text-gray-500">
                  <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />{openIncidents.low}L
                </span>
              )}
              {openIncidents.total === 0 && (
                <span className="text-[11px] text-green-600 font-medium">✓ All clear</span>
              )}
            </div>
          }
        />

        {/* Events Scanned Today */}
        <StatCard
          label="Events Scanned Today"
          value={stats.eventsScannedToday}
          icon={<Scan className="h-5 w-5 text-white" />}
          iconBg="bg-gradient-to-br from-violet-500 to-purple-700"
          accentColor="border-t-[3px] border-t-violet-500"
          subtext={
            <span className="text-[11px] text-gray-400">
              {stats.lastEventMinutesAgo != null
                ? `Last scan ${stats.lastEventMinutesAgo}m ago`
                : 'No recent events'}
            </span>
          }
        />

        {/* Days Clean */}
        <StatCard
          label="Days Without Critical"
          value={stats.daysClean}
          icon={<CalendarCheck className="h-5 w-5 text-white" />}
          iconBg={stats.daysClean > 7
            ? 'bg-gradient-to-br from-green-400 to-emerald-600'
            : stats.daysClean > 0
            ? 'bg-gradient-to-br from-amber-400 to-orange-500'
            : 'bg-gradient-to-br from-red-400 to-red-600'}
          accentColor={stats.daysClean > 7 ? 'border-t-[3px] border-t-green-500' : stats.daysClean > 0 ? 'border-t-[3px] border-t-amber-500' : 'border-t-[3px] border-t-red-500'}
          subtext={
            <span className={`text-[11px] font-medium ${stats.daysClean > 7 ? 'text-green-600' : stats.daysClean > 0 ? 'text-amber-600' : 'text-red-600'}`}>
              {stats.daysClean > 7 ? '✓ Excellent streak' : stats.daysClean > 0 ? '⚠ Keep monitoring' : '✗ Recent incident'}
            </span>
          }
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Suspense fallback={<Skeleton className="h-[300px] w-full rounded-2xl" />}>
            <RiskTrendChart data={stats.riskTrend} />
          </Suspense>
        </div>
        <div>
          <Suspense fallback={<Skeleton className="h-[300px] w-full rounded-2xl" />}>
            <ChannelBreakdown data={stats.channelBreakdown} />
          </Suspense>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <RecentIncidentsList initialIncidents={stats.recentIncidents} />

        {/* Framework Coverage */}
        <Card className="rounded-2xl border-gray-100 shadow-card">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-gray-900">Framework Coverage</CardTitle>
              <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-semibold text-[#1E6FD9]">
                {stats.activeRulesCount} rules
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {stats.frameworkCoverage.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No frameworks configured</p>
            ) : (
              stats.frameworkCoverage.map((fw) => {
                const pct = fw.totalRules > 0 ? Math.round((fw.cleanRules / fw.totalRules) * 100) : 100
                const barColor = pct > 75 ? 'bg-gradient-to-r from-green-400 to-emerald-500' :
                                 pct > 50 ? 'bg-gradient-to-r from-amber-400 to-orange-500' :
                                            'bg-gradient-to-r from-red-400 to-red-500'
                return (
                  <div key={fw.framework}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-semibold text-gray-700">{fw.framework}</span>
                      <span className={`text-xs font-bold ${pct > 75 ? 'text-green-600' : pct > 50 ? 'text-amber-600' : 'text-red-600'}`}>
                        {pct}%
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${barColor} transition-all duration-700 ease-out`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-gray-400 mt-0.5">{fw.cleanRules}/{fw.totalRules} rules active</p>
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>
      </div>

      <TopViolatorsTable data={stats.topViolators} />
    </div>
  )
}
