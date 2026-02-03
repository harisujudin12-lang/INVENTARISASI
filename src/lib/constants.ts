import { RequestStatus } from '@prisma/client'

export const REQUEST_STATUS_LABELS: Record<RequestStatus, string> = {
  PENDING: 'Menunggu',
  APPROVED: 'Disetujui',
  PARTIALLY_APPROVED: 'Disetujui Sebagian',
  REJECTED: 'Ditolak',
}

export const REQUEST_STATUS_COLORS: Record<RequestStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-green-100 text-green-800',
  PARTIALLY_APPROVED: 'bg-blue-100 text-blue-800',
  REJECTED: 'bg-red-100 text-red-800',
}

export const MAX_ITEMS_PER_REQUEST = 10

export const STOCK_CHANGE_TYPES = {
  APPROVED: 'APPROVED',
  DAMAGED: 'DAMAGED',
} as const

export const NOTIFICATION_TYPES = {
  NEW_REQUEST: 'NEW_REQUEST',
  STATUS_CHANGED: 'STATUS_CHANGED',
} as const

export const FIELD_TYPES = {
  TEXT: 'text',
  DROPDOWN: 'dropdown',
  NUMBER: 'number',
} as const

export const ITEMS_PER_PAGE = 10
