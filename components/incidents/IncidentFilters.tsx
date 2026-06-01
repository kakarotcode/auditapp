'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Search, X } from 'lucide-react'
import { useCallback } from 'react'

export function IncidentFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const update = useCallback((key: string, value: string) => {
    const sp = new URLSearchParams(searchParams.toString())
    if (value) sp.set(key, value); else sp.delete(key)
    sp.set('page', '1')
    router.push(`/incidents?${sp.toString()}`)
  }, [router, searchParams])

  const clear = () => router.push('/incidents')

  const hasFilters = ['severity', 'status', 'framework', 'channel', 'search'].some(k => searchParams.has(k))

  return (
    <div className="flex flex-wrap gap-3 items-center">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search rule name…"
          className="pl-9"
          defaultValue={searchParams.get('search') ?? ''}
          onChange={e => {
            const v = e.target.value
            clearTimeout((window as Window & { _searchTimer?: ReturnType<typeof setTimeout> })._searchTimer)
            ;(window as Window & { _searchTimer?: ReturnType<typeof setTimeout> })._searchTimer = setTimeout(() => update('search', v), 400)
          }}
        />
      </div>

      <Select value={searchParams.get('severity') ?? ''} onValueChange={v => update('severity', v === 'ALL' ? '' : v)}>
        <SelectTrigger className="w-36"><SelectValue placeholder="Severity" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All severities</SelectItem>
          <SelectItem value="CRITICAL">Critical</SelectItem>
          <SelectItem value="HIGH">High</SelectItem>
          <SelectItem value="MEDIUM">Medium</SelectItem>
          <SelectItem value="LOW">Low</SelectItem>
        </SelectContent>
      </Select>

      <Select value={searchParams.get('status') ?? ''} onValueChange={v => update('status', v === 'ALL' ? '' : v)}>
        <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All statuses</SelectItem>
          <SelectItem value="OPEN">Open</SelectItem>
          <SelectItem value="INVESTIGATING">Investigating</SelectItem>
          <SelectItem value="RESOLVED">Resolved</SelectItem>
          <SelectItem value="ESCALATED">Escalated</SelectItem>
          <SelectItem value="FALSE_POSITIVE">False Positive</SelectItem>
        </SelectContent>
      </Select>

      <Select value={searchParams.get('channel') ?? ''} onValueChange={v => update('channel', v === 'ALL' ? '' : v)}>
        <SelectTrigger className="w-36"><SelectValue placeholder="Channel" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All channels</SelectItem>
          <SelectItem value="WHATSAPP">WhatsApp</SelectItem>
          <SelectItem value="GMAIL">Gmail</SelectItem>
          <SelectItem value="OUTLOOK">Outlook</SelectItem>
          <SelectItem value="GOOGLE_DRIVE">Google Drive</SelectItem>
          <SelectItem value="ONEDRIVE">OneDrive</SelectItem>
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={clear} className="text-gray-400 hover:text-gray-600">
          <X className="h-4 w-4 mr-1" />Clear
        </Button>
      )}
    </div>
  )
}
