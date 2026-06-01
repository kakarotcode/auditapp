'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { BookOpen, VolumeX } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ComplianceRule {
  code: string; name: string; description: string; framework: string
  section: string; severity: string; penaltyRange: string
  overrideAction: string | null; overrideReason: string | null
}

const severityColor: Record<string, string> = {
  CRITICAL: 'bg-red-100 text-red-700 border-red-200',
  HIGH: 'bg-orange-100 text-orange-700 border-orange-200',
  MEDIUM: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  LOW: 'bg-gray-100 text-gray-600 border-gray-200',
}

export default function RulebookPage() {
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL')
  const [muteOpen, setMuteOpen] = useState(false)
  const [selectedRule, setSelectedRule] = useState<ComplianceRule | null>(null)
  const [muteForm, setMuteForm] = useState({ action: 'MUTE', reason: '' })
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['rulebook'],
    queryFn: () => fetch('/api/rulebook').then(r => r.json()),
  })

  const muteMutation = useMutation({
    mutationFn: (body: { ruleCode: string; action: string; reason: string }) =>
      fetch('/api/rulebook', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),
    onSuccess: () => {
      toast.success('Rule override saved')
      qc.invalidateQueries({ queryKey: ['rulebook'] })
      setMuteOpen(false)
    },
    onError: () => toast.error('Failed to save override'),
  })

  const rules: ComplianceRule[] = data?.rules ?? []
  const filtered = selectedSeverity === 'ALL' ? rules : rules.filter(r => r.severity === selectedSeverity)

  const grouped = filtered.reduce<Record<string, ComplianceRule[]>>((acc, rule) => {
    acc[rule.framework] ??= []
    acc[rule.framework].push(rule)
    return acc
  }, {})

  return (
    <div className="space-y-6">
      <PageHeader title="Compliance Rulebook" description={`${rules.length} active rules across your frameworks`} />

      <div className="flex gap-2 flex-wrap">
        {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(s => (
          <button
            key={s}
            onClick={() => setSelectedSeverity(s)}
            className={cn(
              'px-3 py-1.5 rounded-full text-sm font-medium border transition-colors',
              selectedSeverity === s ? 'bg-[#0F2B5B] text-white border-[#0F2B5B]' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
            )}
          >
            {s}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-6">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-48 w-full rounded-xl" />)}
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([framework, fwRules]) => (
            <Card key={framework}>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-[#0F2B5B]" />
                  {framework}
                  <Badge variant="secondary">{fwRules.length} rules</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-gray-100">
                  {fwRules.map(rule => (
                    <div key={rule.code} className={cn('px-4 py-3 flex items-start justify-between gap-4', rule.overrideAction === 'MUTE' && 'opacity-50')}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs text-gray-400">{rule.code}</span>
                          <Badge className={cn('text-xs border', severityColor[rule.severity])}>{rule.severity}</Badge>
                          {rule.overrideAction && (
                            <Badge variant="outline" className="text-xs text-orange-600 border-orange-200">
                              {rule.overrideAction}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm font-medium text-gray-900 mt-1">{rule.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{rule.section}</p>
                        <p className="text-xs text-gray-400 mt-1">{rule.penaltyRange}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => { setSelectedRule(rule); setMuteOpen(true) }}
                        title="Mute rule"
                      >
                        <VolumeX className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={muteOpen} onOpenChange={setMuteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Override Rule: {selectedRule?.code}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">{selectedRule?.name}</p>
            <div>
              <Label>Action</Label>
              <Select value={muteForm.action} onValueChange={v => setMuteForm(p => ({ ...p, action: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="MUTE">Mute (suppress alerts)</SelectItem>
                  <SelectItem value="DOWNGRADE">Downgrade severity</SelectItem>
                  <SelectItem value="ELEVATE">Elevate severity</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Reason (required)</Label>
              <Textarea
                placeholder="Document why you are overriding this rule…"
                value={muteForm.reason}
                onChange={e => setMuteForm(p => ({ ...p, reason: e.target.value }))}
              />
            </div>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setMuteOpen(false)}>Cancel</Button>
              <Button
                disabled={!muteForm.reason || muteMutation.isPending}
                onClick={() => selectedRule && muteMutation.mutate({ ruleCode: selectedRule.code, ...muteForm })}
              >
                Save Override
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
