import * as React from 'react'
import { cn } from '@/lib/utils'

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'outline' | 'destructive' | 'success'
}

function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const variants = {
    default: 'bg-blue-50 text-blue-600 border-blue-200',
    outline: 'border-gray-200 bg-white text-gray-700',
    destructive: 'bg-red-50 text-red-600 border-red-200',
    success: 'border-green-200 bg-green-50 text-green-600',
  }
  return (
    <div
      className={cn('inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium', variants[variant], className)}
      {...props}
    />
  )
}

export { Badge }
