'use client'

import { useRouter } from 'next/navigation'
import { SeverityBadge } from './SeverityBadge'
import { Badge } from '@/components/ui/badge'
import { timeAgo } from '@/lib/utils'
import { MessageSquare, Mail, FolderOpen, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Incident {
  id: string; severity: string; ruleCode: string; ruleName: string
  channel: string; staffIdentifier: string | null; occurredAt: string; status: string
  entityCount: number; contextSummary: string
}

const CHANNEL_ICON: Record<string, React.ReactNode> = {
  WHATSAPP: <MessageSquare className="h-3.5 w-3.5 text-green-600" />,
  GMAIL: <Mail className="h-3.5 w-3.5 text-red-500" />,
  OUTLOOK: <Mail className="h-3.5 w-3.5 text-blue-600" />,
  GOOGLE_DRIVE: <FolderOpen className="h-3.5 w-3.5 text-yellow-500" />,
  ONEDRIVE: <FolderOpen className="h-3.5 w-3.5 text-blue-500" />,
}

const STATUS_STYLE: Record<string, string> = {
  OPEN: 'bg-red-50 text-red-700 border-red-200',
  INVESTIGATING: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  RESOLVED: 'bg-green-50 text-green-700 border-green-200',
  ESCALATED: 'bg-purple-50 text-purple-700 border-purple-200',
  FALSE_POSITIVE: 'bg-gray-50 text-gray-600 border-gray-200',
}

export function IncidentCard({ incident }: { incident: Incident }) {
  const router = useRouter()
  return (
    <div
      className="group rounded-xl border border-gray-200 bg-white p-4 hover:border-[#0F2B5B]/30 hover:shadow-sm cursor-pointer transition-all"
      onClick={() => router.push(`/incidents/${incident.id}`)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <SeverityBadge severity={incident.severity} />
            <span className="font-mono text-xs text-gray-400">{incident.ruleCode}</span>
          </div>
          <p className="text-sm font-medium text-gray-900 truncate">{incident.ruleName}</p>
          <p className="text-xs text-gray-500 mt-1 line-clamp-2">{incident.contextSummary}</p>
        </div>
        <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-[#0F2B5B] shrink-0 mt-1 transition-colors" />
      </div>

      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            {CHANNEL_ICON[incident.channel]}
            <span className="text-xs text-gray-500">{incident.channel.replace('_', ' ')}</span>
          </div>
          <span className="text-xs text-gray-400">{incident.entityCount} entities</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={cn('border text-xs', STATUS_STYLE[incident.status] ?? '')}>{incident.status}</Badge>
          <span className="text-xs text-gray-400">{timeAgo(incident.occurredAt)}</span>
        </div>
      </div>
    </div>
  )
}
