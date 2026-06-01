import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[#1E6FD9] focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-[#1E6FD9] text-white hover:bg-[#1558B0]',
        secondary:
          'border-transparent bg-gray-100 text-gray-900 hover:bg-gray-200',
        destructive:
          'border-transparent bg-[#DC2626] text-white hover:bg-red-700',
        outline:
          'border-gray-300 text-gray-700 bg-transparent',
        success:
          'border-transparent bg-[#16A34A] text-white hover:bg-green-700',
        warning:
          'border-transparent bg-[#D97706] text-white hover:bg-amber-700',
        navy:
          'border-transparent bg-[#0F2B5B] text-white hover:bg-[#1a3d7c]',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
