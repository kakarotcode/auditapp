'use client'

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { UserPlus } from 'lucide-react'
import { getInitials } from '@/lib/utils'

const ROLE_COLORS: Record<string, string> = {
  OWNER: 'bg-purple-100 text-purple-700',
  ADMIN: 'bg-blue-100 text-blue-700',
  COMPLIANCE_OFFICER: 'bg-teal-100 text-teal-700',
  AUDITOR: 'bg-gray-100 text-gray-700',
  STAFF: 'bg-green-100 text-green-700',
}

interface User {
  id: string; name: string; email: string; role: string; isActive: boolean; lastLoginAt: string | null
}

export default function TeamPage() {
  const qc = useQueryClient()
  const [inviteForm, setInviteForm] = useState({ name: '', email: '', role: 'COMPLIANCE_OFFICER' })
  const [inviting, setInviting] = useState(false)

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['team-members'],
    queryFn: () => fetch('/api/users').then(r => r.json()),
  })

  async function invite() {
    if (!inviteForm.email || !inviteForm.name) {
      toast.error('Name and email are required')
      return
    }
    setInviting(true)
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inviteForm),
      })
      if (!res.ok) {
        const err = await res.json() as { error?: string }
        toast.error(err.error ?? 'Failed to invite user')
        return
      }
      const d = await res.json() as { user: { name: string }; tempPassword: string }
      toast.success(`${d.user.name} added. Temporary password: ${d.tempPassword}`)
      setInviteForm({ name: '', email: '', role: 'COMPLIANCE_OFFICER' })
      void refetch()
    } catch {
      toast.error('Failed to invite user')
    } finally {
      setInviting(false)
    }
  }

  const users: User[] = data?.users ?? []

  return (
    <div className="space-y-6">
      <PageHeader title="Team Management" description="Manage user access and roles" />

      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><UserPlus className="h-4 w-4" />Invite Team Member</CardTitle></CardHeader>
        <CardContent>
          <div className="flex gap-3 flex-wrap">
            <Input
              placeholder="Full name"
              value={inviteForm.name}
              onChange={e => setInviteForm(p => ({ ...p, name: e.target.value }))}
              className="flex-1 min-w-[140px]"
            />
            <Input
              placeholder="colleague@company.com"
              value={inviteForm.email}
              onChange={e => setInviteForm(p => ({ ...p, email: e.target.value }))}
              className="flex-1 min-w-[200px]"
            />
            <Select value={inviteForm.role} onValueChange={v => setInviteForm(p => ({ ...p, role: v }))}>
              <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="COMPLIANCE_OFFICER">Compliance Officer</SelectItem>
                <SelectItem value="AUDITOR">Auditor</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
                <SelectItem value="STAFF">Staff</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={invite} disabled={inviting || !inviteForm.email}>
              {inviting ? 'Sending…' : 'Send Invite'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Team Members</CardTitle></CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-3 p-4">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {users.length === 0 ? (
                <p className="p-6 text-center text-sm text-gray-500">No team members yet</p>
              ) : (
                users.map(user => (
                  <div key={user.id} className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-[#0F2B5B] text-white text-sm flex items-center justify-center font-semibold">
                        {getInitials(user.name)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{user.name}</p>
                        <p className="text-xs text-gray-400">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={ROLE_COLORS[user.role] ?? ''}>{user.role.replace('_', ' ')}</Badge>
                      {!user.isActive && <Badge variant="outline" className="text-gray-400">Inactive</Badge>}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
