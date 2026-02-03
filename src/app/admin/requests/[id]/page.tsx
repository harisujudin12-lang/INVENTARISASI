'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, Button, Input, Modal, LoadingSpinner, StatusBadge, Toast } from '@/components/ui'
import { formatDate } from '@/lib/utils'
import { RequestStatus } from '@prisma/client'

interface RequestItem {
  id: string
  itemId: string
  itemName: string
  qtyRequested: number
  qtyApproved: number | null
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
}

interface PageProps {
  params: { id: string }
}

export default function RequestDetailPage({ params }: PageProps) {
  const id = params.id
  const router = useRouter()
  const [data, setData] = useState<RequestData | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [showApproveModal, setShowApproveModal] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [approvalItems, setApprovalItems] = useState<{ requestItemId: string; qtyApproved: number }[]>([])
  const [rejectReason, setRejectReason] = useState('')
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  useEffect(() => {
    fetchRequest()
  }, [id])

  async function fetchRequest() {
    try {
      const res = await fetch(`/api/admin/requests/${id}`)
      const json = await res.json()
      if (json.success) {
        setData(json.data)
        setApprovalItems(
          json.data.items.map((item: RequestItem) => ({
            requestItemId: item.id,
            qtyApproved: item.qtyRequested,
          }))
        )
      } else {
        setToast({ message: json.error || 'Request tidak ditemukan', type: 'error' })
      }
    } catch (error) {
      console.error('Fetch request error:', error)
      setToast({ message: 'Terjadi kesalahan', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  function handleApprovalQtyChange(requestItemId: string, qty: number) {
    setApprovalItems((prev) =>
      prev.map((item) =>
        item.requestItemId === requestItemId ? { ...item, qtyApproved: qty } : item
      )
    )
  }

  async function handleApprove() {
    setProcessing(true)
    try {
      const res = await fetch(`/api/admin/requests/${id}/approve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: approvalItems }),
      })

      const json = await res.json()

      if (json.success) {
        setToast({ message: 'Request berhasil diproses', type: 'success' })
        setShowApproveModal(false)
        fetchRequest()
      } else {
        setToast({ message: json.error || 'Gagal memproses request', type: 'error' })
      }
    } catch (error) {
      console.error('Approve error:', error)
      setToast({ message: 'Terjadi kesalahan', type: 'error' })
    } finally {
      setProcessing(false)
    }
  }

  async function handleReject() {
    if (!rejectReason.trim()) {
      setToast({ message: 'Alasan penolakan wajib diisi', type: 'error' })
      return
    }

    setProcessing(true)
    try {
      const res = await fetch(`/api/admin/requests/${id}/reject`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectReason }),
      })

      const json = await res.json()

      if (json.success) {
        setToast({ message: 'Request berhasil ditolak', type: 'success' })
        setShowRejectModal(false)
        fetchRequest()
      } else {
        setToast({ message: json.error || 'Gagal menolak request', type: 'error' })
      }
    } catch (error) {
      console.error('Reject error:', error)
      setToast({ message: 'Terjadi kesalahan', type: 'error' })
    } finally {
      setProcessing(false)
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
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">Request tidak ditemukan</p>
        <Button onClick={() => router.back()}>Kembali</Button>
      </div>
    )
  }

  const isPending = data.status === 'PENDING'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <button
            onClick={() => router.back()}
            className="text-sm text-gray-500 hover:text-gray-700 mb-2 flex items-center gap-1"
          >
            ← Kembali
          </button>
          <h1 className="text-2xl font-bold text-gray-900">{data.requestNumber}</h1>
        </div>
        <StatusBadge status={data.status} />
      </div>

      {/* Rejection Reason */}
      {data.status === 'REJECTED' && data.rejectionReason && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-800">
            <span className="font-medium">Alasan Penolakan:</span> {data.rejectionReason}
          </p>
        </div>
      )}

      {/* Info */}
      <Card>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Informasi Request</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-500">Nama Requester</p>
            <p className="font-medium text-gray-900">{data.requesterName}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Divisi</p>
            <p className="font-medium text-gray-900">{data.divisionName}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Tanggal Request</p>
            <p className="font-medium text-gray-900">{formatDate(data.requestDate)}</p>
          </div>
          {data.approvalDate && (
            <div>
              <p className="text-sm text-gray-500">Tanggal Approval</p>
              <p className="font-medium text-gray-900">{formatDate(data.approvalDate)}</p>
            </div>
          )}
          {data.approvedByName && (
            <div>
              <p className="text-sm text-gray-500">Diproses Oleh</p>
              <p className="font-medium text-gray-900">{data.approvedByName}</p>
            </div>
          )}
        </div>

        {/* Additional Form Data */}
        {Object.keys(data.formData).length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Data Tambahan</h3>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(data.formData)
                .filter(([key]) => !['requester_name', 'division_id'].includes(key))
                .map(([key, value]) => (
                  <div key={key}>
                    <p className="text-sm text-gray-500">{key.replace(/_/g, ' ')}</p>
                    <p className="font-medium text-gray-900">{String(value) || '-'}</p>
                  </div>
                ))}
            </div>
          </div>
        )}
      </Card>

      {/* Items */}
      <Card>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Daftar Barang</h2>
        <div className="space-y-3">
          {data.items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between py-3 border-b last:border-0"
            >
              <div>
                <p className="font-medium text-gray-900">{item.itemName}</p>
                <div className="flex gap-4 text-sm">
                  <span className="text-gray-500">Diminta: {item.qtyRequested}</span>
                  {item.qtyApproved !== null && (
                    <span
                      className={
                        item.qtyApproved < item.qtyRequested
                          ? 'text-orange-600'
                          : 'text-green-600'
                      }
                    >
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
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            size="lg"
            className="flex-1"
            onClick={() => setShowApproveModal(true)}
          >
            Approve Request
          </Button>
          <Button
            size="lg"
            variant="danger"
            className="flex-1"
            onClick={() => setShowRejectModal(true)}
          >
            Tolak Request
          </Button>
        </div>
      )}

      {/* Approve Modal */}
      <Modal
        isOpen={showApproveModal}
        onClose={() => setShowApproveModal(false)}
        title="Approve Request"
        size="lg"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Tentukan jumlah yang disetujui untuk setiap barang:
          </p>

          {data.items.map((item) => {
            const approvalItem = approvalItems.find(
              (ai) => ai.requestItemId === item.id
            )
            return (
              <div key={item.id} className="flex items-center justify-between py-2">
                <div>
                  <p className="font-medium text-gray-900">{item.itemName}</p>
                  <p className="text-sm text-gray-500">Diminta: {item.qtyRequested}</p>
                </div>
                <input
                  type="number"
                  min="0"
                  max={item.qtyRequested}
                  value={approvalItem?.qtyApproved || 0}
                  onChange={(e) =>
                    handleApprovalQtyChange(
                      item.id,
                      Math.min(parseInt(e.target.value) || 0, item.qtyRequested)
                    )
                  }
                  className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-center"
                />
              </div>
            )
          })}

          <div className="flex gap-3 pt-4">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => setShowApproveModal(false)}
            >
              Batal
            </Button>
            <Button
              className="flex-1"
              onClick={handleApprove}
              isLoading={processing}
            >
              Konfirmasi
            </Button>
          </div>
        </div>
      </Modal>

      {/* Reject Modal */}
      <Modal
        isOpen={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        title="Tolak Request"
      >
        <div className="space-y-4">
          <Input
            label="Alasan Penolakan"
            required
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Masukkan alasan penolakan"
          />

          <div className="flex gap-3 pt-4">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => setShowRejectModal(false)}
            >
              Batal
            </Button>
            <Button
              variant="danger"
              className="flex-1"
              onClick={handleReject}
              isLoading={processing}
            >
              Tolak Request
            </Button>
          </div>
        </div>
      </Modal>

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
