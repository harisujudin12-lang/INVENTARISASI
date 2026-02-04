'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, Button, Select, LoadingSpinner, StatusBadge, Toast } from '@/components/ui'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableEmpty } from '@/components/ui'
import { formatDate } from '@/lib/utils'
import { RequestStatus } from '@prisma/client'
import { REQUEST_STATUS_LABELS } from '@/lib/constants'
import { fetchWithAuth } from '@/lib/fetchClient'

interface RequestData {
  id: string
  requestNumber: string
  requesterName: string
  divisionName: string
  status: RequestStatus
  requestDate: string
  items: { itemName: string; qtyRequested: number }[]
}

interface PaginatedData {
  requests: RequestData[]
  total: number
  page: number
  totalPages: number
}

export default function RequestsPage() {
  const [data, setData] = useState<PaginatedData | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  useEffect(() => {
    fetchRequests()
  }, [page, statusFilter])

  async function fetchRequests() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', page.toString())
      if (statusFilter) params.set('status', statusFilter)

      const res = await fetchWithAuth(`/api/admin/requests?${params}`)
      const json = await res.json()
      if (json.success) {
        setData(json.data)
      }
    } catch (error) {
      console.error('Fetch requests error:', error)
    } finally {
      setLoading(false)
    }
  }

  const statusOptions = [
    { value: '', label: 'Semua Status' },
    ...Object.entries(REQUEST_STATUS_LABELS).map(([value, label]) => ({
      value,
      label,
    })),
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Daftar Request</h1>
        <div className="w-full sm:w-48">
          <Select
            options={statusOptions}
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value)
              setPage(1)
            }}
          />
        </div>
      </div>

      <Card padding="none">
        {loading ? (
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
                  <TableHead className="hidden md:table-cell">Divisi</TableHead>
                  <TableHead className="hidden lg:table-cell">Barang</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Tanggal</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!data || data.requests.length === 0 ? (
                  <TableEmpty message="Tidak ada request" />
                ) : (
                  data.requests.map((req) => (
                    <TableRow key={req.id}>
                      <TableCell className="font-medium text-gray-900">
                        {req.requestNumber}
                      </TableCell>
                      <TableCell>{req.requesterName}</TableCell>
                      <TableCell className="hidden md:table-cell text-gray-500">
                        {req.divisionName}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-gray-500">
                        {req.items.length} item
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={req.status} />
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-gray-500">
                        {formatDate(req.requestDate)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/admin/requests/${req.id}`}>
                          <Button size="sm" variant="ghost">
                            Detail
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            {/* Pagination */}
            {data && data.totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t">
                <p className="text-sm text-gray-500">
                  Halaman {data.page} dari {data.totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={page === 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    Sebelumnya
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={page === data.totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Selanjutnya
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

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
