'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSearchParams, useRouter } from 'next/navigation'
import { IncidentTable } from '@/components/incidents/IncidentTable'
import { IncidentFilters } from '@/components/incidents/IncidentFilters'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { Download } from 'lucide-react'

export default function IncidentsPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const params = {
    page: searchParams.get('page') ?? '1',
    severity: searchParams.get('severity') ?? '',
    status: searchParams.get('status') ?? '',
    framework: searchParams.get('framework') ?? '',
    channel: searchParams.get('channel') ?? '',
    search: searchParams.get('search') ?? '',
    dateFrom: searchParams.get('dateFrom') ?? '',
    dateTo: searchParams.get('dateTo') ?? '',
  }

  const queryString = new URLSearchParams(
    Object.fromEntries(Object.entries(params).filter(([, v]) => v !== ''))
  ).toString()

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['incidents', queryString],
    queryFn: () => fetch(`/api/incidents?${queryString}&limit=25`).then(r => r.json()),
  })

  async function bulkResolve() {
    try {
      await Promise.all(
        selectedIds.map(id =>
          fetch(`/api/incidents/${id}/resolve`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ resolution: 'ACKNOWLEDGED', resolutionNote: 'Bulk resolved' }),
          })
        )
      )
      toast.success(`${selectedIds.length} incidents resolved`)
      setSelectedIds([])
      refetch()
    } catch {
      toast.error('Failed to resolve incidents')
    }
  }

  function exportCsv() {
    const incidents = data?.incidents ?? []
    const csv = [
      'ID,Severity,Rule Code,Rule Name,Channel,Status,Occurred At',
      ...incidents.map((i: { id: string; severity: string; ruleCode: string; ruleName: string; channel: string; status: string; occurredAt: string }) =>
        `${i.id},${i.severity},${i.ruleCode},"${i.ruleName}",${i.channel},${i.status},${new Date(i.occurredAt).toLocaleDateString('en-IN')}`
      ),
    ].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `incidents-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Incidents"
        description={`${data?.total ?? 0} total incidents`}
        action={
          <Button variant="outline" size="sm" onClick={exportCsv}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        }
      />

      {selectedIds.length > 0 && (
        <div className="flex items-center gap-3 rounded-lg bg-blue-50 border border-blue-200 p-3">
          <span className="text-sm text-blue-700 font-medium">{selectedIds.length} selected</span>
          <Button size="sm" onClick={bulkResolve}>Mark Resolved</Button>
          <Button size="sm" variant="outline" onClick={() => setSelectedIds([])}>Clear</Button>
        </div>
      )}

      <IncidentFilters />

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}
        </div>
      ) : (
        <IncidentTable
          incidents={data?.incidents ?? []}
          total={data?.total ?? 0}
          page={parseInt(params.page)}
          totalPages={data?.totalPages ?? 1}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          onPageChange={(p) => {
            const sp = new URLSearchParams(searchParams.toString())
            sp.set('page', String(p))
            router.push(`/incidents?${sp.toString()}`)
          }}
        />
      )}
    </div>
  )
}
