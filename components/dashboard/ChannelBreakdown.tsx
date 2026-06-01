'use client'

import React from 'react'
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  type TooltipProps,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface ChannelData {
  channel: string
  count: number
}

interface ChannelBreakdownProps {
  data: ChannelData[]
}

const CHANNEL_CONFIG: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  WHATSAPP: { label: 'WhatsApp', color: '#16A34A', bg: 'bg-green-100' },
  GMAIL: { label: 'Gmail', color: '#DC2626', bg: 'bg-red-100' },
  OUTLOOK: { label: 'Outlook', color: '#0284C7', bg: 'bg-sky-100' },
  GOOGLE_DRIVE: { label: 'Google Drive', color: '#D97706', bg: 'bg-amber-100' },
  DRIVE: { label: 'Google Drive', color: '#D97706', bg: 'bg-amber-100' },
}

const DEFAULT_COLORS = [
  '#1E6FD9',
  '#16A34A',
  '#DC2626',
  '#D97706',
  '#7C3AED',
  '#0284C7',
]

function CustomTooltip({ active, payload }: TooltipProps<number, string>) {
  if (!active || !payload || payload.length === 0) return null
  const item = payload[0]
  if (!item) return null

  const total = (item.payload as { total: number }).total
  const pct = total > 0 ? Math.round(((item.value ?? 0) / total) * 100) : 0

  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-lg">
      <p className="text-xs font-semibold text-gray-700">{item.name}</p>
      <p className="text-sm font-bold text-gray-900 mt-0.5">
        {item.value} incidents{' '}
        <span className="text-xs font-normal text-gray-400">({pct}%)</span>
      </p>
    </div>
  )
}

export function ChannelBreakdown({ data }: ChannelBreakdownProps) {
  const total = data.reduce((sum, d) => sum + d.count, 0)

  const chartData = data.map((d, i) => {
    const config =
      CHANNEL_CONFIG[d.channel.toUpperCase()] ??
      CHANNEL_CONFIG[d.channel] ?? {
        label: d.channel,
        color: DEFAULT_COLORS[i % DEFAULT_COLORS.length],
        bg: 'bg-gray-100',
      }
    return {
      name: config.label,
      value: d.count,
      color: config.color,
      total,
    }
  })

  if (total === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Incidents by Channel</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-40 items-center justify-center">
            <p className="text-sm text-gray-400">No incident data available</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Incidents by Channel</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={3}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>

        {/* Custom legend */}
        <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2">
          {chartData.map((entry) => {
            const pct = total > 0 ? Math.round((entry.value / total) * 100) : 0
            return (
              <div key={entry.name} className="flex items-center gap-2 min-w-0">
                <div
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-xs text-gray-600 truncate">
                  {entry.name}
                </span>
                <span className="ml-auto shrink-0 text-xs font-semibold text-gray-900">
                  {pct}%
                </span>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
