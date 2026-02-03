import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface TableProps {
  children: ReactNode
  className?: string
}

export function Table({ children, className }: TableProps) {
  return (
    <div className="overflow-x-auto">
      <table className={cn('min-w-full divide-y divide-gray-200', className)}>
        {children}
      </table>
    </div>
  )
}

export function TableHeader({ children }: { children: ReactNode }) {
  return <thead className="bg-gray-50">{children}</thead>
}

export function TableBody({ children }: { children: ReactNode }) {
  return <tbody className="bg-white divide-y divide-gray-200">{children}</tbody>
}

export function TableRow({
  children,
  className,
  onClick,
}: {
  children: ReactNode
  className?: string
  onClick?: () => void
}) {
  return (
    <tr
      className={cn(onClick && 'cursor-pointer hover:bg-gray-50', className)}
      onClick={onClick}
    >
      {children}
    </tr>
  )
}

export function TableHead({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <th
      scope="col"
      className={cn(
        'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider',
        className
      )}
    >
      {children}
    </th>
  )
}

export function TableCell({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <td className={cn('px-4 py-4 whitespace-nowrap text-sm', className)}>
      {children}
    </td>
  )
}

export function TableEmpty({ message = 'Tidak ada data' }: { message?: string }) {
  return (
    <tr>
      <td colSpan={100} className="px-4 py-8 text-center text-gray-500">
        {message}
      </td>
    </tr>
  )
}
