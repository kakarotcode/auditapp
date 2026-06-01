import React from 'react'
import { cn } from '@/lib/utils'

interface PageHeaderProps {
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export function PageHeader({
  title,
  description,
  action,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between mb-6',
        className
      )}
    >
      <div className="min-w-0">
        <h1 className="text-2xl font-bold text-[#0F2B5B] truncate">{title}</h1>
        {description && (
          <p className="mt-1 text-sm text-gray-500 line-clamp-2">
            {description}
          </p>
        )}
      </div>
      {action && (
        <div className="flex shrink-0 items-center gap-2 mt-3 sm:mt-0">
          {action}
        </div>
      )}
    </div>
  )
}
