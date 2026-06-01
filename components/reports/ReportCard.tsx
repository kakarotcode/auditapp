'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { formatDate } from '@/lib/utils'
import { FileText, Download, Loader2, CheckCircle, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Report {
  id: string
  type: string
  title: string
  period: string
  periodStart: string
  periodEnd: string
  status: string
  downloadUrl?: string | null
  metadata?: Record<string, unknown> | null
  generatedAt: string | null
  createdAt: string
}

const TYPE_LABEL: Record<string, string> = {
  AUDIT: 'DPDP Audit',
  WEEKLY: 'Weekly Summary',
  MONTHLY: 'Monthly Report',
  INCIDENT_SUMMARY: 'Incident Summary',
}

const STATUS_CONFIG: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
  GENERATING: { label: 'Generating', className: 'bg-blue-50 text-blue-700 border-blue-200',   icon: <Loader2 className="h-3 w-3 animate-spin" /> },
  READY:      { label: 'Ready',      className: 'bg-green-50 text-green-700 border-green-200', icon: <CheckCircle className="h-3 w-3" /> },
  FAILED:     { label: 'Failed',     className: 'bg-red-50 text-red-700 border-red-200',        icon: null },
}

export function ReportCard({ report }: { report: Report }) {
  const qc = useQueryClient()

  const downloadMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/reports/${report.id}/download`)
      if (!res.ok) throw new Error('Download failed')
      const data = await res.json() as { url: string }
      return data.url
    },
    onSuccess: (url) => { window.open(url, '_blank') },
    onError: () => toast.error('Download failed'),
  })

  const regenerateMutation = useMutation({
    mutationFn: () => fetch(`/api/reports/${report.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'regenerate' }),
    }),
    onSuccess: () => {
      toast.success('Report queued for regeneration')
      qc.invalidateQueries({ queryKey: ['reports'] })
    },
    onError: () => toast.error('Failed to regenerate'),
  })

  const statusCfg = STATUS_CONFIG[report.status] ?? STATUS_CONFIG.GENERATING
  const incidentCount = (report.metadata as { incidentCount?: number } | null)?.incidentCount

  return (
    <Card className="hover:shadow-sm transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#0F2B5B]/10">
            <FileText className="h-5 w-5 text-[#0F2B5B]" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-sm text-gray-900 truncate">{report.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {TYPE_LABEL[report.type] ?? report.type} · {report.period}
                </p>
              </div>
              <Badge className={cn('border text-xs flex items-center gap-1 shrink-0', statusCfg.className)}>
                {statusCfg.icon}{statusCfg.label}
              </Badge>
            </div>

            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {incidentCount != null && (
                  <span className="text-xs text-gray-500">{incidentCount} incidents</span>
                )}
                {report.generatedAt && (
                  <span className="text-xs text-gray-400">Generated {formatDate(report.generatedAt)}</span>
                )}
              </div>

              <div className="flex gap-2">
                {report.status === 'READY' ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => downloadMutation.mutate()}
                    disabled={downloadMutation.isPending}
                  >
                    {downloadMutation.isPending
                      ? <Loader2 className="h-4 w-4 animate-spin mr-1" />
                      : <Download className="h-4 w-4 mr-1" />}
                    Download
                  </Button>
                ) : report.status === 'FAILED' ? (
                  <Button size="sm" variant="outline" onClick={() => regenerateMutation.mutate()} disabled={regenerateMutation.isPending}>
                    Regenerate
                  </Button>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
