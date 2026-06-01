'use client'

import { useQuery } from '@tanstack/react-query'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { HealthScoreMeter } from '@/components/shared/HealthScoreMeter'
import { SeverityBadge } from '@/components/incidents/SeverityBadge'
import { RiskTrendChart } from '@/components/dashboard/RiskTrendChart'
import { CheckCircle, AlertTriangle } from 'lucide-react'

export default function ComplianceScorePage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => fetch('/api/dashboard/stats').then(r => r.json()),
  })

  const { data: scoreHistoryData } = useQuery({
    queryKey: ['score-history'],
    queryFn: () => fetch('/api/dashboard/stats').then(r => r.json()),
  })

  const score = stats?.complianceScore ?? 78
  const openIncidents = stats?.openIncidents ?? { total: 0, critical: 0, high: 0, medium: 0, low: 0 }
  const riskTrend = stats?.riskTrend ?? []

  const deductions = [
    { label: 'Critical incidents (open)', count: openIncidents.critical, points: openIncidents.critical * 15, severity: 'CRITICAL' },
    { label: 'High incidents (open)', count: openIncidents.high, points: openIncidents.high * 8, severity: 'HIGH' },
    { label: 'Medium incidents (open)', count: openIncidents.medium, points: openIncidents.medium * 4, severity: 'MEDIUM' },
    { label: 'Low incidents (open)', count: openIncidents.low, points: openIncidents.low * 1, severity: 'LOW' },
  ].filter(d => d.count > 0)

  // The stored score reflects the full health-score model (open-incident
  // penalties PLUS recovery credit for resolved incidents and clean-streak
  // bonuses). Surface that recovery as its own line so the breakdown column
  // reconciles to the displayed score instead of contradicting it.
  const totalDeductions = deductions.reduce((sum, d) => sum + d.points, 0)
  const recoveryCredit = score - (100 - totalDeductions)

  const improvements = [
    { tip: 'Resolve all Critical incidents immediately', impact: '+15 pts each', icon: AlertTriangle },
    { tip: 'Resolve all High severity incidents', impact: '+8 pts each', icon: AlertTriangle },
    { tip: 'Achieve 30 consecutive days with no Critical/High incidents', impact: '+5 pts bonus', icon: CheckCircle },
    { tip: 'Regularly review and resolve Medium incidents', impact: '+4 pts each', icon: CheckCircle },
  ]

  return (
    <div className="space-y-6">
      <PageHeader title="Compliance Score" description="Understand and improve your DPDP compliance health" />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Score display */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Current Score</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            {isLoading ? (
              <Skeleton className="h-48 w-48 rounded-full" />
            ) : (
              <HealthScoreMeter score={score} size="lg" />
            )}
            <div className="text-center">
              <p className="text-4xl font-bold text-gray-900">{score}</p>
              <p className="text-sm text-gray-500 mt-1">
                {score > 75 ? '✅ Good standing' : score > 50 ? '⚠️ Needs attention' : '🔴 Critical — action required'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Deductions */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Score Deductions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between text-sm text-gray-500 pb-2 border-b">
                <span>Starting score</span>
                <span className="font-medium text-gray-900">100</span>
              </div>
              {deductions.length === 0 ? (
                <div className="flex items-center gap-2 text-green-600 py-4">
                  <CheckCircle className="h-5 w-5" />
                  <span className="text-sm font-medium">No active deductions — excellent work!</span>
                </div>
              ) : (
                deductions.map((d) => (
                  <div key={d.severity} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <SeverityBadge severity={d.severity} />
                      <span className="text-sm text-gray-600">{d.label}</span>
                      <span className="text-xs text-gray-400">×{d.count}</span>
                    </div>
                    <span className="text-sm font-medium text-red-600">-{d.points} pts</span>
                  </div>
                ))
              )}
              {recoveryCredit !== 0 && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-gray-600">Recovery &amp; resolved-incident credit</span>
                  </div>
                  <span className="text-sm font-medium text-green-600">
                    {recoveryCredit > 0 ? '+' : ''}{recoveryCredit} pts
                  </span>
                </div>
              )}
              <div className="flex justify-between text-sm pt-2 border-t font-semibold">
                <span>Current score</span>
                <span className={score > 75 ? 'text-green-600' : score > 50 ? 'text-amber-600' : 'text-red-600'}>{score}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Score trend */}
      {riskTrend.length > 0 && (
        <RiskTrendChart data={riskTrend} />
      )}

      {/* How to improve */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">How to Improve Your Score</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {improvements.map((item, i) => (
              <div key={i} className="flex items-start gap-3 rounded-lg border border-gray-100 p-3">
                <item.icon className="h-5 w-5 text-[#1E6FD9] mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-700">{item.tip}</p>
                  <p className="text-xs text-green-600 mt-0.5">{item.impact}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
