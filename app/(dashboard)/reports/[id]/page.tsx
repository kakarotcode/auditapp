'use client'

import { useQuery } from '@tanstack/react-query'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowLeft, Download, FileText } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { formatDate } from '@/lib/utils'

export default function ReportViewerPage() {
  const { id } = useParams<{ id: string }>()

  const { data, isLoading } = useQuery({
    queryKey: ['report', id],
    queryFn: () => fetch(`/api/reports/${id}`).then(r => r.json()),
    enabled: !!id,
    refetchInterval: (query) => query.state.data?.report?.status === 'GENERATING' ? 5000 : false,
  })

  async function download() {
    try {
      const res = await fetch(`/api/reports/${id}/download`)
      const json = await res.json() as { downloadUrl?: string }
      if (json.downloadUrl) {
        window.open(json.downloadUrl, '_blank')
      } else {
        toast.error('Download URL not available')
      }
    } catch {
      toast.error('Failed to get download link')
    }
  }

  const report = data?.report

  const statusColor: Record<string, string> = {
    READY: 'bg-green-100 text-green-700',
    GENERATING: 'bg-yellow-100 text-yellow-700',
    FAILED: 'bg-red-100 text-red-700',
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link href="/reports"><ArrowLeft className="mr-2 h-4 w-4" />Back to Reports</Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-[600px] w-full rounded-xl" />
        </div>
      ) : !report ? (
        <Card><CardContent className="py-12 text-center text-gray-500">Report not found</CardContent></Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{report.title}</CardTitle>
                  <p className="text-sm text-gray-500 mt-1">{report.period}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {formatDate(report.periodStart)} — {formatDate(report.periodEnd)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={statusColor[report.status] ?? ''}>
                    {report.status === 'GENERATING' ? (
                      <span className="flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full bg-yellow-500 animate-pulse" />
                        Generating…
                      </span>
                    ) : report.status}
                  </Badge>
                  {report.status === 'READY' && (
                    <Button size="sm" onClick={download}>
                      <Download className="mr-2 h-4 w-4" />
                      Download PDF
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
          </Card>

          {report.status === 'GENERATING' && (
            <Card>
              <CardContent className="py-16 text-center">
                <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-[#0F2B5B] border-t-transparent mb-4" />
                <p className="text-gray-600 font-medium">Generating your report…</p>
                <p className="text-sm text-gray-400 mt-1">This may take a minute. The page will refresh automatically.</p>
              </CardContent>
            </Card>
          )}

          {report.status === 'READY' && report.downloadUrl && (
            <Card>
              <CardContent className="p-0">
                <div className="flex flex-col items-center justify-center py-16 gap-4">
                  <FileText className="h-16 w-16 text-[#0F2B5B] opacity-30" />
                  <p className="text-gray-600">PDF report is ready</p>
                  <Button onClick={download}>
                    <Download className="mr-2 h-4 w-4" />
                    Download PDF Report
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {report.status === 'FAILED' && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="py-8 text-center">
                <p className="text-red-600 font-medium">Report generation failed</p>
                <p className="text-sm text-red-400 mt-1">Please try generating the report again</p>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
