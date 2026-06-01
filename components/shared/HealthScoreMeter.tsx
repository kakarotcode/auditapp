'use client'

import { cn } from '@/lib/utils'

interface Props {
  score: number
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  className?: string
}

function getScoreColor(score: number) {
  if (score >= 80) return { stroke: '#22c55e', text: 'text-green-600', label: 'Excellent' }
  if (score >= 60) return { stroke: '#eab308', text: 'text-yellow-600', label: 'Good' }
  if (score >= 40) return { stroke: '#f97316', text: 'text-orange-600', label: 'Fair' }
  return { stroke: '#ef4444', text: 'text-red-600', label: 'Critical' }
}

const SIZE = { sm: 64, md: 96, lg: 140 }
const STROKE_WIDTH = { sm: 5, md: 7, lg: 10 }

export function HealthScoreMeter({ score, size = 'md', showLabel = true, className }: Props) {
  const dim = SIZE[size]
  const sw = STROKE_WIDTH[size]
  const r = (dim - sw * 2) / 2
  const cx = dim / 2
  const cy = dim / 2
  const circumference = 2 * Math.PI * r
  const gap = circumference * 0.25
  const arc = circumference - gap
  const offset = arc - (score / 100) * arc

  const color = getScoreColor(score)
  const fontSize = size === 'lg' ? 'text-3xl' : size === 'md' ? 'text-xl' : 'text-sm'
  const labelSize = size === 'lg' ? 'text-sm' : 'text-xs'

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg
        width={dim}
        height={dim}
        style={{ transform: 'rotate(135deg)' }}
      >
        <circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={sw}
          strokeDasharray={`${arc} ${gap}`}
          strokeLinecap="round"
        />
        <circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke={color.stroke}
          strokeWidth={sw}
          strokeDasharray={`${arc - offset} ${circumference - (arc - offset)}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.8s ease' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span className={cn('font-bold tabular-nums text-gray-900', fontSize)}>{score}</span>
        {showLabel && size !== 'sm' && (
          <span className={cn('font-medium', labelSize, color.text)}>{color.label}</span>
        )}
      </div>
    </div>
  )
}
