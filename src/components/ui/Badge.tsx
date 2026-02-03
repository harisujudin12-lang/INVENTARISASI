import { cn } from '@/lib/utils'
import { REQUEST_STATUS_COLORS, REQUEST_STATUS_LABELS } from '@/lib/constants'
import { RequestStatus } from '@prisma/client'

interface BadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info'
  children: React.ReactNode
  className?: string
}

export default function Badge({
  variant = 'default',
  children,
  className,
}: BadgeProps) {
  const variants = {
    default: 'bg-gray-100 text-gray-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    danger: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  )
}

interface StatusBadgeProps {
  status: RequestStatus
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        REQUEST_STATUS_COLORS[status]
      )}
    >
      {REQUEST_STATUS_LABELS[status]}
    </span>
  )
}

interface StockBadgeProps {
  stock: number
  threshold: number
}

export function StockBadge({ stock, threshold }: StockBadgeProps) {
  const isLow = stock <= threshold
  const isEmpty = stock === 0

  if (isEmpty) {
    return (
      <Badge variant="danger" className="whitespace-nowrap">
        Habis
      </Badge>
    )
  }

  if (isLow) {
    return (
      <Badge variant="warning" className="whitespace-nowrap">
        Menipis
      </Badge>
    )
  }

  return (
    <Badge variant="success" className="whitespace-nowrap">
      Tersedia
    </Badge>
  )
}
