'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, Button, Input, Modal, LoadingSpinner, Toast, Badge } from '@/components/ui'
import Image from 'next/image'
import { fetchWithAuth } from '@/lib/fetchClient'

interface ItemWithStatus {
  id: string
  name: string
  stock: number
  threshold: number
  imageUrl?: string | null
  isLowStock: boolean
  createdAt: string
  updatedAt: string
  isActive: boolean
}

interface ModalState {
  show: boolean
  itemId: string | null
}

export default function InventoryPage() {
  const [items, setItems] = useState<ItemWithStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [restockModal, setRestockModal] = useState<ModalState>({
    show: false,
    itemId: null,
  })
  const [reductionModal, setReductionModal] = useState<ModalState>({
    show: false,
    itemId: null,
  })
  const [adjustmentModal, setAdjustmentModal] = useState<ModalState>({
    show: false,
    itemId: null,
  })
  const [selectedItem, setSelectedItem] = useState<ItemWithStatus | null>(null)
  const [processing, setProcessing] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [adminId, setAdminId] = useState<string>('')

  // Form state
  const [formName, setFormName] = useState('')
  const [formThreshold, setFormThreshold] = useState(10)
  const [formImage, setFormImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>('')
  const [showImageModal, setShowImageModal] = useState(false)

  // Modal form state
  const [modalQuantity, setModalQuantity] = useState(0)
  const [modalReason, setModalReason] = useState('')

  useEffect(() => {
    fetchItems()
    fetchAdminId()
  }, [])

  async function fetchAdminId() {
    try {
      const res = await fetchWithAuth('/api/auth/me')
      const json = await res.json()
      if (json.data?.id) {
        setAdminId(json.data.id)
      }
    } catch (error) {
      console.error('Fetch admin error:', error)
    }
  }

  async function fetchItems() {
    try {
      const res = await fetchWithAuth('/api/admin/items')
      const json = await res.json()
      if (json.success) {
        setItems(json.data)
      }
    } catch (error) {
      console.error('Fetch items error:', error)
    } finally {
      setLoading(false)
    }
  }

  function resetForm() {
    setFormName('')
    setFormThreshold(10)
    setFormImage(null)
    setImagePreview('')
    setSelectedItem(null)
    setModalQuantity(0)
    setModalReason('')
  }

  function getFilteredItems() {
    if (!searchQuery.trim()) return items
    
    return items.filter((item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setToast({ message: 'Ukuran file max 5MB', type: 'error' })
        return
      }
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        setToast({ message: 'Format hanya jpg, png, webp', type: 'error' })
        return
      }
      setFormImage(file)
      const reader = new FileReader()
      reader.onload = (e) => setImagePreview(e.target?.result as string)
      reader.readAsDataURL(file)
    }
  }

  async function handleAdd() {
    if (!formName.trim()) {
      setToast({ message: 'Nama barang wajib diisi', type: 'error' })
      return
    }

    setProcessing(true)
    try {
      const res = await fetchWithAuth('/api/admin/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName,
          stock: 0,
          threshold: formThreshold,
        }),
      })

      const json = await res.json()

      if (json.success) {
        // Upload image jika ada
        if (formImage) {
          const formData = new FormData()
          formData.append('file', formImage)
          await fetchWithAuth(`/api/admin/items/${json.data.id}/upload-image`, {
            method: 'POST',
            body: formData,
          })
        }

        setToast({ message: 'Barang berhasil ditambahkan', type: 'success' })
        setShowAddModal(false)
        resetForm()
        fetchItems()
      } else {
        setToast({ message: json.error || 'Gagal menambahkan barang', type: 'error' })
      }
    } catch (error) {
      console.error('Add item error:', error)
      setToast({ message: 'Terjadi kesalahan', type: 'error' })
    } finally {
      setProcessing(false)
    }
  }

  async function handleEdit() {
    if (!selectedItem || !formName.trim()) return

    setProcessing(true)
    try {
      const res = await fetchWithAuth(`/api/admin/items/${selectedItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName,
          threshold: formThreshold,
        }),
      })

      const json = await res.json()

      if (json.success) {
        // Upload image jika ada
        if (formImage) {
          const formData = new FormData()
          formData.append('file', formImage)
          await fetchWithAuth(`/api/admin/items/${selectedItem.id}/upload-image`, {
            method: 'POST',
            body: formData,
          })
        }

        setToast({ message: 'Barang berhasil diperbarui', type: 'success' })
        setShowEditModal(false)
        resetForm()
        fetchItems()
      } else {
        setToast({ message: json.error || 'Gagal memperbarui barang', type: 'error' })
      }
    } catch (error) {
      console.error('Edit item error:', error)
      setToast({ message: 'Terjadi kesalahan', type: 'error' })
    } finally {
      setProcessing(false)
    }
  }

  async function handleRestock() {
    if (!selectedItem || !modalReason.trim()) {
      setToast({ message: 'Catatan restock wajib diisi', type: 'error' })
      return
    }

    if (modalQuantity <= 0) {
      setToast({ message: 'Jumlah restock harus lebih dari 0', type: 'error' })
      return
    }

    setProcessing(true)
    try {
      const res = await fetchWithAuth(`/api/admin/items/${selectedItem.id}/stock-action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'restock',
          quantity: modalQuantity,
          reason: modalReason,
          adminId,
        }),
      })

      const json = await res.json()

      if (json.success) {
        setToast({ message: 'Restock berhasil, tercatat di history', type: 'success' })
        setRestockModal({ show: false, itemId: null })
        resetForm()
        fetchItems()
      } else {
        setToast({ message: json.error || 'Gagal restock', type: 'error' })
      }
    } catch (error) {
      console.error('Restock error:', error)
      setToast({ message: 'Terjadi kesalahan', type: 'error' })
    } finally {
      setProcessing(false)
    }
  }

  async function handleReduction() {
    if (!selectedItem || !modalReason.trim()) {
      setToast({ message: 'Alasan pengurangan wajib diisi', type: 'error' })
      return
    }

    if (modalQuantity <= 0) {
      setToast({ message: 'Jumlah pengurangan harus lebih dari 0', type: 'error' })
      return
    }

    setProcessing(true)
    try {
      const res = await fetchWithAuth(`/api/admin/items/${selectedItem.id}/stock-action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reduction',
          quantity: -modalQuantity,
          reason: modalReason,
          adminId,
        }),
      })

      const json = await res.json()

      if (json.success) {
        setToast({ message: 'Pengurangan berhasil, tercatat di history', type: 'success' })
        setReductionModal({ show: false, itemId: null })
        resetForm()
        fetchItems()
      } else {
        setToast({ message: json.error || 'Gagal melakukan pengurangan', type: 'error' })
      }
    } catch (error) {
      console.error('Reduction error:', error)
      setToast({ message: 'Terjadi kesalahan', type: 'error' })
    } finally {
      setProcessing(false)
    }
  }

  async function handleAdjustment() {
    if (!selectedItem || !modalReason.trim()) {
      setToast({ message: 'Alasan adjustment wajib diisi', type: 'error' })
      return
    }

    setProcessing(true)
    try {
      const res = await fetchWithAuth(`/api/admin/items/${selectedItem.id}/stock-action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'adjustment',
          quantity: modalQuantity,
          reason: modalReason,
          adminId,
        }),
      })

      const json = await res.json()

      if (json.success) {
        setToast({ message: 'Adjustment berhasil', type: 'success' })
        setAdjustmentModal({ show: false, itemId: null })
        resetForm()
        fetchItems()
      } else {
        setToast({ message: json.error || 'Gagal adjustment', type: 'error' })
      }
    } catch (error) {
      console.error('Adjustment error:', error)
      setToast({ message: 'Terjadi kesalahan', type: 'error' })
    } finally {
      setProcessing(false)
    }
  }

  async function handleExport(format: 'excel' | 'csv') {
    try {
      const res = await fetchWithAuth(`/api/admin/items/export?format=${format}`)
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `inventory-${Date.now()}.${format === 'excel' ? 'xlsx' : 'csv'}`
      a.click()
      setToast({ message: 'Export berhasil', type: 'success' })
    } catch (error) {
      console.error('Export error:', error)
      setToast({ message: 'Gagal export', type: 'error' })
    }
  }

  function openRestockModal(item: ItemWithStatus) {
    setSelectedItem(item)
    setRestockModal({ show: true, itemId: item.id })
    setModalQuantity(0)
    setModalReason('')
  }

  function openReductionModal(item: ItemWithStatus) {
    setSelectedItem(item)
    setReductionModal({ show: true, itemId: item.id })
    setModalQuantity(0)
    setModalReason('')
  }

  function openEditModal(item: ItemWithStatus) {
    setSelectedItem(item)
    setFormName(item.name)
    setFormThreshold(item.threshold)
    setShowEditModal(true)
  }

  function openAdjustmentModal(item: ItemWithStatus) {
    setSelectedItem(item)
    setAdjustmentModal({ show: true, itemId: item.id })
    setModalQuantity(item.stock)
    setModalReason('')
  }

  function openImageModal(item: ItemWithStatus) {
    setSelectedItem(item)
    setShowImageModal(true)
  }

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div className="p-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Inventory</h1>
          <p className="text-gray-500">Total: {items.length} barang</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => { resetForm(); setShowAddModal(true) }} className="bg-blue-600 text-white">
            + Tambah Barang
          </Button>
          <Button onClick={() => handleExport('excel')} className="bg-green-600 text-white">
            Export Excel
          </Button>
          <Button onClick={() => handleExport('csv')} className="bg-emerald-600 text-white">
            Export CSV
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Cari barang by nama..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {searchQuery && (
          <p className="text-xs text-gray-500 mt-2">
            Menampilkan {getFilteredItems().length} dari {items.length} barang
          </p>
        )}
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {getFilteredItems().map((item) => (
          <Card key={item.id} className="hover:shadow-lg transition-shadow">
            {/* Image */}
            <div className="relative h-40 bg-gray-200 overflow-hidden rounded-t-lg">
              {item.imageUrl ? (
                <Image
                  src={item.imageUrl}
                  alt={item.name}
                  fill
                  className="object-cover cursor-pointer hover:opacity-75"
                  onClick={() => openImageModal(item)}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-300 text-gray-500">
                  No Image
                </div>
              )}
              <button
                onClick={() => openImageModal(item)}
                className="absolute bottom-2 right-2 bg-white rounded-full p-2 shadow hover:bg-gray-100"
                title="Upload image"
              >
                📷
              </button>
            </div>

            <CardHeader title={item.name}>
              <div className="mb-3">
                <div className="flex items-center gap-2">
                  <Badge
                    variant={item.isLowStock ? 'danger' : 'success'}
                    className={item.isLowStock ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}
                  >
                    {item.stock} / {item.threshold}
                  </Badge>
                </div>
              </div>

              {/* Stock indicator */}
              <div className="mb-4">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      item.isLowStock ? 'bg-red-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min((item.stock / item.threshold) * 100, 100)}%` }}
                  />
                </div>
              </div>


              {/* Action buttons 4-grid */}
              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={() => openRestockModal(item)}
                  className="text-xs bg-blue-500 text-white hover:bg-blue-600"
                >
                  Restock
                </Button>
                <Button
                  onClick={() => openReductionModal(item)}
                  className="text-xs bg-red-500 text-white hover:bg-red-600"
                >
                  Reduction
                </Button>
                <Button
                  onClick={() => openEditModal(item)}
                  className="text-xs bg-gray-500 text-white hover:bg-gray-600"
                >
                  Edit
                </Button>
                <Button
                  onClick={() => openAdjustmentModal(item)}
                  className="text-xs bg-yellow-500 text-white hover:bg-yellow-600"
                >
                  Adjustment
                </Button>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>

      {/* Add Item Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false)
          resetForm()
        }}
        title="Tambah Barang"
      >
        <div className="space-y-4">
          <Input
            label="Nama Barang"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            placeholder="Contoh: Kertas A4"
          />
          <Input
            label="Batas Stok Minimum"
            type="number"
            value={formThreshold}
            onChange={(e) => setFormThreshold(parseInt(e.target.value))}
          />
          <div>
            <label className="block text-sm font-medium mb-2">Foto Barang</label>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleImageSelect}
              className="w-full border rounded p-2"
            />
            {imagePreview && (
              <div className="mt-2 relative h-40 w-full">
                <Image
                  src={imagePreview}
                  alt="Preview"
                  fill
                  className="object-cover rounded"
                />
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleAdd}
              disabled={processing}
              className="flex-1 bg-blue-600 text-white"
            >
              {processing ? 'Menyimpan...' : 'Simpan'}
            </Button>
            <Button
              onClick={() => {
                setShowAddModal(false)
                resetForm()
              }}
              disabled={processing}
              className="flex-1 bg-gray-300"
            >
              Batal
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Item Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          resetForm()
        }}
        title="Edit Barang"
      >
        <div className="space-y-4">
          <Input
            label="Nama Barang"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
          />
          <Input
            label="Batas Stok Minimum"
            type="number"
            value={formThreshold}
            onChange={(e) => setFormThreshold(parseInt(e.target.value))}
          />
          <div>
            <label className="block text-sm font-medium mb-2">Foto Barang</label>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleImageSelect}
              className="w-full border rounded p-2"
            />
            {imagePreview && (
              <div className="mt-2 relative h-40 w-full">
                <Image
                  src={imagePreview}
                  alt="Preview"
                  fill
                  className="object-cover rounded"
                />
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleEdit}
              disabled={processing}
              className="flex-1 bg-blue-600 text-white"
            >
              {processing ? 'Menyimpan...' : 'Simpan'}
            </Button>
            <Button
              onClick={() => {
                setShowEditModal(false)
                resetForm()
              }}
              disabled={processing}
              className="flex-1 bg-gray-300"
            >
              Batal
            </Button>
          </div>
        </div>
      </Modal>

      {/* Image Modal */}
      <Modal
        isOpen={showImageModal}
        onClose={() => {
          setShowImageModal(false)
          resetForm()
        }}
        title={`Foto: ${selectedItem?.name || ''}`}
      >
        <div className="space-y-4">
          {selectedItem?.imageUrl ? (
            <div className="relative h-64 w-full">
              <Image
                src={selectedItem.imageUrl}
                alt={selectedItem.name}
                fill
                className="object-contain"
              />
            </div>
          ) : (
            <div className="h-64 bg-gray-200 flex items-center justify-center text-gray-500">
              Belum ada foto
            </div>
          )}
          <div>
            <label className="block text-sm font-medium mb-2">Upload Foto Baru</label>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleImageSelect}
              className="w-full border rounded p-2"
            />
            {imagePreview && (
              <div className="mt-2 relative h-40 w-full">
                <Image
                  src={imagePreview}
                  alt="Preview"
                  fill
                  className="object-cover rounded"
                />
              </div>
            )}
          </div>
          {formImage && (
            <Button
              onClick={async () => {
                if (!selectedItem) return
                setProcessing(true)
                try {
                  const formData = new FormData()
                  formData.append('file', formImage)
                  const res = await fetchWithAuth(`/api/admin/items/${selectedItem.id}/upload-image`, {
                    method: 'POST',
                    body: formData,
                  })
                  const json = await res.json()
                  if (json.success) {
                    setToast({ message: 'Foto berhasil diupload', type: 'success' })
                    setShowImageModal(false)
                    resetForm()
                    fetchItems()
                  } else {
                    setToast({ message: json.error || 'Gagal upload foto', type: 'error' })
                  }
                } catch (error) {
                  console.error('Upload error:', error)
                  setToast({ message: 'Terjadi kesalahan', type: 'error' })
                } finally {
                  setProcessing(false)
                }
              }}
              disabled={processing}
              className="w-full bg-blue-600 text-white"
            >
              {processing ? 'Uploading...' : 'Upload'}
            </Button>
          )}
          <Button
            onClick={() => {
              setShowImageModal(false)
              resetForm()
            }}
            className="w-full bg-gray-300"
          >
            Tutup
          </Button>
        </div>
      </Modal>

      {/* Restock Modal */}
      <Modal
        isOpen={restockModal.show}
        onClose={() => {
          setRestockModal({ show: false, itemId: null })
          resetForm()
        }}
        title="Restock Barang"
      >
        <div className="space-y-4">
          {selectedItem && (
            <>
              <div className="bg-gray-100 p-3 rounded">
                <p className="text-sm text-gray-600">Barang: {selectedItem.name}</p>
                <p className="text-sm text-gray-600">Stok Saat Ini: {selectedItem.stock}</p>
              </div>

              <Input
                label="Jumlah Restock"
                type="number"
                value={modalQuantity}
                onChange={(e) => setModalQuantity(parseInt(e.target.value))}
                placeholder="Berapa yang di-restock?"
              />

              <Input
                label="Catatan Restock"
                value={modalReason}
                onChange={(e) => setModalReason(e.target.value)}
                placeholder="Jelaskan sumber restock"
              />

              <div className="flex gap-2">
                <Button
                  onClick={handleRestock}
                  disabled={processing}
                  className="flex-1 bg-blue-600 text-white"
                >
                  {processing ? 'Memproses...' : 'Simpan'}
                </Button>
                <Button
                  onClick={() => {
                    setRestockModal({ show: false, itemId: null })
                    resetForm()
                  }}
                  disabled={processing}
                  className="flex-1 bg-gray-300"
                >
                  Batal
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* Reduction Modal */}
      <Modal
        isOpen={reductionModal.show}
        onClose={() => {
          setReductionModal({ show: false, itemId: null })
          resetForm()
        }}
        title="Pengurangan Barang"
      >
        <div className="space-y-4">
          {selectedItem && (
            <>
              <div className="bg-gray-100 p-3 rounded">
                <p className="text-sm text-gray-600">Barang: {selectedItem.name}</p>
                <p className="text-sm text-gray-600">Stok Saat Ini: {selectedItem.stock}</p>
              </div>

              <Input
                label="Jumlah Pengurangan"
                type="number"
                value={modalQuantity}
                onChange={(e) => setModalQuantity(parseInt(e.target.value))}
                placeholder="Berapa yang dikurangi?"
              />

              <Input
                label="Alasan Pengurangan"
                value={modalReason}
                onChange={(e) => setModalReason(e.target.value)}
                placeholder="Jelaskan alasan pengurangan (rusak, kadaluarsa, dll)"
              />

              <div className="flex gap-2">
                <Button
                  onClick={handleReduction}
                  disabled={processing}
                  className="flex-1 bg-red-600 text-white"
                >
                  {processing ? 'Memproses...' : 'Simpan'}
                </Button>
                <Button
                  onClick={() => {
                    setReductionModal({ show: false, itemId: null })
                    resetForm()
                  }}
                  disabled={processing}
                  className="flex-1 bg-gray-300"
                >
                  Batal
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* Adjustment Modal */}
      <Modal
        isOpen={adjustmentModal.show}
        onClose={() => {
          setAdjustmentModal({ show: false, itemId: null })
          resetForm()
        }}
        title="Adjustment Stok"
      >
        <div className="space-y-4">
          {selectedItem && (
            <>
              <div className="bg-gray-100 p-3 rounded">
                <p className="text-sm text-gray-600">Barang: {selectedItem.name}</p>
                <p className="text-sm text-gray-600">Stok Saat Ini: {selectedItem.stock}</p>
              </div>

              <Input
                label="Stok Baru (Sesuaikan ke)"
                type="number"
                value={modalQuantity}
                onChange={(e) => setModalQuantity(parseInt(e.target.value))}
                placeholder="Masukkan jumlah stok yang benar"
              />

              <Input
                label="Alasan Adjustment"
                value={modalReason}
                onChange={(e) => setModalReason(e.target.value)}
                placeholder="Jelaskan alasan koreksi"
              />

              <div className="flex gap-2">
                <Button
                  onClick={handleAdjustment}
                  disabled={processing}
                  className="flex-1 bg-yellow-600 text-white"
                >
                  {processing ? 'Memproses...' : 'Simpan'}
                </Button>
                <Button
                  onClick={() => {
                    setAdjustmentModal({ show: false, itemId: null })
                    resetForm()
                  }}
                  disabled={processing}
                  className="flex-1 bg-gray-300"
                >
                  Batal
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  )
}
