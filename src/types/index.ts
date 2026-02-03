import { RequestStatus } from '@prisma/client'

// ==================== API Response ====================
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// ==================== Auth ====================
export interface AdminPayload {
  id: string
  username: string
  name: string
}

export interface LoginRequest {
  username: string
  password: string
}

// ==================== Division ====================
export interface DivisionData {
  id: string
  name: string
  isActive: boolean
  createdAt: Date
}

// ==================== Item ====================
export interface ItemData {
  id: string
  name: string
  stock: number
  threshold: number
  isActive: boolean
  createdAt: Date
}

export interface ItemWithStatus extends ItemData {
  isLowStock: boolean
}

export interface CreateItemRequest {
  name: string
  stock: number
  threshold?: number
}

export interface UpdateStockRequest {
  stock: number
}

export interface DamagedItemRequest {
  qty: number
  notes: string
}

// ==================== Form Field ====================
export interface FormFieldData {
  id: string
  fieldName: string
  fieldType: 'text' | 'dropdown' | 'number'
  fieldLabel: string
  options?: { value: string; label: string }[]
  isRequired: boolean
  sortOrder: number
  isActive: boolean
}

export interface CreateFormFieldRequest {
  fieldName: string
  fieldType: 'text' | 'dropdown' | 'number'
  fieldLabel: string
  options?: { value: string; label: string }[]
  isRequired: boolean
}

// ==================== Request ====================
export interface RequestItemInput {
  itemId: string
  qtyRequested: number
}

export interface CreateRequestInput {
  requesterName: string
  divisionId: string
  requestDate: string
  formData: Record<string, unknown>
  items: RequestItemInput[]
}

export interface RequestItemData {
  id: string
  itemId: string
  itemName: string
  qtyRequested: number
  qtyApproved: number | null
}

export interface RequestData {
  id: string
  requestNumber: string
  trackingToken: string
  requesterName: string
  divisionId: string
  divisionName: string
  status: RequestStatus
  rejectionReason: string | null
  formData: Record<string, unknown>
  requestDate: Date
  approvalDate: Date | null
  approvedByName: string | null
  items: RequestItemData[]
}

export interface ApproveRequestInput {
  items: {
    requestItemId: string
    qtyApproved: number
  }[]
}

export interface RejectRequestInput {
  reason: string
}

// ==================== Dashboard ====================
export interface DashboardData {
  totalStock: number
  totalItems: number
  lowStockItems: ItemWithStatus[]
  pendingRequests: number
  recentRequests: RequestData[]
}

// ==================== History ====================
export interface HistoryFilter {
  startDate?: string
  endDate?: string
  itemId?: string
  status?: RequestStatus
  page?: number
  limit?: number
}

export interface StockHistoryData {
  id: string
  itemId: string
  itemName: string
  changeType: string
  qtyChange: number
  notes: string | null
  requestNumber: string | null
  adminName: string
  createdAt: Date
}

// ==================== Notification ====================
export interface NotificationData {
  id: string
  type: string
  title: string
  message: string
  requestId: string | null
  isRead: boolean
  createdAt: Date
}

// ==================== Form Data (Public) ====================
export interface PublicFormData {
  fields: FormFieldData[]
  divisions: DivisionData[]
  items: ItemData[]
}
