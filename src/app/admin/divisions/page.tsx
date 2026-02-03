'use client'

import { useState, useEffect } from 'react'
import { Card, Button, Input, Modal, LoadingSpinner, Toast } from '@/components/ui'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableEmpty } from '@/components/ui'

interface Division {
  id: string
  name: string
  isActive: boolean
  _count?: {
    requests: number
  }
}

export default function DivisionsPage() {
  const [divisions, setDivisions] = useState<Division[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedDivision, setSelectedDivision] = useState<Division | null>(null)
  const [processing, setProcessing] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const [formName, setFormName] = useState('')
  const [formActive, setFormActive] = useState(true)

  useEffect(() => {
    fetchDivisions()
  }, [])

  async function fetchDivisions() {
    try {
      const res = await fetch('/api/admin/divisions')
      const json = await res.json()
      if (json.success) {
        setDivisions(json.data)
      }
    } catch (error) {
      console.error('Fetch divisions error:', error)
    } finally {
      setLoading(false)
    }
  }

  function resetForm() {
    setFormName('')
    setFormActive(true)
    setSelectedDivision(null)
  }

  async function handleAdd() {
    if (!formName.trim()) {
      setToast({ message: 'Nama divisi wajib diisi', type: 'error' })
      return
    }

    setProcessing(true)
    try {
      const res = await fetch('/api/admin/divisions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: formName }),
      })

      const json = await res.json()

      if (json.success) {
        setToast({ message: 'Divisi berhasil ditambahkan', type: 'success' })
        setShowAddModal(false)
        resetForm()
        fetchDivisions()
      } else {
        setToast({ message: json.error || 'Gagal menambahkan divisi', type: 'error' })
      }
    } catch (error) {
      console.error('Add division error:', error)
      setToast({ message: 'Terjadi kesalahan', type: 'error' })
    } finally {
      setProcessing(false)
    }
  }

  async function handleEdit() {
    if (!selectedDivision || !formName.trim()) return

    setProcessing(true)
    try {
      const res = await fetch(`/api/admin/divisions/${selectedDivision.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName,
          isActive: formActive,
        }),
      })

      const json = await res.json()

      if (json.success) {
        setToast({ message: 'Divisi berhasil diperbarui', type: 'success' })
        setShowEditModal(false)
        resetForm()
        fetchDivisions()
      } else {
        setToast({ message: json.error || 'Gagal memperbarui divisi', type: 'error' })
      }
    } catch (error) {
      console.error('Edit division error:', error)
      setToast({ message: 'Terjadi kesalahan', type: 'error' })
    } finally {
      setProcessing(false)
    }
  }

  async function handleDelete(division: Division) {
    if (!confirm(`Apakah Anda yakin ingin menghapus divisi "${division.name}"?`)) return

    try {
      const res = await fetch(`/api/admin/divisions/${division.id}`, {
        method: 'DELETE',
      })

      const json = await res.json()

      if (json.success) {
        setToast({ message: 'Divisi berhasil dihapus', type: 'success' })
        fetchDivisions()
      } else {
        setToast({ message: json.error || 'Gagal menghapus divisi', type: 'error' })
      }
    } catch (error) {
      console.error('Delete division error:', error)
      setToast({ message: 'Terjadi kesalahan', type: 'error' })
    }
  }

  function openEditModal(division: Division) {
    setSelectedDivision(division)
    setFormName(division.name)
    setFormActive(division.isActive)
    setShowEditModal(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Divisi</h1>
        <Button onClick={() => setShowAddModal(true)}>+ Tambah Divisi</Button>
      </div>

      <Card padding="none">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama Divisi</TableHead>
              <TableHead className="text-center hidden sm:table-cell">Jumlah Request</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {divisions.length === 0 ? (
              <TableEmpty message="Tidak ada divisi" />
            ) : (
              divisions.map((division) => (
                <TableRow key={division.id}>
                  <TableCell className="font-medium text-gray-900">
                    {division.name}
                  </TableCell>
                  <TableCell className="text-center hidden sm:table-cell">
                    {division._count?.requests || 0}
                  </TableCell>
                  <TableCell className="text-center">
                    <span
                      className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                        division.isActive
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {division.isActive ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openEditModal(division)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => handleDelete(division)}
                      >
                        Hapus
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Add Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false)
          resetForm()
        }}
        title="Tambah Divisi"
      >
        <div className="space-y-4">
          <Input
            label="Nama Divisi"
            required
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            placeholder="Contoh: IT Department"
          />
          <div className="flex gap-3 pt-4">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => {
                setShowAddModal(false)
                resetForm()
              }}
            >
              Batal
            </Button>
            <Button className="flex-1" onClick={handleAdd} isLoading={processing}>
              Simpan
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          resetForm()
        }}
        title="Edit Divisi"
      >
        <div className="space-y-4">
          <Input
            label="Nama Divisi"
            required
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
          />
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isActive"
              checked={formActive}
              onChange={(e) => setFormActive(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="isActive" className="text-sm text-gray-700">
              Divisi aktif (dapat dipilih saat request)
            </label>
          </div>
          <div className="flex gap-3 pt-4">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => {
                setShowEditModal(false)
                resetForm()
              }}
            >
              Batal
            </Button>
            <Button className="flex-1" onClick={handleEdit} isLoading={processing}>
              Simpan
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
