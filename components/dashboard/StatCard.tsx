'use client'

import React, { useEffect, useRef, useState } from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatCardProps {
  label: string
  value: number | string
  subtext?: React.ReactNode
  icon: React.ReactNode
  iconBg: string        // tailwind classes for icon background gradient
  accentColor: string   // top border color (tailwind border-X-500 style)
  trend?: number        // +/- number, optional
  trendLabel?: string
  animate?: boolean
  className?: string
}

function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(0)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    const start = performance.now()
    const duration = 900
    const from = 0
    const to = value

    function step(now: number) {
      const t = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - t, 3) // ease-out-cubic
      setDisplay(Math.round(from + (to - from) * eased))
      if (t < 1) rafRef.current = requestAnimationFrame(step)
    }

    rafRef.current = requestAnimationFrame(step)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [value])

  return <>{display.toLocaleString('en-IN')}</>
}

export function StatCard({
  label,
  value,
  subtext,
  icon,
  iconBg,
  accentColor,
  trend,
  trendLabel,
  animate = true,
  className,
}: StatCardProps) {
  const isNumeric = typeof value === 'number'

  return (
    <div className={cn(
      'group relative bg-white rounded-2xl p-5 shadow-card card-hover border border-gray-100 overflow-hidden',
      accentColor,
      className
    )}>
      {/* Subtle background gradient bloom */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-2xl bg-gradient-to-br from-white to-gray-50/80" />

      <div className="relative">
        <div className="flex items-start justify-between mb-3">
          {/* Icon badge */}
          <div className={cn('flex h-11 w-11 items-center justify-center rounded-xl', iconBg)}>
            {icon}
          </div>

          {/* Trend badge */}
          {trend !== undefined && (
            <span className={cn(
              'flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold',
              trend > 0 ? 'bg-green-50 text-green-700' :
              trend < 0 ? 'bg-red-50 text-red-600' :
              'bg-gray-50 text-gray-500'
            )}>
              {trend > 0 ? <TrendingUp className="h-3 w-3" /> :
               trend < 0 ? <TrendingDown className="h-3 w-3" /> :
               <Minus className="h-3 w-3" />}
              {Math.abs(trend)}
            </span>
          )}
        </div>

        {/* Value */}
        <div className="text-3xl font-bold tracking-tight text-gray-900 tabular-nums">
          {isNumeric && animate ? <AnimatedNumber value={value as number} /> : (
            isNumeric ? (value as number).toLocaleString('en-IN') : value
          )}
        </div>

        {/* Label */}
        <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-gray-400">{label}</p>

        {/* Subtext */}
        {(subtext ?? trendLabel) && (
          <div className="mt-2 text-xs text-gray-500">
            {subtext ?? trendLabel}
          </div>
        )}
      </div>
    </div>
  )
}
