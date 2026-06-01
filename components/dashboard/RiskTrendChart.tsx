'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  type TooltipProps,
} from 'recharts'
import { format, parseISO } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface DataPoint {
  date: string
  critical: number
  high: number
  medium: number
  low: number
}

interface RiskTrendChartProps {
  data: DataPoint[]
}

const SEVERITY_LINES = [
  { key: 'critical', color: '#DC2626', label: 'Critical' },
  { key: 'high', color: '#EA580C', label: 'High' },
  { key: 'medium', color: '#D97706', label: 'Medium' },
  { key: 'low', color: '#9CA3AF', label: 'Low' },
] as const

function CustomTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload || payload.length === 0) return null

  let formattedDate = label
  try {
    formattedDate = format(parseISO(label), 'MMM d, yyyy')
  } catch {
    // use label as-is
  }

  const total = payload.reduce((sum, p) => sum + (p.value ?? 0), 0)

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-lg min-w-[160px]">
      <p className="text-xs font-semibold text-gray-500 mb-2">{formattedDate}</p>
      <div className="space-y-1">
        {payload.map((p) => (
          <div key={p.dataKey} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-1.5">
              <div
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: p.color }}
              />
              <span className="text-xs text-gray-600 capitalize">{p.name}</span>
            </div>
            <span className="text-xs font-bold text-gray-900">{p.value}</span>
          </div>
        ))}
      </div>
      <div className="mt-2 pt-2 border-t border-gray-100 flex justify-between">
        <span className="text-xs text-gray-500">Total</span>
        <span className="text-xs font-bold text-gray-900">{total}</span>
      </div>
    </div>
  )
}

export function RiskTrendChart({ data }: RiskTrendChartProps) {
  const router = useRouter()

  const handleDotClick = (payload: { date: string } | null) => {
    if (!payload?.date) return
    router.push(`/incidents?date=${payload.date}`)
  }

  const formatXAxis = (value: string) => {
    try {
      return format(parseISO(value), 'MMM d')
    } catch {
      return value
    }
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Risk Trend (Last 30 Days)</CardTitle>
          <p className="text-xs text-gray-400">Click on a data point to filter incidents</p>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart
            data={data}
            margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
            onClick={(e) => {
              if (e?.activePayload?.[0]) {
                const payload = e.activePayload[0].payload as DataPoint
                handleDotClick(payload)
              }
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={formatXAxis}
              tick={{ fontSize: 11, fill: '#9CA3AF' }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#9CA3AF' }}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#E5E7EB', strokeWidth: 1.5 }} />
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }}
            />
            {SEVERITY_LINES.map(({ key, color, label }) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                name={label}
                stroke={color}
                strokeWidth={2}
                dot={false}
                activeDot={{
                  r: 5,
                  cursor: 'pointer',
                  onClick: (_event: unknown, payload: unknown) =>
                    handleDotClick(((payload as { payload: DataPoint }).payload)),
                }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
