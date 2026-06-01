'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'

const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat','Haryana',
  'Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur',
  'Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana',
  'Tripura','Uttar Pradesh','Uttarakhand','West Bengal','Delhi','Chandigarh','Puducherry',
  'Jammu & Kashmir','Ladakh','Lakshadweep','Andaman & Nicobar Islands','Dadra & Nagar Haveli',
]

interface OrgSettings {
  id: string; name: string; gstin: string | null; city: string | null
  state: string | null; size: string; vertical: string
}

export default function SettingsPage() {
  const qc = useQueryClient()
  const [form, setForm] = useState<Partial<OrgSettings>>({})
  const [dirty, setDirty] = useState(false)

  const { data, isLoading } = useQuery<OrgSettings>({
    queryKey: ['org-settings'],
    queryFn: () => fetch('/api/settings').then(r => r.json()),
  })

  useEffect(() => {
    if (data) setForm(data)
  }, [data])

  const mutation = useMutation({
    mutationFn: (body: Partial<OrgSettings>) =>
      fetch('/api/settings', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),
    onSuccess: () => {
      toast.success('Settings saved')
      qc.invalidateQueries({ queryKey: ['org-settings'] })
      setDirty(false)
    },
    onError: () => toast.error('Failed to save settings'),
  })

  function update(key: keyof OrgSettings, value: string) {
    setForm(p => ({ ...p, [key]: value }))
    setDirty(true)
  }

  if (isLoading) return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  )

  return (
    <div className="space-y-6">
      <PageHeader title="General Settings" description="Manage your organisation profile" />

      <Card>
        <CardHeader><CardTitle className="text-base">Organisation Details</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label>Organisation Name</Label>
              <Input value={form.name ?? ''} onChange={e => update('name', e.target.value)} placeholder="Mehta & Associates" />
            </div>
            <div>
              <Label>GSTIN (optional)</Label>
              <Input value={form.gstin ?? ''} onChange={e => update('gstin', e.target.value)} placeholder="27AABCK1234Z1ZQ" className="font-mono" />
            </div>
            <div>
              <Label>City</Label>
              <Input value={form.city ?? ''} onChange={e => update('city', e.target.value)} placeholder="Mumbai" />
            </div>
            <div>
              <Label>State</Label>
              <Select value={form.state ?? ''} onValueChange={v => update('state', v)}>
                <SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger>
                <SelectContent>
                  {INDIAN_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Organisation Size</Label>
              <Select value={form.size ?? ''} onValueChange={v => update('size', v)}>
                <SelectTrigger><SelectValue placeholder="Select size" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="MICRO">Micro (1–20 employees)</SelectItem>
                  <SelectItem value="SMALL">Small (21–75 employees)</SelectItem>
                  <SelectItem value="MEDIUM">Medium (76–200 employees)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <Button onClick={() => mutation.mutate(form)} disabled={!dirty || mutation.isPending}>
              {mutation.isPending ? 'Saving…' : 'Save Changes'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
