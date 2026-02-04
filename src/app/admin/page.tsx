'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardHeader, LoadingSpinner, StatusBadge, StockBadge } from '@/components/ui'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableEmpty } from '@/components/ui'
import { formatDate } from '@/lib/utils'
import { fetchWithAuth } from '@/lib/fetchClient'
import { RequestStatus } from '@prisma/client'

interface ItemWithStatus {
  id: string
  name: string
  stock: number
  threshold: number
  isLowStock: boolean
}

interface RequestData {
  id: string
  requestNumber: string
  requesterName: string
  divisionName: string
  status: RequestStatus
  
  requestDate: string
}

interface DashboardData {
  totalStock: number
  totalItems: number
  lowStockItems: ItemWithStatus[]
  pendingRequests: number
  recentRequests: RequestData[]
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboard()
  }, [])

  async function fetchDashboard() {
    try {
      const res = await fetchWithAuth('/api/admin/dashboard')
      const json = await res.json()
      if (json.success) {
        setData(json.data)
      }
    } catch (error) {
      console.error('Fetch dashboard error:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-12 text-gray-500">
        Gagal memuat data
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <p className="text-sm text-gray-500">Total Stok</p>
          <p className="text-2xl font-bold text-gray-900">{data.totalStock.toLocaleString()}</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500">Total Barang</p>
          <p className="text-2xl font-bold text-gray-900">{data.totalItems}</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500">Barang Menipis</p>
          <p className="text-2xl font-bold text-orange-600">{data.lowStockItems.length}</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500">Request Pending</p>
          <p className="text-2xl font-bold text-blue-600">{data.pendingRequests}</p>
        </Card>
      </div>

      {/* Low Stock Items */}
      {data.lowStockItems.length > 0 && (
        <Card padding="none">
          <div className="p-4 border-b">
            <CardHeader
              title="Barang Menipis"
              description="Barang dengan stok di bawah threshold"
              action={
                <Link
                  href="/admin/inventory"
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  Lihat Semua →
                </Link>
              }
            />
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama Barang</TableHead>
                <TableHead className="text-right">Stok</TableHead>
                <TableHead className="text-right">Threshold</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.lowStockItems.slice(0, 5).map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium text-gray-900">
                    {item.name}
                  </TableCell>
                  <TableCell className="text-right">{item.stock}</TableCell>
                  <TableCell className="text-right text-gray-500">
                    {item.threshold}
                  </TableCell>
                  <TableCell>
                    <StockBadge stock={item.stock} threshold={item.threshold} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Recent Requests */}
      <Card padding="none">
        <div className="p-4 border-b">
          <CardHeader
            title="Request Terbaru"
            description="5 request terakhir"
            action={
              <Link
                href="/admin/requests"
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Lihat Semua →
              </Link>
            }
          />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>No Request</TableHead>
              <TableHead>Requester</TableHead>
              <TableHead className="hidden md:table-cell">Divisi</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden md:table-cell">Tanggal</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.recentRequests.length === 0 ? (
              <TableEmpty message="Belum ada request" />
            ) : (
              data.recentRequests.map((req) => (
                <TableRow
                  key={req.id}
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => window.location.href = `/admin/requests/${req.id}`}
                >
                  <TableCell className="font-medium text-gray-900">
                    {req.requestNumber}
                  </TableCell>
                  <TableCell>{req.requesterName}</TableCell>
                  <TableCell className="hidden md:table-cell text-gray-500">
                    {req.divisionName}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={req.status} />
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-gray-500">
                    {formatDate(req.requestDate)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
