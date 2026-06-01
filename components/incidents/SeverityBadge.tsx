import { cn } from '@/lib/utils'

interface Props { severity: string; className?: string }

const config: Record<string, { bg: string; text: string; label: string }> = {
  CRITICAL: { bg: 'bg-red-100', text: 'text-red-700', label: '🔴 Critical' },
  HIGH:     { bg: 'bg-orange-100', text: 'text-orange-700', label: '🟠 High' },
  MEDIUM:   { bg: 'bg-yellow-100', text: 'text-yellow-700', label: '🟡 Medium' },
  LOW:      { bg: 'bg-gray-100', text: 'text-gray-600', label: '⚪ Low' },
}

export function SeverityBadge({ severity, className }: Props) {
  const c = config[severity] ?? config.LOW
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', c.bg, c.text, className)}>
      {c.label}
    </span>
  )
}
