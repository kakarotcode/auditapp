'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { SeverityBadge } from './SeverityBadge'
import { toast } from 'sonner'
import { formatDate, timeAgo } from '@/lib/utils'
import { CheckCircle, Circle, Clock, User, AlertTriangle, FileText, MessageSquare } from 'lucide-react'

interface TimelineEvent {
  id: string; type: string; description: string; createdAt: string; userId: string | null
}

interface Incident {
  id: string; ruleCode: string; ruleName: string; framework: string; severity: string
  status: string; channel: string; entityTypes: string[]; entityCount: number
  contextSummary: string; riskExplanation: string | null; remediationSteps: string[] | null
  staffIdentifier: string | null; occurredAt: string; resolvedAt: string | null
  resolutionNote: string | null; timeline: TimelineEvent[]
  staffMember: { name: string; totalIncidents: number } | null
  assignedTo: { name: string; email: string } | null
}

interface Props { incident: Incident; onUpdate: () => void }

const ENTITY_COLORS: Record<string, string> = {
  AADHAAR_NUMBER: 'bg-red-100 text-red-700',
  PAN_NUMBER: 'bg-red-100 text-red-700',
  HEALTH_CONDITION: 'bg-purple-100 text-purple-700',
  MEDICAL_RECORD: 'bg-purple-100 text-purple-700',
  FINANCIAL_DATA: 'bg-orange-100 text-orange-700',
  BANK_ACCOUNT: 'bg-orange-100 text-orange-700',
  MOBILE_NUMBER: 'bg-blue-100 text-blue-700',
  EMAIL_ADDRESS: 'bg-blue-100 text-blue-700',
  PERSON_NAME: 'bg-gray-100 text-gray-700',
}

const TIMELINE_ICON: Record<string, React.ReactNode> = {
  CREATED: <AlertTriangle className="h-3.5 w-3.5 text-red-500" />,
  ASSIGNED: <User className="h-3.5 w-3.5 text-blue-500" />,
  STATUS_CHANGED: <Clock className="h-3.5 w-3.5 text-yellow-500" />,
  RESOLVED: <CheckCircle className="h-3.5 w-3.5 text-green-500" />,
  NOTE_ADDED: <MessageSquare className="h-3.5 w-3.5 text-gray-400" />,
}

export function IncidentDetail({ incident, onUpdate }: Props) {
  const qc = useQueryClient()
  const [note, setNote] = useState('')
  const [checkedSteps, setCheckedSteps] = useState<number[]>([])

  const updateMutation = useMutation({
    mutationFn: (data: { status?: string; resolutionNote?: string; resolution?: string }) =>
      fetch(`/api/incidents/${incident.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['incident', incident.id] }); onUpdate() },
  })

  const resolveMutation = useMutation({
    mutationFn: () =>
      fetch(`/api/incidents/${incident.id}/resolve`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resolution: 'ACKNOWLEDGED', resolutionNote: note || 'Resolved by compliance officer' }),
      }),
    onSuccess: () => { toast.success('Incident resolved'); qc.invalidateQueries({ queryKey: ['incident', incident.id] }); onUpdate() },
    onError: () => toast.error('Failed to resolve'),
  })

  const steps: string[] = Array.isArray(incident.remediationSteps) ? incident.remediationSteps as string[] : []

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Left column */}
      <div className="space-y-4">
        {/* Summary */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <CardTitle className="text-base">{incident.ruleName}</CardTitle>
              <SeverityBadge severity={incident.severity} />
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <div><p className="text-xs text-gray-400">Rule Code</p><p className="font-mono text-gray-700">{incident.ruleCode}</p></div>
              <div><p className="text-xs text-gray-400">Framework</p><p className="text-gray-700">{incident.framework}</p></div>
              <div><p className="text-xs text-gray-400">Channel</p><p className="text-gray-700">{incident.channel}</p></div>
              <div><p className="text-xs text-gray-400">Occurred</p><p className="text-gray-700">{formatDate(incident.occurredAt)}</p></div>
              {incident.staffMember && (
                <div className="col-span-2">
                  <p className="text-xs text-gray-400">Staff Member</p>
                  <p className="text-gray-700">{incident.staffMember.name} ({incident.staffMember.totalIncidents} incidents total)</p>
                </div>
              )}
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Context Summary</p>
              <p className="text-gray-700 text-xs rounded bg-gray-50 p-2">{incident.contextSummary}</p>
            </div>
          </CardContent>
        </Card>

        {/* Entity types */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Data Detected ({incident.entityCount} entities)</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {incident.entityTypes.map(et => (
                <span key={et} className={`px-2 py-1 rounded text-xs font-medium ${ENTITY_COLORS[et] ?? 'bg-gray-100 text-gray-600'}`}>
                  {et.replace(/_/g, ' ')}
                </span>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-2">No actual values stored — type classification only</p>
          </CardContent>
        </Card>

        {/* Risk explanation */}
        {incident.riskExplanation && (
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-orange-500" />Risk Analysis</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm text-gray-700">{incident.riskExplanation}</p>
            </CardContent>
          </Card>
        )}

        {/* Remediation steps */}
        {steps.length > 0 && (
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Remediation Checklist</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {steps.map((step, i) => (
                <label key={i} className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="mt-0.5 h-4 w-4 rounded border-gray-300"
                    checked={checkedSteps.includes(i)}
                    onChange={() => setCheckedSteps(p => p.includes(i) ? p.filter(s => s !== i) : [...p, i])}
                  />
                  <span className={`text-sm ${checkedSteps.includes(i) ? 'line-through text-gray-400' : 'text-gray-700'}`}>{step}</span>
                </label>
              ))}
              {checkedSteps.length === steps.length && steps.length > 0 && (
                <p className="text-xs text-green-600 font-medium pt-1">✓ All steps completed</p>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Right column */}
      <div className="space-y-4">
        {/* Status actions */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Actions</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {incident.status === 'OPEN' && (
                <Button size="sm" variant="outline" onClick={() => updateMutation.mutate({ status: 'INVESTIGATING' })}>
                  Start Investigating
                </Button>
              )}
              {['OPEN', 'INVESTIGATING', 'ESCALATED'].includes(incident.status) && (
                <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => resolveMutation.mutate()}>
                  <CheckCircle className="mr-1 h-4 w-4" />Resolve
                </Button>
              )}
              {incident.status !== 'FALSE_POSITIVE' && (
                <Button size="sm" variant="outline" onClick={() => updateMutation.mutate({ status: 'FALSE_POSITIVE' })}>
                  Mark False Positive
                </Button>
              )}
              {incident.status !== 'ESCALATED' && (
                <Button size="sm" variant="outline" className="text-purple-600" onClick={() => updateMutation.mutate({ status: 'ESCALATED' })}>
                  Escalate
                </Button>
              )}
            </div>

            <div>
              <p className="text-xs text-gray-400 mb-1">Add note</p>
              <Textarea placeholder="Add a resolution note…" value={note} onChange={e => setNote(e.target.value)} className="text-sm" rows={3} />
              {note && (
                <Button size="sm" variant="outline" className="mt-2" onClick={() => {
                  updateMutation.mutate({ resolutionNote: note })
                  toast.success('Note saved')
                  setNote('')
                }}>
                  Save Note
                </Button>
              )}
            </div>

            <Button variant="outline" size="sm" className="w-full" onClick={() => toast.info('Report generation from the Reports page')}>
              <FileText className="mr-2 h-4 w-4" />Generate Incident Report
            </Button>
          </CardContent>
        </Card>

        {/* Timeline */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Timeline</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {incident.timeline.map(event => (
                <div key={event.id} className="flex gap-3">
                  <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-100">
                    {TIMELINE_ICON[event.type] ?? <Circle className="h-3 w-3 text-gray-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700">{event.description}</p>
                    <p className="text-xs text-gray-400">{timeAgo(event.createdAt)}</p>
                  </div>
                </div>
              ))}
              {incident.timeline.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">No timeline events</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
