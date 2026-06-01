'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ReportCard } from '@/components/reports/ReportCard'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/shared/EmptyState'
import { toast } from 'sonner'
import { FileText, Plus } from 'lucide-react'

type ReportType = 'AUDIT' | 'WEEKLY' | 'MONTHLY' | 'INCIDENT_SUMMARY'

type Report = {
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

export default function ReportsPage() {
  const [generateOpen, setGenerateOpen] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [form, setForm] = useState({
    type: 'AUDIT' as ReportType,
    periodStart: '',
    periodEnd: '',
    title: '',
  })

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['reports'],
    queryFn: () => fetch('/api/reports').then(r => r.json()),
    refetchInterval: 15000,
  })

  async function generate() {
    if (!form.periodStart || !form.periodEnd) {
      toast.error('Please select a date range')
      return
    }
    setGenerating(true)
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error()
      toast.success('Report generation started. This may take a few minutes.')
      setGenerateOpen(false)
      refetch()
    } catch {
      toast.error('Failed to start report generation')
    } finally {
      setGenerating(false)
    }
  }

  const reports: Report[] = data?.reports ?? []

  return (
    <div className="space-y-6">
      <PageHeader
        title="Compliance Reports"
        description="Generate and download DPDP audit-ready reports"
        action={
          <Button onClick={() => setGenerateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Generate Report
          </Button>
        }
      />

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
        </div>
      ) : reports.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No reports yet"
          description="Generate your first DPDP compliance report"
          action={{ label: 'Generate Report', onClick: () => setGenerateOpen(true) }}
        />
      ) : (
        <div className="space-y-3">
          {reports.map((report) => (
            <ReportCard key={report.id} report={report} />
          ))}
        </div>
      )}

      <Dialog open={generateOpen} onOpenChange={setGenerateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate Compliance Report</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Report Type</Label>
              <Select value={form.type} onValueChange={(v) => setForm(p => ({ ...p, type: v as ReportType }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AUDIT">DPDP Audit Report (DPB-ready)</SelectItem>
                  <SelectItem value="WEEKLY">Weekly Summary</SelectItem>
                  <SelectItem value="MONTHLY">Monthly Report</SelectItem>
                  <SelectItem value="INCIDENT_SUMMARY">Incident Summary</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>From</Label>
                <Input type="date" value={form.periodStart} onChange={e => setForm(p => ({ ...p, periodStart: e.target.value }))} />
              </div>
              <div>
                <Label>To</Label>
                <Input type="date" value={form.periodEnd} onChange={e => setForm(p => ({ ...p, periodEnd: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label>Title (optional)</Label>
              <Input placeholder="Auto-generated if blank" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
            </div>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setGenerateOpen(false)}>Cancel</Button>
              <Button onClick={generate} disabled={generating}>
                {generating ? 'Generating…' : 'Generate'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
