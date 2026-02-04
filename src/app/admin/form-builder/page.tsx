'use client'

import { useState, useEffect } from 'react'
import { Card, Button, Input, Select, Modal, LoadingSpinner, Toast } from '@/components/ui'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableEmpty } from '@/components/ui'
import { fetchWithAuth } from '@/lib/fetchClient'

interface FormField {
  id: string
  fieldName: string
  fieldLabel: string
  fieldType: 'text' | 'number' | 'dropdown'
  isRequired: boolean
  isActive: boolean
  sortOrder: number
  options?: { value: string; label: string }[]
}

const FIELD_TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'dropdown', label: 'Dropdown' },
]

export default function FormBuilderPage() {
  const [fields, setFields] = useState<FormField[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedField, setSelectedField] = useState<FormField | null>(null)
  const [processing, setProcessing] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  // Form state
  const [formFieldName, setFormFieldName] = useState('')
  const [formFieldLabel, setFormFieldLabel] = useState('')
  const [formFieldType, setFormFieldType] = useState<string>('text')
  const [formRequired, setFormRequired] = useState(true)
  const [formActive, setFormActive] = useState(true)
  const [formSortOrder, setFormSortOrder] = useState(1)
  const [formOptions, setFormOptions] = useState<string>('')  // JSON string for dropdown options

  useEffect(() => {
    fetchFields()
  }, [])

  async function fetchFields() {
    try {
      const res = await fetchWithAuth('/api/admin/form-fields')
      const json = await res.json()
      if (json.success) {
        setFields(json.data)
      }
    } catch (error) {
      console.error('Fetch fields error:', error)
    } finally {
      setLoading(false)
    }
  }

  function resetForm() {
    setFormFieldName('')
    setFormFieldLabel('')
    setFormFieldType('text')
    setFormRequired(true)
    setFormActive(true)
    setFormSortOrder(fields.length + 1)
    setFormOptions('')
    setSelectedField(null)
  }

  async function handleAdd() {
    if (!formFieldName.trim() || !formFieldLabel.trim()) {
      setToast({ message: 'Nama dan label wajib diisi', type: 'error' })
      return
    }

    // Validate name format (lowercase, no spaces)
    if (!/^[a-z_][a-z0-9_]*$/.test(formFieldName)) {
      setToast({ message: 'Nama harus lowercase tanpa spasi (gunakan underscore)', type: 'error' })
      return
    }

    setProcessing(true)
    try {
      const payload: Record<string, unknown> = {
        fieldName: formFieldName,
        fieldLabel: formFieldLabel,
        fieldType: formFieldType,
        isRequired: formRequired,
        sortOrder: formSortOrder,
      }

      if (formFieldType === 'dropdown' && formOptions.trim()) {
        try {
          payload.options = JSON.parse(formOptions)
        } catch {
          setToast({ message: 'Format JSON options tidak valid', type: 'error' })
          setProcessing(false)
          return
        }
      }

      const res = await fetchWithAuth('/api/admin/form-fields', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const json = await res.json()

      if (json.success) {
        setToast({ message: 'Field berhasil ditambahkan', type: 'success' })
        setShowAddModal(false)
        resetForm()
        fetchFields()
      } else {
        setToast({ message: json.error || 'Gagal menambahkan field', type: 'error' })
      }
    } catch (error) {
      console.error('Add field error:', error)
      setToast({ message: 'Terjadi kesalahan', type: 'error' })
    } finally {
      setProcessing(false)
    }
  }

  async function handleEdit() {
    if (!selectedField || !formFieldLabel.trim()) return

    setProcessing(true)
    try {
      const payload: Record<string, unknown> = {
        fieldLabel: formFieldLabel,
        fieldType: formFieldType,
        isRequired: formRequired,
        isActive: formActive,
        sortOrder: formSortOrder,
      }

      if (formFieldType === 'dropdown' && formOptions.trim()) {
        try {
          payload.options = JSON.parse(formOptions)
        } catch {
          setToast({ message: 'Format JSON options tidak valid', type: 'error' })
          setProcessing(false)
          return
        }
      }

      const res = await fetchWithAuth(`/api/admin/form-fields/${selectedField.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const json = await res.json()

      if (json.success) {
        setToast({ message: 'Field berhasil diperbarui', type: 'success' })
        setShowEditModal(false)
        resetForm()
        fetchFields()
      } else {
        setToast({ message: json.error || 'Gagal memperbarui field', type: 'error' })
      }
    } catch (error) {
      console.error('Edit field error:', error)
      setToast({ message: 'Terjadi kesalahan', type: 'error' })
    } finally {
      setProcessing(false)
    }
  }

  async function handleDelete(field: FormField) {
    if (!confirm(`Apakah Anda yakin ingin menghapus field "${field.fieldLabel}"?`)) return

    try {
      const res = await fetchWithAuth(`/api/admin/form-fields/${field.id}`, {
        method: 'DELETE',
      })

      const json = await res.json()

      if (json.success) {
        setToast({ message: 'Field berhasil dihapus', type: 'success' })
        fetchFields()
      } else {
        setToast({ message: json.error || 'Gagal menghapus field', type: 'error' })
      }
    } catch (error) {
      console.error('Delete field error:', error)
      setToast({ message: 'Terjadi kesalahan', type: 'error' })
    }
  }

  function openAddModal() {
    resetForm()
    setFormSortOrder(fields.length + 1)
    setShowAddModal(true)
  }

  function openEditModal(field: FormField) {
    setSelectedField(field)
    setFormFieldName(field.fieldName)
    setFormFieldLabel(field.fieldLabel)
    setFormFieldType(field.fieldType)
    setFormRequired(field.isRequired)
    setFormActive(field.isActive)
    setFormSortOrder(field.sortOrder)
    setFormOptions(field.options ? JSON.stringify(field.options) : '')
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
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Form Builder</h1>
          <p className="text-sm text-gray-600 mt-1">
            Kelola field tambahan pada form request barang
          </p>
        </div>
        <Button onClick={openAddModal}>+ Tambah Field</Button>
      </div>

      {/* Default Fields Info */}
      <Card>
        <CardHeader title="Field Default (Tidak dapat diubah)" />
        <div className="px-4 pb-4">
          <div className="text-sm text-gray-600 space-y-1">
            <p>• <span className="font-medium">Nama Pemohon</span> - Text (Wajib)</p>
            <p>• <span className="font-medium">Divisi</span> - Dropdown (Wajib)</p>
            <p>• <span className="font-medium">Pilihan Barang</span> - Multi-select dengan Qty (Wajib, min 1 barang)</p>
          </div>
        </div>
      </Card>

      {/* Custom Fields */}
      <Card padding="none">
        <div className="px-4 py-3 border-b border-gray-200">
          <h3 className="font-medium text-gray-900">Field Tambahan</h3>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead>Label</TableHead>
              <TableHead className="hidden sm:table-cell">Nama Field</TableHead>
              <TableHead>Tipe</TableHead>
              <TableHead className="text-center hidden sm:table-cell">Wajib</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {fields.length === 0 ? (
              <TableEmpty message="Tidak ada field tambahan" />
            ) : (
              fields.map((field) => (
                <TableRow key={field.id}>
                  <TableCell className="text-gray-500">{field.sortOrder}</TableCell>
                  <TableCell className="font-medium text-gray-900">
                    {field.fieldLabel}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-gray-500 font-mono text-sm">
                    {field.fieldName}
                  </TableCell>
                  <TableCell>
                    <span className="capitalize">{field.fieldType}</span>
                  </TableCell>
                  <TableCell className="text-center hidden sm:table-cell">
                    {field.isRequired ? (
                      <span className="text-green-600">Ya</span>
                    ) : (
                      <span className="text-gray-400">Tidak</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <span
                      className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                        field.isActive
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {field.isActive ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openEditModal(field)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => handleDelete(field)}
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
        title="Tambah Field"
      >
        <div className="space-y-4">
          <Input
            label="Nama Field (untuk sistem)"
            required
            value={formFieldName}
            onChange={(e) => setFormFieldName(e.target.value.toLowerCase().replace(/\s/g, '_'))}
            placeholder="contoh: no_telepon"
          />
          <Input
            label="Label (ditampilkan ke user)"
            required
            value={formFieldLabel}
            onChange={(e) => setFormFieldLabel(e.target.value)}
            placeholder="contoh: No. Telepon"
          />
          <Select
            label="Tipe Input"
            value={formFieldType}
            onChange={(e) => setFormFieldType(e.target.value)}
            options={FIELD_TYPES}
          />
          {formFieldType === 'dropdown' && (
            <Input
              label="Options (JSON)"
              placeholder='[{"value":"opt1","label":"Option 1"}]'
              value={formOptions}
              onChange={(e) => setFormOptions(e.target.value)}
            />
          )}
          <Input
            label="Urutan"
            type="number"
            min={1}
            value={formSortOrder}
            onChange={(e) => setFormSortOrder(parseInt(e.target.value) || 1)}
          />
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="addRequired"
              checked={formRequired}
              onChange={(e) => setFormRequired(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="addRequired" className="text-sm text-gray-700">
              Field wajib diisi
            </label>
          </div>
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
        title="Edit Field"
      >
        <div className="space-y-4">
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              Nama Field: <span className="font-mono font-medium">{selectedField?.fieldName}</span>
            </p>
          </div>
          <Input
            label="Label"
            required
            value={formFieldLabel}
            onChange={(e) => setFormFieldLabel(e.target.value)}
          />
          <Select
            label="Tipe Input"
            value={formFieldType}
            onChange={(e) => setFormFieldType(e.target.value)}
            options={FIELD_TYPES}
          />
          {formFieldType === 'dropdown' && (
            <Input
              label="Options (JSON)"
              placeholder='[{"value":"opt1","label":"Option 1"}]'
              value={formOptions}
              onChange={(e) => setFormOptions(e.target.value)}
            />
          )}
          <Input
            label="Urutan"
            type="number"
            min={1}
            value={formSortOrder}
            onChange={(e) => setFormSortOrder(parseInt(e.target.value) || 1)}
          />
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="editRequired"
                checked={formRequired}
                onChange={(e) => setFormRequired(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="editRequired" className="text-sm text-gray-700">
                Field wajib diisi
              </label>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="editActive"
                checked={formActive}
                onChange={(e) => setFormActive(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="editActive" className="text-sm text-gray-700">
                Field aktif (ditampilkan di form)
              </label>
            </div>
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

function CardHeader({ title }: { title: string }) {
  return (
    <div className="px-4 py-3 border-b border-gray-200">
      <h3 className="font-medium text-gray-900">{title}</h3>
    </div>
  )
}
