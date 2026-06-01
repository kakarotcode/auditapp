'use client'

import { useRouter } from 'next/navigation'
import { SeverityBadge } from './SeverityBadge'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { timeAgo, formatDate } from '@/lib/utils'
import { MessageSquare, Mail, FolderOpen, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Incident {
  id: string; severity: string; ruleCode: string; ruleName: string
  channel: string; staffIdentifier: string | null; occurredAt: string
  status: string; framework: string
}

interface Props {
  incidents: Incident[]
  total: number; page: number; totalPages: number
  selectedIds: string[]
  onSelectionChange: (ids: string[]) => void
  onPageChange: (page: number) => void
}

const CHANNEL_ICON: Record<string, React.ReactNode> = {
  WHATSAPP: <MessageSquare className="h-4 w-4 text-green-600" />,
  GMAIL: <Mail className="h-4 w-4 text-red-500" />,
  OUTLOOK: <Mail className="h-4 w-4 text-blue-600" />,
  GOOGLE_DRIVE: <FolderOpen className="h-4 w-4 text-yellow-500" />,
  ONEDRIVE: <FolderOpen className="h-4 w-4 text-blue-500" />,
}

const STATUS_STYLE: Record<string, string> = {
  OPEN: 'bg-red-50 text-red-700 border-red-200',
  INVESTIGATING: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  RESOLVED: 'bg-green-50 text-green-700 border-green-200',
  ESCALATED: 'bg-purple-50 text-purple-700 border-purple-200',
  FALSE_POSITIVE: 'bg-gray-50 text-gray-600 border-gray-200',
}

export function IncidentTable({ incidents, total, page, totalPages, selectedIds, onSelectionChange, onPageChange }: Props) {
  const router = useRouter()

  function toggleAll() {
    if (selectedIds.length === incidents.length) onSelectionChange([])
    else onSelectionChange(incidents.map(i => i.id))
  }

  function toggle(id: string) {
    onSelectionChange(selectedIds.includes(id) ? selectedIds.filter(s => s !== id) : [...selectedIds, id])
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-3 w-10">
                <Checkbox checked={selectedIds.length === incidents.length && incidents.length > 0} onCheckedChange={toggleAll} />
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Severity</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rule</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Channel</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Staff</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Occurred</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {incidents.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-12 text-center text-sm text-gray-400">No incidents found</td></tr>
            ) : (
              incidents.map(incident => (
                <tr
                  key={incident.id}
                  className={cn('hover:bg-gray-50 cursor-pointer transition-colors', selectedIds.includes(incident.id) && 'bg-blue-50')}
                  onClick={e => { if ((e.target as HTMLElement).closest('[data-checkbox]')) return; router.push(`/incidents/${incident.id}`) }}
                >
                  <td className="px-3 py-3" data-checkbox>
                    <Checkbox checked={selectedIds.includes(incident.id)} onCheckedChange={() => toggle(incident.id)} onClick={e => e.stopPropagation()} />
                  </td>
                  <td className="px-4 py-3"><SeverityBadge severity={incident.severity} /></td>
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-gray-900 truncate max-w-[200px]">{incident.ruleName}</p>
                    <p className="text-xs text-gray-400 font-mono">{incident.ruleCode}</p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      {CHANNEL_ICON[incident.channel]}
                      <span className="text-xs text-gray-600">{incident.channel.replace('_', ' ')}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 font-mono">{incident.staffIdentifier?.slice(0, 8) ?? '—'}</td>
                  <td className="px-4 py-3">
                    <p className="text-xs text-gray-900">{formatDate(incident.occurredAt)}</p>
                    <p className="text-xs text-gray-400">{timeAgo(incident.occurredAt)}</p>
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={cn('border text-xs', STATUS_STYLE[incident.status] ?? '')}>{incident.status}</Badge>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50">
        <p className="text-xs text-gray-500">{total} total incidents</p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-xs text-gray-600">Page {page} of {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
