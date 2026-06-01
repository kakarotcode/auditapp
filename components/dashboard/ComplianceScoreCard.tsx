'use client'

import React, { useEffect, useRef } from 'react'
import { motion, useMotionValue, useTransform, animate } from 'framer-motion'
import { TrendingUp, TrendingDown, Minus, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'

interface ComplianceScoreCardProps {
  score: number
  trend: number
  lastUpdated: string
  inline?: boolean
}

function AnimatedNumber({ value }: { value: number }) {
  const count = useMotionValue(0)
  const rounded = useTransform(count, (v) => Math.round(v))
  const [display, setDisplay] = React.useState(0)

  useEffect(() => {
    const controls = animate(count, value, {
      duration: 1.5,
      ease: 'easeOut',
    })
    const unsubscribe = rounded.on('change', (v) => setDisplay(v))
    return () => {
      controls.stop()
      unsubscribe()
    }
  }, [value, count, rounded])

  return <span>{display}</span>
}

export function ComplianceScoreCard({
  score,
  trend,
  lastUpdated,
  inline = false,
}: ComplianceScoreCardProps) {
  const isGood = score >= 75
  const isMid = score >= 50 && score < 75
  const isBad = score < 50

  const strokeColor = isGood ? '#16A34A' : isMid ? '#D97706' : '#DC2626'
  const bgRingColor = isGood
    ? 'stroke-green-100'
    : isMid
      ? 'stroke-amber-100'
      : 'stroke-red-100'

  const scoreLabel = isGood
    ? 'Compliant'
    : isMid
      ? 'Needs Attention'
      : 'At Risk'

  const scoreLabelColor = isGood
    ? 'text-green-600'
    : isMid
      ? 'text-amber-600'
      : 'text-red-600'

  // SVG ring parameters
  const size = 160
  const strokeWidth = 12
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference - (score / 100) * circumference

  const TrendIcon =
    trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus
  const trendColor =
    trend > 0 ? 'text-green-600' : trend < 0 ? 'text-red-600' : 'text-gray-500'
  const trendBg =
    trend > 0
      ? 'bg-green-50'
      : trend < 0
        ? 'bg-red-50'
        : 'bg-gray-50'

  const inner = (
        <div className="flex flex-col items-center">
          {/* Heading is omitted in inline mode — the parent stat card already
              renders a "Compliance Score" label, so showing it here too is a
              duplicate. */}
          {!inline && (
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
              Compliance Score
            </h3>
          )}

          {/* Circular gauge */}
          <div className="relative">
            <svg
              width={size}
              height={size}
              viewBox={`0 0 ${size} ${size}`}
              className="-rotate-90"
            >
              {/* Background ring */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                strokeWidth={strokeWidth}
                className={bgRingColor}
                stroke="currentColor"
              />
              {/* Score ring */}
              <motion.circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={strokeColor}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset: dashOffset }}
                transition={{ duration: 1.5, ease: 'easeOut' }}
              />
            </svg>

            {/* Score number in center */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span
                className={cn('text-4xl font-bold', scoreLabelColor)}
              >
                <AnimatedNumber value={score} />
              </span>
              <span className="text-xs text-gray-400 font-medium mt-0.5">
                out of 100
              </span>
            </div>
          </div>

          {/* Status label */}
          <span
            className={cn(
              'mt-3 text-sm font-semibold',
              scoreLabelColor
            )}
          >
            {scoreLabel}
          </span>

          {/* Trend indicator */}
          <div className="mt-3 flex items-center gap-2">
            <div
              className={cn(
                'flex items-center gap-1.5 rounded-full px-2.5 py-1',
                trendBg
              )}
            >
              <TrendIcon className={cn('h-3.5 w-3.5', trendColor)} />
              <span className={cn('text-xs font-semibold', trendColor)}>
                {trend > 0 ? '+' : ''}
                {trend}%
              </span>
            </div>
            <span className="text-xs text-gray-400">vs last week</span>
          </div>

          {/* Last updated */}
          <div className="mt-3 flex items-center gap-1.5 text-xs text-gray-400">
            <Clock className="h-3 w-3" />
            <span>Updated {lastUpdated}</span>
          </div>
        </div>
  )

  if (inline) return inner

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6">
        {inner}
      </CardContent>
    </Card>
  )
}
