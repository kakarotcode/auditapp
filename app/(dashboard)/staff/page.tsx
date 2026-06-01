'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/shared/EmptyState'
import { SeverityBadge } from '@/components/incidents/SeverityBadge'
import { Users, Search } from 'lucide-react'
import { formatDate, timeAgo } from '@/lib/utils'

interface StaffMember {
  id: string; name: string; role: string | null; department: string | null
  totalIncidents: number; openIncidents: number; lastIncidentAt: string | null
}

export default function StaffPage() {
  const [search, setSearch] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['staff', search],
    queryFn: () => fetch(`/api/staff?search=${encodeURIComponent(search)}&limit=50`).then(r => r.json()),
  })

  const staff: StaffMember[] = data?.staff ?? []

  const getRiskLevel = (member: StaffMember): string => {
    if (member.openIncidents > 2) return 'CRITICAL'
    if (member.openIncidents > 0) return 'HIGH'
    if (member.totalIncidents > 5) return 'MEDIUM'
    return 'LOW'
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Staff Members" description="Track compliance incidents by team member" />

      <div className="relative w-full max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search staff…"
          className="pl-9"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
        </div>
      ) : staff.length === 0 ? (
        <EmptyState icon={Users} title="No staff members" description="Staff members appear here when they have compliance incidents" />
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Staff Member</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Total Incidents</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Incident</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Risk Level</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {staff.map(member => (
                <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-[#0F2B5B] text-white text-xs flex items-center justify-center font-semibold">
                        {member.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{member.name}</p>
                        <p className="text-xs text-gray-400">{member.role ?? 'Staff'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{member.department ?? '—'}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-sm font-bold ${member.totalIncidents > 5 ? 'text-red-600' : member.totalIncidents > 2 ? 'text-amber-600' : 'text-gray-700'}`}>
                      {member.totalIncidents}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {member.lastIncidentAt ? timeAgo(member.lastIncidentAt) : 'Never'}
                  </td>
                  <td className="px-4 py-3">
                    <SeverityBadge severity={getRiskLevel(member)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
