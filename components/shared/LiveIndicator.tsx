import { cn } from '@/lib/utils'

interface Props {
  label?: string
  className?: string
  connected?: boolean
}

export function LiveIndicator({ label = 'Live', className, connected = true }: Props) {
  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <span className="relative flex h-2 w-2">
        <span className={cn('absolute inline-flex h-full w-full animate-ping rounded-full opacity-75', connected ? 'bg-green-400' : 'bg-gray-300')} />
        <span className={cn('relative inline-flex h-2 w-2 rounded-full', connected ? 'bg-green-500' : 'bg-gray-400')} />
      </span>
      <span className={cn('text-xs font-medium', connected ? 'text-green-600' : 'text-gray-500')}>{label}</span>
    </div>
  )
}
