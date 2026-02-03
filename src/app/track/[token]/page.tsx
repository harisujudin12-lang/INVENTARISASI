'use client'

import { useState, useEffect } from 'react'
import { Button, Card, Toast, LoadingSpinner, StatusBadge } from '@/components/ui'
import { formatDate } from '@/lib/utils'
import { RequestStatus } from '@prisma/client'

interface RequestItem {
  id: string
  itemId: string
  itemName: string
  qtyRequested: number
  qtyApproved: number | null
}

interface Notification {
  id: string
  type: string
  title: string
  message: string
  isRead: boolean
  createdAt: string
}

interface RequestData {
  id: string
  requestNumber: string
  trackingToken: string
  requesterName: string
  divisionName: string
  status: RequestStatus
  rejectionReason: string | null
  formData: Record<string, unknown>
  requestDate: string
  approvalDate: string | null
  approvedByName: string | null
  items: RequestItem[]
  notifications: Notification[]
}

interface TrackingPageProps {
  params: { token: string }
}

export default function TrackingPage({ params }: TrackingPageProps) {
  const token = params.token
  
  return <TrackingPageContent token={token} />
}

function TrackingPageContent({ token }: { token: string }) {
  const [data, setData] = useState<RequestData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showNotifications, setShowNotifications] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  useEffect(() => {
    fetchData()
  }, [token])

  async function fetchData() {
    try {
      const res = await fetch(`/api/public/track/${token}`)
      const json = await res.json()

      if (json.success) {
        setData(json.data)
      } else {
        setError(json.error || 'Request tidak ditemukan')
      }
    } catch (err) {
      console.error('Fetch error:', err)
      setError('Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <Card className="max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Request Tidak Ditemukan</h1>
          <p className="text-gray-600 text-sm mb-4">{error}</p>
          <Button onClick={() => window.location.href = '/request'}>
            Buat Request Baru
          </Button>
        </Card>
      </div>
    )
  }

  const unreadNotifications = data.notifications.filter((n) => !n.isRead)
  const isPending = data.status === 'PENDING'

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-lg font-bold text-gray-900">Status Request</h1>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-gray-600 hover:text-gray-900"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {unreadNotifications.length > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {unreadNotifications.length}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Notifications Dropdown */}
      {showNotifications && (
        <div className="max-w-md mx-auto px-4 mb-4">
          <Card padding="sm">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Notifikasi</h3>
            {data.notifications.length === 0 ? (
              <p className="text-sm text-gray-500">Tidak ada notifikasi</p>
            ) : (
              <div className="space-y-2">
                {data.notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`p-2 rounded text-sm ${
                      notif.isRead ? 'bg-gray-50' : 'bg-blue-50'
                    }`}
                  >
                    <p className="font-medium text-gray-900">{notif.title}</p>
                    <p className="text-gray-600 text-xs">{notif.message}</p>
                    <p className="text-gray-400 text-xs mt-1">
                      {formatDate(notif.createdAt)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Content */}
      <div className="max-w-md mx-auto px-4 py-6 space-y-4">
        {/* Status Card */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs text-gray-500">Nomor Request</p>
              <p className="text-lg font-bold text-gray-900">{data.requestNumber}</p>
            </div>
            <StatusBadge status={data.status} />
          </div>

          {data.status === 'REJECTED' && data.rejectionReason && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-red-800">
                <span className="font-medium">Alasan Penolakan:</span> {data.rejectionReason}
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Nama</p>
              <p className="font-medium text-gray-900">{data.requesterName}</p>
            </div>
            <div>
              <p className="text-gray-500">Divisi</p>
              <p className="font-medium text-gray-900">{data.divisionName}</p>
            </div>
            <div>
              <p className="text-gray-500">Tanggal Request</p>
              <p className="font-medium text-gray-900">{formatDate(data.requestDate)}</p>
            </div>
            {data.approvalDate && (
              <div>
                <p className="text-gray-500">Tanggal Approval</p>
                <p className="font-medium text-gray-900">{formatDate(data.approvalDate)}</p>
              </div>
            )}
          </div>
        </Card>

        {/* Items Card */}
        <Card>
          <h3 className="text-base font-semibold text-gray-900 mb-4">Daftar Barang</h3>
          <div className="space-y-3">
            {data.items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between py-2 border-b last:border-0"
              >
                <div>
                  <p className="font-medium text-gray-900">{item.itemName}</p>
                  <div className="flex gap-4 text-sm text-gray-500">
                    <span>Diminta: {item.qtyRequested}</span>
                    {item.qtyApproved !== null && (
                      <span className={item.qtyApproved < item.qtyRequested ? 'text-orange-600' : 'text-green-600'}>
                        Disetujui: {item.qtyApproved}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Actions */}
        {isPending && (
          <div className="pt-4">
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => {
                setToast({ message: 'Fitur edit akan segera tersedia', type: 'error' })
              }}
            >
              Edit Request
            </Button>
          </div>
        )}

        {/* Copy Link */}
        <div className="pt-4 pb-8">
          <Button
            variant="ghost"
            className="w-full"
            onClick={() => {
              navigator.clipboard.writeText(window.location.href)
              setToast({ message: 'Link berhasil disalin!', type: 'success' })
            }}
          >
            Salin Link Tracking
          </Button>
        </div>
      </div>

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