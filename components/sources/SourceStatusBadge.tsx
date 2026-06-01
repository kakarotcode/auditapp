import { cn } from '@/lib/utils'

const STATUS_CONFIG: Record<string, { label: string; className: string; dot: string }> = {
  ACTIVE:      { label: 'Active',      className: 'bg-green-50 text-green-700 border-green-200',  dot: 'bg-green-500' },
  ERROR:       { label: 'Error',       className: 'bg-red-50 text-red-700 border-red-200',         dot: 'bg-red-500' },
  PENDING:     { label: 'Pending',     className: 'bg-yellow-50 text-yellow-700 border-yellow-200', dot: 'bg-yellow-500' },
  EXPIRED:     { label: 'Expired',     className: 'bg-orange-50 text-orange-700 border-orange-200', dot: 'bg-orange-500' },
  REVOKED:     { label: 'Revoked',     className: 'bg-gray-50 text-gray-600 border-gray-200',      dot: 'bg-gray-400' },
  DISCONNECTED:{ label: 'Disconnected',className: 'bg-gray-50 text-gray-600 border-gray-200',      dot: 'bg-gray-400' },
}

interface Props { status: string; className?: string }

export function SourceStatusBadge({ status, className }: Props) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.DISCONNECTED
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium', cfg.className, className)}>
      <span className={cn('h-1.5 w-1.5 rounded-full', cfg.dot)} />
      {cfg.label}
    </span>
  )
}
