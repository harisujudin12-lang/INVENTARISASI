'use client'

import { useState, useEffect } from 'react'
import { Card, Button, Select, LoadingSpinner, Toast } from '@/components/ui'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableEmpty } from '@/components/ui'
import { formatDate, formatDateTime } from '@/lib/utils'
import { REQUEST_STATUS_LABELS } from '@/lib/constants'

// ==================== INTERFACES ====================
interface RequestHistoryRecord {
  id: string
  requestNumber: string
  requesterName: string
  divisionName: string
  status: string
  rejectionReason: string | null
  requestDate: string
  approvalDate: string | null
  approvedByName: string | null
  items: Array<{
    itemName: string
    qtyRequested: number
    qtyApproved: number | null
  }>
}

interface RestockReductionRecord {
  id: string
  itemName: string
  changeType: string
  action: string
  qtyChange: number
  notes: string | null
  adminName: string
  createdAt: string
}

interface AdjustmentRecord {
  id: string
  itemName: string
  stockBefore: number
  stockAfter: number
  reason: string | null
  adminName: string
  createdAt: string
}

interface Pagination {
  total: number
  page: number
  limit: number
  totalPages: number
}

const REQUEST_STATUS_OPTIONS = [
  { value: '', label: 'Semua Status' },
  { value: 'PENDING', label: 'Menunggu' },
  { value: 'APPROVED', label: 'Disetujui' },
  { value: 'PARTIALLY_APPROVED', label: 'Disetujui Sebagian' },
  { value: 'REJECTED', label: 'Ditolak' },
]

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-green-100 text-green-800',
  PARTIALLY_APPROVED: 'bg-blue-100 text-blue-800',
  REJECTED: 'bg-red-100 text-red-800',
}

export default function HistoryPage() {
  const [activeTab, setActiveTab] = useState<'request' | 'restock' | 'adjustment'>('request')
  
  // Request History State
  const [requestRecords, setRequestRecords] = useState<RequestHistoryRecord[]>([])
  const [requestPagination, setRequestPagination] = useState<Pagination | null>(null)
  const [requestLoading, setRequestLoading] = useState(true)
  const [requestStatus, setRequestStatus] = useState('')
  const [requestStartDate, setRequestStartDate] = useState('')
  const [requestEndDate, setRequestEndDate] = useState('')
  const [requestPage, setRequestPage] = useState(1)

  // Restock/Reduction State
  const [restockRecords, setRestockRecords] = useState<RestockReductionRecord[]>([])
  const [restockPagination, setRestockPagination] = useState<Pagination | null>(null)
  const [restockLoading, setRestockLoading] = useState(true)
  const [restockPage, setRestockPage] = useState(1)

  // Adjustment State
  const [adjustmentRecords, setAdjustmentRecords] = useState<AdjustmentRecord[]>([])
  const [adjustmentPagination, setAdjustmentPagination] = useState<Pagination | null>(null)
  const [adjustmentLoading, setAdjustmentLoading] = useState(true)
  const [adjustmentPage, setAdjustmentPage] = useState(1)

  const [exporting, setExporting] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  useEffect(() => {
    if (activeTab === 'request') {
      fetchRequestHistory()
    } else if (activeTab === 'restock') {
      fetchRestockHistory()
    } else {
      fetchAdjustmentHistory()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, requestPage, restockPage, adjustmentPage, requestStatus])

  // ==================== REQUEST HISTORY ====================
  async function fetchRequestHistory() {
    setRequestLoading(true)
    try {
      const params = new URLSearchParams({
        page: requestPage.toString(),
        limit: '20',
      })

      if (requestStatus) params.set('status', requestStatus)
      if (requestStartDate) params.set('startDate', requestStartDate)
      if (requestEndDate) params.set('endDate', requestEndDate)

      const res = await fetchWithAuth(`/api/admin/history/requests?${params}`)
      const json = await res.json()

      if (json.success) {
        setRequestRecords(json.data)
        setRequestPagination(json.pagination)
      }
    } catch (error) {
      console.error('Fetch request history error:', error)
    } finally {
      setRequestLoading(false)
    }
  }

  async function exportRequestHistory() {
    setExporting(true)
    try {
      const res = await fetchWithAuth('/api/admin/history/requests/export')
      if (!res.ok) throw new Error('Export failed')
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `history-request-${new Date().toISOString().split('T')[0]}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      setToast({ message: 'Export berhasil', type: 'success' })
    } catch (error) {
      console.error('Export error:', error)
      setToast({ message: 'Gagal export', type: 'error' })
    } finally {
      setExporting(false)
    }
  }

  // ==================== RESTOCK/REDUCTION HISTORY ====================
  async function fetchRestockHistory() {
    setRestockLoading(true)
    try {
      const res = await fetchWithAuth(`/api/admin/history/restock?page=${restockPage}&limit=20`)
      const json = await res.json()

      if (json.success) {
        setRestockRecords(json.data)
        setRestockPagination(json.pagination)
      }
    } catch (error) {
      console.error('Fetch restock history error:', error)
    } finally {
      setRestockLoading(false)
    }
  }

  async function exportRestockHistory() {
    setExporting(true)
    try {
      const res = await fetchWithAuth('/api/admin/history/restock/export')
      if (!res.ok) throw new Error('Export failed')
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `history-restock-${new Date().toISOString().split('T')[0]}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      setToast({ message: 'Export berhasil', type: 'success' })
    } catch (error) {
      console.error('Export error:', error)
      setToast({ message: 'Gagal export', type: 'error' })
    } finally {
      setExporting(false)
    }
  }

  // ==================== ADJUSTMENT HISTORY ====================
  async function fetchAdjustmentHistory() {
    setAdjustmentLoading(true)
    try {
      const res = await fetchWithAuth(`/api/admin/history/adjustments?page=${adjustmentPage}&limit=20`)
      const json = await res.json()

      if (json.success) {
        setAdjustmentRecords(json.data)
        setAdjustmentPagination(json.pagination)
      }
    } catch (error) {
      console.error('Fetch adjustment history error:', error)
    } finally {
      setAdjustmentLoading(false)
    }
  }

  async function exportAdjustmentHistory() {
    setExporting(true)
    try {
      const res = await fetchWithAuth('/api/admin/history/adjustments/export')
      if (!res.ok) throw new Error('Export failed')
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `history-adjustment-${new Date().toISOString().split('T')[0]}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      setToast({ message: 'Export berhasil', type: 'success' })
    } catch (error) {
      console.error('Export error:', error)
      setToast({ message: 'Gagal export', type: 'error' })
    } finally {
      setExporting(false)
    }
  }

  function handleRequestFilter() {
    setRequestPage(1)
    fetchRequestHistory()
  }

  function handleResetRequestFilter() {
    setRequestStatus('')
    setRequestStartDate('')
    setRequestEndDate('')
    setRequestPage(1)
    fetchRequestHistory()
  }

  /*
  async function handleExportRestockReduction(format: 'excel' | 'csv') {
    setExporting(true)
    try {
      const params = new URLSearchParams({ format })
      if (filterStartDate) params.set('startDate', filterStartDate)
      if (filterEndDate) params.set('endDate', filterEndDate)

      const res = await fetchWithAuth(`/api/admin/history/export-restock-reduction?${params}`)

      if (res.ok) {
        const blob = await res.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `restock-reduction_${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : 'csv'}`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
        setToast({ message: 'Export berhasil', type: 'success' })
      } else {
        setToast({ message: 'Gagal export data', type: 'error' })
      }
    } catch (error) {
      console.error('Export error:', error)
      setToast({ message: 'Terjadi kesalahan saat export', type: 'error' })
    } finally {
      setExporting(false)
    }
  }

  async function handleExportAdjustment(format: 'excel' | 'csv') {
    setExporting(true)
    try {
      const params = new URLSearchParams({ format })
      if (filterStartDate) params.set('startDate', filterStartDate)
      if (filterEndDate) params.set('endDate', filterEndDate)

      const res = await fetchWithAuth(`/api/admin/history/export-adjustment?${params}`)

      if (res.ok) {
        const blob = await res.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `adjustment_${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : 'csv'}`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
        setToast({ message: 'Export berhasil', type: 'success' })
      } else {
        setToast({ message: 'Gagal export data', type: 'error' })
      }
    } catch (error) {
      console.error('Export error:', error)
      setToast({ message: 'Terjadi kesalahan saat export', type: 'error' })
    } finally {
      setExporting(false)
    }
  }
  */

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Riwayat Inventory</h1>
        <p className="text-sm text-gray-600 mt-1">Kelola dan export data riwayat</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-8">
          <button
            onClick={() => setActiveTab('request')}
            className={`px-4 py-3 font-medium text-sm border-b-2 transition ${
              activeTab === 'request'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Request & Approval
          </button>
          <button
            onClick={() => setActiveTab('restock')}
            className={`px-4 py-3 font-medium text-sm border-b-2 transition ${
              activeTab === 'restock'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Restock & Reduction
          </button>
          <button
            onClick={() => setActiveTab('adjustment')}
            className={`px-4 py-3 font-medium text-sm border-b-2 transition ${
              activeTab === 'adjustment'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Adjustment
          </button>
        </div>
      </div>

      {/* TAB 1: REQUEST & APPROVAL */}
      {activeTab === 'request' && (
        <div className="space-y-4">
          {/* Filter */}
          <Card>
            <div className="p-4">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <Select
                  label="Status"
                  value={requestStatus}
                  onChange={(e) => setRequestStatus(e.target.value)}
                  options={REQUEST_STATUS_OPTIONS}
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dari Tanggal
                  </label>
                  <input
                    type="date"
                    value={requestStartDate}
                    onChange={(e) => setRequestStartDate(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sampai Tanggal
                  </label>
                  <input
                    type="date"
                    value={requestEndDate}
                    onChange={(e) => setRequestEndDate(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 focus:outline-none"
                  />
                </div>
                <div className="flex items-end gap-2">
                  <Button onClick={handleRequestFilter} className="flex-1">
                    Filter
                  </Button>
                  <Button variant="secondary" onClick={handleResetRequestFilter} size="sm">
                    Reset
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          {/* Export Button */}
          <div className="flex gap-2">
            <Button
              onClick={exportRequestHistory}
              disabled={exporting}
              variant="secondary"
            >
              {exporting ? 'Exporting...' : 'Export Excel'}
            </Button>
          </div>

          {/* Table */}
          <Card padding="none">
            {requestLoading ? (
              <div className="flex items-center justify-center py-12">
                <LoadingSpinner />
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>No Request</TableHead>
                      <TableHead>Requester</TableHead>
                      <TableHead>Divisi</TableHead>
                      <TableHead className="hidden sm:table-cell">Barang</TableHead>
                      <TableHead className="text-right">Qty Req</TableHead>
                      <TableHead className="text-right">Qty Appr</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="hidden md:table-cell">Diproses Oleh</TableHead>
                      <TableHead className="hidden lg:table-cell">Tgl Request</TableHead>
                      <TableHead className="hidden lg:table-cell">Tgl Approval</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requestRecords.length === 0 ? (
                      <TableEmpty message="Tidak ada data" />
                    ) : (
                      requestRecords.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell className="font-medium">{record.requestNumber}</TableCell>
                          <TableCell>{record.requesterName}</TableCell>
                          <TableCell>{record.divisionName}</TableCell>
                          <TableCell className="hidden sm:table-cell text-sm">
                            {record.items.map((i) => i.itemName).join(', ')}
                          </TableCell>
                          <TableCell className="text-right">{record.items.reduce((sum, i) => sum + i.qtyRequested, 0)}</TableCell>
                          <TableCell className="text-right">
                            {record.items.reduce((sum, i) => sum + (i.qtyApproved || 0), 0)}
                          </TableCell>
                          <TableCell>
                            <span
                              className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                                STATUS_COLORS[record.status] || 'bg-gray-100 text-gray-700'
                              }`}
                            >
                              {REQUEST_STATUS_LABELS[record.status as keyof typeof REQUEST_STATUS_LABELS] || record.status}
                            </span>
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-sm">
                            {record.approvedByName || '-'}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell text-sm">
                            {formatDate(record.requestDate)}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell text-sm">
                            {record.approvalDate ? formatDate(record.approvalDate) : '-'}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>

                {/* Pagination */}
                {requestPagination && requestPagination.totalPages > 1 && (
                  <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
                    <p className="text-sm text-gray-500">
                      Halaman {requestPagination.page} dari {requestPagination.totalPages}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setRequestPage((p) => Math.max(1, p - 1))}
                        disabled={requestPage === 1}
                      >
                        Prev
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setRequestPage((p) => Math.min(requestPagination.totalPages, p + 1))}
                        disabled={requestPage === requestPagination.totalPages}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </Card>
        </div>
      )}

      {/* TAB 2: RESTOCK & REDUCTION */}
      {activeTab === 'restock' && (
        <div className="space-y-4">
          {/* Export Button */}
          <div className="flex gap-2">
            <Button
              onClick={exportRestockHistory}
              disabled={exporting}
              variant="secondary"
            >
              {exporting ? 'Exporting...' : 'Export Excel'}
            </Button>
          </div>

          {/* Table */}
          <Card padding="none">
            {restockLoading ? (
              <div className="flex items-center justify-center py-12">
                <LoadingSpinner />
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Barang</TableHead>
                      <TableHead>Tipe</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead>Admin</TableHead>
                      <TableHead>Tanggal</TableHead>
                      <TableHead className="hidden sm:table-cell">Catatan</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {restockRecords.length === 0 ? (
                      <TableEmpty message="Tidak ada data" />
                    ) : (
                      restockRecords.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell className="font-medium">{record.itemName}</TableCell>
                          <TableCell>
                            <span
                              className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                                record.changeType === 'APPROVED'
                                  ? 'bg-green-100 text-green-700'
                                  : record.changeType === 'DAMAGED'
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-blue-100 text-blue-700'
                              }`}
                            >
                              {record.action === 'restock' ? 'Restock' : 'Reduction'}
                            </span>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            <span className={record.qtyChange > 0 ? 'text-green-600' : 'text-red-600'}>
                              {record.qtyChange > 0 ? '+' : ''}{record.qtyChange}
                            </span>
                          </TableCell>
                          <TableCell className="text-sm">{record.adminName}</TableCell>
                          <TableCell className="text-sm">{formatDate(record.createdAt)}</TableCell>
                          <TableCell className="hidden sm:table-cell text-sm text-gray-500">
                            {record.notes || '-'}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>

                {/* Pagination */}
                {restockPagination && restockPagination.totalPages > 1 && (
                  <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
                    <p className="text-sm text-gray-500">
                      Halaman {restockPagination.page} dari {restockPagination.totalPages}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setRestockPage((p) => Math.max(1, p - 1))}
                        disabled={restockPage === 1}
                      >
                        Prev
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setRestockPage((p) => Math.min(restockPagination.totalPages, p + 1))}
                        disabled={restockPage === restockPagination.totalPages}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </Card>
        </div>
      )}

      {/* TAB 3: ADJUSTMENT */}
      {activeTab === 'adjustment' && (
        <div className="space-y-4">
          {/* Export Button */}
          <div className="flex gap-2">
            <Button
              onClick={exportAdjustmentHistory}
              disabled={exporting}
              variant="secondary"
            >
              {exporting ? 'Exporting...' : 'Export Excel'}
            </Button>
          </div>

          {/* Table */}
          <Card padding="none">
            {adjustmentLoading ? (
              <div className="flex items-center justify-center py-12">
                <LoadingSpinner />
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Barang</TableHead>
                      <TableHead className="text-right">Sebelum</TableHead>
                      <TableHead className="text-right">Sesudah</TableHead>
                      <TableHead className="text-right">Selisih</TableHead>
                      <TableHead>Admin</TableHead>
                      <TableHead>Tanggal</TableHead>
                      <TableHead className="hidden sm:table-cell">Alasan</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {adjustmentRecords.length === 0 ? (
                      <TableEmpty message="Tidak ada data" />
                    ) : (
                      adjustmentRecords.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell className="font-medium">{record.itemName}</TableCell>
                          <TableCell className="text-right">{record.stockBefore}</TableCell>
                          <TableCell className="text-right">{record.stockAfter}</TableCell>
                          <TableCell className="text-right font-medium">
                            <span className={record.stockAfter - record.stockBefore > 0 ? 'text-green-600' : 'text-red-600'}>
                              {record.stockAfter - record.stockBefore > 0 ? '+' : ''}{record.stockAfter - record.stockBefore}
                            </span>
                          </TableCell>
                          <TableCell className="text-sm">{record.adminName}</TableCell>
                          <TableCell className="text-sm">{formatDate(record.createdAt)}</TableCell>
                          <TableCell className="hidden sm:table-cell text-sm text-gray-500">
                            {record.reason || '-'}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>

                {/* Pagination */}
                {adjustmentPagination && adjustmentPagination.totalPages > 1 && (
                  <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
                    <p className="text-sm text-gray-500">
                      Halaman {adjustmentPagination.page} dari {adjustmentPagination.totalPages}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setAdjustmentPage((p) => Math.max(1, p - 1))}
                        disabled={adjustmentPage === 1}
                      >
                        Prev
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setAdjustmentPage((p) => Math.min(adjustmentPagination.totalPages, p + 1))}
                        disabled={adjustmentPage === adjustmentPagination.totalPages}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </Card>
        </div>
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  )
}
