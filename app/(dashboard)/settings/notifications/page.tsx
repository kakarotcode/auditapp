'use client'

import { useState } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'

export default function NotificationsPage() {
  const [form, setForm] = useState({
    criticalAlerts: true, highAlerts: true, mediumAlerts: false, lowAlerts: false,
    whatsappNumber: '', emailFrequency: 'instant',
  })
  const [saving, setSaving] = useState(false)

  async function save() {
    setSaving(true)
    await new Promise(r => setTimeout(r, 500))
    toast.success('Notification preferences saved')
    setSaving(false)
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Notifications" description="Configure how and when you receive compliance alerts" />

      <Card>
        <CardHeader><CardTitle className="text-base">Alert Severity</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {[
            { key: 'criticalAlerts', label: 'Critical incidents', desc: 'Immediate notification required — regulatory risk' },
            { key: 'highAlerts', label: 'High severity incidents', desc: 'Urgent action needed within 24 hours' },
            { key: 'mediumAlerts', label: 'Medium severity incidents', desc: 'Review and address within a week' },
            { key: 'lowAlerts', label: 'Low severity incidents', desc: 'Minor process gaps, review in monthly report' },
          ].map(item => (
            <div key={item.key} className="flex items-center justify-between py-2">
              <div>
                <Label className="text-sm font-medium">{item.label}</Label>
                <p className="text-xs text-gray-500">{item.desc}</p>
              </div>
              <Switch
                checked={form[item.key as keyof typeof form] as boolean}
                onCheckedChange={v => setForm(p => ({ ...p, [item.key]: v }))}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">WhatsApp Alerts</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Label>Your WhatsApp Number (with country code)</Label>
          <Input
            placeholder="+91 98765 43210"
            value={form.whatsappNumber}
            onChange={e => setForm(p => ({ ...p, whatsappNumber: e.target.value }))}
          />
          <p className="text-xs text-gray-400">KavachAI will send instant WhatsApp alerts to this number for Critical/High incidents.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Email Frequency</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Select value={form.emailFrequency} onValueChange={v => setForm(p => ({ ...p, emailFrequency: v }))}>
            <SelectTrigger className="w-64"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="instant">Instant (every incident)</SelectItem>
              <SelectItem value="daily">Daily digest (8am IST)</SelectItem>
              <SelectItem value="weekly">Weekly summary (Monday 8am IST)</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save Preferences'}</Button>
      </div>
    </div>
  )
}
