import React from 'react'
import Link from 'next/link'
import { AlertTriangle, User } from 'lucide-react'
import { cn, timeAgo } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

interface ViolatorRow {
  id: string
  name: string
  department?: string | null
  totalIncidents: number
  critical: number
  high: number
  medium: number
  low: number
  lastIncidentAt?: string | null
}

interface TopViolatorsTableProps {
  data: ViolatorRow[]
  anonymize?: boolean
}

function SeverityBreakdown({
  critical,
  high,
  medium,
  low,
}: {
  critical: number
  high: number
  medium: number
  low: number
}) {
  return (
    <div className="flex items-center gap-1">
      {critical > 0 && (
        <span className="flex h-5 min-w-[20px] items-center justify-center rounded px-1 bg-red-100 text-[10px] font-bold text-red-700">
          {critical}C
        </span>
      )}
      {high > 0 && (
        <span className="flex h-5 min-w-[20px] items-center justify-center rounded px-1 bg-orange-100 text-[10px] font-bold text-orange-700">
          {high}H
        </span>
      )}
      {medium > 0 && (
        <span className="flex h-5 min-w-[20px] items-center justify-center rounded px-1 bg-amber-100 text-[10px] font-bold text-amber-700">
          {medium}M
        </span>
      )}
      {low > 0 && (
        <span className="flex h-5 min-w-[20px] items-center justify-center rounded px-1 bg-gray-100 text-[10px] font-bold text-gray-600">
          {low}L
        </span>
      )}
    </div>
  )
}

export function TopViolatorsTable({
  data,
  anonymize = false,
}: TopViolatorsTableProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Top Violators</CardTitle>
          <Link
            href="/staff"
            className="text-xs text-[#1E6FD9] hover:text-[#1558B0] font-medium"
          >
            View all staff &rarr;
          </Link>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-4">#</TableHead>
              <TableHead>Staff Member</TableHead>
              <TableHead>Department</TableHead>
              <TableHead className="text-center">Incidents</TableHead>
              <TableHead>Breakdown</TableHead>
              <TableHead>Last Incident</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <AlertTriangle className="h-8 w-8 text-gray-300" />
                    <p className="text-sm text-gray-400">No data available</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              data.slice(0, 10).map((row, index) => (
                <TableRow
                  key={row.id}
                  className={cn(index === 0 && 'bg-red-50/30')}
                >
                  <TableCell className="pl-4 font-bold text-gray-400">
                    {index + 1}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100">
                        <User className="h-4 w-4 text-gray-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {anonymize
                            ? `Staff #${row.id.slice(-4).toUpperCase()}`
                            : row.name}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-gray-500">
                      {row.department ?? '—'}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span
                      className={cn(
                        'text-sm font-bold',
                        row.totalIncidents >= 10
                          ? 'text-red-600'
                          : row.totalIncidents >= 5
                            ? 'text-orange-600'
                            : 'text-gray-900'
                      )}
                    >
                      {row.totalIncidents}
                    </span>
                  </TableCell>
                  <TableCell>
                    <SeverityBreakdown
                      critical={row.critical}
                      high={row.high}
                      medium={row.medium}
                      low={row.low}
                    />
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-gray-400">
                      {row.lastIncidentAt ? timeAgo(row.lastIncidentAt) : '—'}
                    </span>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
