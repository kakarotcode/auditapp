'use client'

import { useQuery } from '@tanstack/react-query'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowLeft, Download, Shield } from 'lucide-react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'

interface ReportData {
  report: { id: string; title: string; type: string; period: string; periodStart: string; periodEnd: string; status: string; generatedAt: string | null }
  org: { name: string; gstin: string | null; vertical: string; complianceScore: number; activeFrameworks: string[] } | null
  summary: {
    total: number
    bySeverity: Record<string, number>
    byStatus: Record<string, number>
    byFramework: Record<string, number>
    resolved: number
    open: number
    complianceScore: number | null
  }
  incidents: Array<{ ruleName: string; ruleCode: string; severity: string; status: string; framework: string; channel: string; occurredAt: string; entityTypes: string[] }>
}

const SEV_COLOR: Record<string, string> = {
  CRITICAL: '#DC2626', HIGH: '#EA580C', MEDIUM: '#D97706', LOW: '#2563EB',
}

export default function ReportViewerPage() {
  const { id } = useParams<{ id: string }>()
  const { data, isLoading } = useQuery<ReportData>({
    queryKey: ['report', id],
    queryFn: () => fetch(`/api/reports/${id}`).then((r) => r.json()),
    enabled: !!id,
  })

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-[600px] w-full rounded-xl" />
      </div>
    )
  }
  if (!data?.report) {
    return <div className="py-12 text-center text-gray-500">Report not found</div>
  }

  const { report, org, summary, incidents } = data

  return (
    <div className="space-y-4">
      {/* Screen-only toolbar */}
      <div className="no-print flex items-center justify-between">
        <Button asChild variant="ghost" size="sm">
          <Link href="/reports"><ArrowLeft className="mr-2 h-4 w-4" />Back to Reports</Link>
        </Button>
        <Button size="sm" onClick={() => window.print()}>
          <Download className="mr-2 h-4 w-4" />Save as PDF
        </Button>
      </div>

      {/* Printable report */}
      <div className="print-area mx-auto max-w-4xl rounded-xl border border-gray-200 bg-white p-8 sm:p-10 text-gray-900">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-gray-200 pb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0F2B5B]">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-lg font-bold text-[#0F2B5B]">KavachAI</p>
              <p className="text-xs text-gray-500">DPDP Compliance Evidence Report</p>
            </div>
          </div>
          <div className="text-right text-xs text-gray-500">
            <p className="font-semibold text-gray-800">{report.title}</p>
            <p>{report.period}</p>
            <p>Generated {report.generatedAt ? formatDate(report.generatedAt) : '—'}</p>
          </div>
        </div>

        {/* Org */}
        <div className="mt-5 grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-400">Organisation</p>
            <p className="font-semibold">{org?.name ?? '—'}</p>
            {org?.gstin && <p className="text-xs text-gray-500">GSTIN: {org.gstin}</p>}
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-wide text-gray-400">Monitoring period</p>
            <p className="font-medium">{formatDate(report.periodStart)} — {formatDate(report.periodEnd)}</p>
            <p className="text-xs text-gray-500">Frameworks: {(org?.activeFrameworks ?? []).join(', ') || '—'}</p>
          </div>
        </div>

        {/* Executive summary */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'Compliance Score', value: `${summary.complianceScore ?? '—'}/100` },
            { label: 'Total Incidents', value: summary.total },
            { label: 'Open', value: summary.open },
            { label: 'Resolved', value: summary.resolved },
          ].map((m) => (
            <div key={m.label} className="rounded-lg border border-gray-100 bg-gray-50 p-3 text-center">
              <p className="text-2xl font-bold text-[#0F2B5B]">{m.value}</p>
              <p className="text-[11px] text-gray-500">{m.label}</p>
            </div>
          ))}
        </div>

        {/* Severity breakdown */}
        <h3 className="mt-7 mb-2 text-sm font-bold text-[#0F2B5B]">Incidents by severity</h3>
        <div className="flex flex-wrap gap-2">
          {(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const).map((s) => (
            <span key={s} className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold" style={{ background: `${SEV_COLOR[s]}1a`, color: SEV_COLOR[s] }}>
              <span className="h-2 w-2 rounded-full" style={{ background: SEV_COLOR[s] }} />
              {s}: {summary.bySeverity[s] ?? 0}
            </span>
          ))}
        </div>

        {/* Framework coverage */}
        {Object.keys(summary.byFramework).length > 0 && (
          <>
            <h3 className="mt-6 mb-2 text-sm font-bold text-[#0F2B5B]">By framework</h3>
            <div className="flex flex-wrap gap-2 text-xs">
              {Object.entries(summary.byFramework).map(([f, n]) => (
                <span key={f} className="rounded-full bg-blue-50 px-3 py-1 font-medium text-blue-700">{f}: {n}</span>
              ))}
            </div>
          </>
        )}

        {/* Incident log */}
        <h3 className="mt-7 mb-2 text-sm font-bold text-[#0F2B5B]">Incident log ({incidents.length})</h3>
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="border-b border-gray-200 text-left text-gray-500">
              <th className="py-2 pr-2">Date</th>
              <th className="py-2 pr-2">Rule</th>
              <th className="py-2 pr-2">Severity</th>
              <th className="py-2 pr-2">Framework</th>
              <th className="py-2 pr-2">Channel</th>
              <th className="py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {incidents.length === 0 ? (
              <tr><td colSpan={6} className="py-4 text-center text-gray-400">No incidents in this period — clean record.</td></tr>
            ) : incidents.map((i, idx) => (
              <tr key={idx} className="border-b border-gray-50">
                <td className="py-1.5 pr-2 whitespace-nowrap text-gray-500">{formatDate(i.occurredAt)}</td>
                <td className="py-1.5 pr-2">{i.ruleName} <span className="text-gray-400">({i.ruleCode})</span></td>
                <td className="py-1.5 pr-2 font-semibold" style={{ color: SEV_COLOR[i.severity] }}>{i.severity}</td>
                <td className="py-1.5 pr-2">{i.framework}</td>
                <td className="py-1.5 pr-2">{i.channel}</td>
                <td className="py-1.5">{i.status}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Footer */}
        <div className="mt-8 border-t border-gray-200 pt-4 text-center text-[10px] text-gray-400">
          <p>Generated by KavachAI — kavachai.in · Report ID: {report.id}</p>
          <p>This report is generated from monitored data as evidence of DPDP Act compliance posture. No raw personal data is stored — only classifications.</p>
        </div>
      </div>
    </div>
  )
}
