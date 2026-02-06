'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Button, Input, Select, Card, Toast, LoadingSpinner } from '@/components/ui'
import { MAX_ITEMS_PER_REQUEST } from '@/lib/constants'

interface FormField {
  id: string
  fieldName: string
  fieldType: string
  fieldLabel: string
  options?: { value: string; label: string }[]
  isRequired: boolean
  sortOrder: number
}

interface Division {
  id: string
  name: string
}

interface Item {
  id: string
  name: string
  stock: number
  imageUrl?: string | null
}

interface RequestItem {
  itemId: string
  qtyRequested: number
}

export default function RequestPage() {
  const [fields, setFields] = useState<FormField[]>([])
  const [divisions, setDivisions] = useState<Division[]>([])
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  // Form state
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [requestDate, setRequestDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [requestItems, setRequestItems] = useState<RequestItem[]>([
    { itemId: '', qtyRequested: 1 },
  ])
  const [trackingUrl, setTrackingUrl] = useState<string | null>(null)
  
  // Autocomplete state per item
  const [searchQueries, setSearchQueries] = useState<Record<number, string>>({})
  const [openDropdowns, setOpenDropdowns] = useState<Record<number, boolean>>({})

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Fetch form data dari API (selalu fresh karena API sudah force-dynamic)
  const fetchFormData = useCallback(async () => {
    try {
      const res = await fetch(`/api/public/form?t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        },
      })
      
      if (!res.ok) return
      
      const json = await res.json()
      
      if (json.success && json.data) {
        setDivisions(json.data.divisions.map((d: any) => ({ id: d.id, name: d.name })))
        setFields(json.data.fields || [])
        setItems(json.data.items || [])
      }
    } catch (error) {
      console.error('Fetch form data error:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // Initial fetch
    fetchFormData()

    // Polling setiap 10 detik untuk sinkronisasi data dari admin
    pollIntervalRef.current = setInterval(fetchFormData, 10000)

    // Cleanup
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
      }
    }
  }, [fetchFormData])

  function handleFieldChange(fieldName: string, value: string) {
    setFormData((prev) => ({ ...prev, [fieldName]: value }))
  }

  function handleItemChange(index: number, field: 'itemId' | 'qtyRequested', value: string | number) {
    setRequestItems((prev) => {
      const newItems = [...prev]
      newItems[index] = { ...newItems[index], [field]: value }
      return newItems
    })
  }

  function addItem() {
    if (requestItems.length >= MAX_ITEMS_PER_REQUEST) {
      setToast({ message: `Maksimal ${MAX_ITEMS_PER_REQUEST} barang per request`, type: 'error' })
      return
    }
    setRequestItems((prev) => [...prev, { itemId: '', qtyRequested: 1 }])
  }

  function removeItem(index: number) {
    if (requestItems.length === 1) return
    setRequestItems((prev) => prev.filter((_, i) => i !== index))
  }

  function getAvailableItems(currentIndex: number) {
    const selectedIds = requestItems
      .filter((_, i) => i !== currentIndex)
      .map((item) => item.itemId)
    let available = items.filter((item) => !selectedIds.includes(item.id))
    
    // Apply search filter for this specific item
    const query = (searchQueries[currentIndex] || '').toLowerCase()
    if (query.trim()) {
      available = available.filter((item) =>
        item.name.toLowerCase().includes(query)
      )
    }
    
    return available
  }

  function getItemStock(itemId: string) {
    const item = items.find((i) => i.id === itemId)
    return item?.stock || 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)

    try {
      // Validasi
      const requesterName = formData['requester_name']
      const divisionId = formData['division_id']

      if (!requesterName || !divisionId) {
        setToast({ message: 'Nama dan Divisi wajib diisi', type: 'error' })
        return
      }

      const validItems = requestItems.filter((item) => item.itemId && item.qtyRequested > 0)
      if (validItems.length === 0) {
        setToast({ message: 'Pilih minimal 1 barang', type: 'error' })
        return
      }

      // Submit
      const res = await fetch('/api/public/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requesterName,
          divisionId,
          requestDate,
          formData,
          items: validItems,
        }),
      })

      const json = await res.json()

      if (json.success) {
        setTrackingUrl(json.data.trackingUrl)
        setToast({ message: 'Request berhasil dikirim!', type: 'success' })
      } else {
        setToast({ message: json.error || 'Gagal mengirim request', type: 'error' })
      }
    } catch (error) {
      console.error('Submit error:', error)
      setToast({ message: 'Terjadi kesalahan', type: 'error' })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b sticky top-0 z-10">
          <div className="max-w-md mx-auto px-4 py-4">
            <div className="h-6 w-32 bg-gray-300 rounded animate-pulse"></div>
          </div>
        </header>

        {/* Form Skeleton */}
        <form className="max-w-md mx-auto px-4 py-6 space-y-6">
          {/* Date field skeleton */}
          <div className="space-y-2">
            <div className="h-5 w-24 bg-gray-300 rounded animate-pulse"></div>
            <div className="h-10 bg-gray-200 rounded-lg animate-pulse"></div>
          </div>

          {/* Dynamic fields skeleton */}
          {[1, 2].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-5 w-20 bg-gray-300 rounded animate-pulse"></div>
              <div className="h-10 bg-gray-200 rounded-lg animate-pulse"></div>
            </div>
          ))}

          {/* Items section skeleton */}
          <div className="pt-4 border-t space-y-4">
            <div className="h-5 w-24 bg-gray-300 rounded animate-pulse"></div>
            <div className="h-10 bg-gray-200 rounded-lg animate-pulse"></div>
            <div className="h-12 bg-gray-200 rounded-lg animate-pulse"></div>
          </div>

          {/* Submit button skeleton */}
          <div className="pt-4 pb-8">
            <div className="h-12 bg-gray-300 rounded-lg animate-pulse"></div>
          </div>
        </form>
      </div>
    )
  }

  // Success state
  if (trackingUrl) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-8">
        <div className="max-w-md mx-auto">
          <Card className="text-center">
            <div className="mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-gray-900 mb-2">Request Berhasil Dikirim!</h1>
              <p className="text-gray-600 text-sm">
                Simpan link di bawah ini untuk melacak status request Anda.
              </p>
            </div>

            <div className="bg-gray-100 rounded-lg p-4 mb-4">
              <p className="text-xs text-gray-500 mb-1">Link Tracking:</p>
              <p className="text-sm font-mono text-gray-900 break-all">
                {typeof window !== 'undefined' ? window.location.origin : ''}{trackingUrl}
              </p>
            </div>

            <div className="space-y-3">
              <Button
                className="w-full"
                onClick={() => {
                  navigator.clipboard.writeText(
                    `${window.location.origin}${trackingUrl}`
                  )
                  setToast({ message: 'Link berhasil disalin!', type: 'success' })
                }}
              >
                Salin Link
              </Button>
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => window.location.href = trackingUrl}
              >
                Lihat Status Request
              </Button>
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => {
                  setTrackingUrl(null)
                  setFormData({})
                  setRequestItems([{ itemId: '', qtyRequested: 1 }])
                }}
              >
                Buat Request Baru
              </Button>
            </div>
          </Card>
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-lg font-bold text-gray-900">Request Barang</h1>
          <button
            onClick={() => {
              console.log('[User] Manual refresh clicked')
              fetchFormData()
            }}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
            title="Refresh data"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </header>

      {/* Form */}
      <form onSubmit={handleSubmit} className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Requester Name - Always show */}
        <Input
          id="requester_name"
          label="Nama Lengkap"
          required
          value={formData['requester_name'] || ''}
          onChange={(e) => handleFieldChange('requester_name', e.target.value)}
          placeholder="Masukkan nama lengkap"
        />

        {/* Division - Always show */}
        <Select
          key={`division-${divisions.length}`}
          id="division_id"
          label="Divisi"
          required
          value={formData['division_id'] || ''}
          onChange={(e) => handleFieldChange('division_id', e.target.value)}
          placeholder="Pilih divisi"
          options={divisions.map((d) => ({ value: d.id, label: d.name }))}
        />

        {/* Dynamic Fields */}
        {fields.map((field) => {
          if (field.fieldName === 'requester_name') {
            return null
          }

          if (field.fieldName === 'division_id') {
            return null
          }

          if (field.fieldType === 'text') {
            return (
              <Input
                key={field.id}
                id={field.fieldName}
                label={field.fieldLabel}
                required={field.isRequired}
                value={formData[field.fieldName] || ''}
                onChange={(e) => handleFieldChange(field.fieldName, e.target.value)}
              />
            )
          }

          if (field.fieldType === 'number') {
            return (
              <Input
                key={field.id}
                id={field.fieldName}
                type="number"
                label={field.fieldLabel}
                required={field.isRequired}
                value={formData[field.fieldName] || ''}
                onChange={(e) => handleFieldChange(field.fieldName, e.target.value)}
              />
            )
          }

          if (field.fieldType === 'dropdown' && field.options) {
            return (
              <Select
                key={field.id}
                id={field.fieldName}
                label={field.fieldLabel}
                required={field.isRequired}
                value={formData[field.fieldName] || ''}
                onChange={(e) => handleFieldChange(field.fieldName, e.target.value)}
                placeholder={`Pilih ${field.fieldLabel.toLowerCase()}`}
                options={field.options}
              />
            )
          }

          return null
        })}

        {/* Request Date */}
        <Input
          id="requestDate"
          type="date"
          label="Tanggal Request"
          required
          value={requestDate}
          onChange={(e) => setRequestDate(e.target.value)}
          max={new Date().toISOString().split('T')[0]}
        />

        {/* Items Section */}
        <div className="pt-4 border-t">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Daftar Barang</h2>

          <div className="space-y-4">
            {requestItems.map((item, index) => {
              const availableItems = getAvailableItems(index)
              const maxQty = getItemStock(item.itemId)
              const selectedItem = items.find((i) => i.id === item.itemId)
              const isDropdownOpen = openDropdowns[index] || false

              return (
                <Card key={index} padding="sm" className="relative">
                  {requestItems.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-500"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}

                  <div className="space-y-3 pr-8">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Barang {index + 1} <span className="text-red-500">*</span>
                      </label>

                      {/* Autocomplete Search Input */}
                      <div className="relative">
                        <div className="flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-2 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500 bg-white">
                          <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                          <input
                            type="text"
                            placeholder="Cari barang..."
                            value={selectedItem ? selectedItem.name : searchQueries[index] || ''}
                            onChange={(e) => {
                              setSearchQueries((prev) => ({ ...prev, [index]: e.target.value }))
                              setOpenDropdowns((prev) => ({ ...prev, [index]: true }))
                            }}
                            onFocus={() => setOpenDropdowns((prev) => ({ ...prev, [index]: true }))}
                            onClick={() => setOpenDropdowns((prev) => ({ ...prev, [index]: true }))}
                            readOnly={!!selectedItem}
                            className="flex-1 outline-none bg-transparent text-sm"
                          />
                          {selectedItem && (
                            <button
                              type="button"
                              onClick={() => {
                                handleItemChange(index, 'itemId', '')
                                setSearchQueries((prev) => ({ ...prev, [index]: '' }))
                                setOpenDropdowns((prev) => ({ ...prev, [index]: true }))
                              }}
                              className="p-1 text-gray-400 hover:text-gray-600"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          )}
                        </div>

                        {/* Dropdown Results */}
                        {isDropdownOpen && !selectedItem && (
                          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                            {availableItems.length === 0 ? (
                              <div className="px-4 py-3 text-sm text-gray-500 text-center">
                                Barang tidak ditemukan
                              </div>
                            ) : (
                              availableItems.map((availItem) => (
                                <button
                                  key={availItem.id}
                                  type="button"
                                  onClick={() => {
                                    handleItemChange(index, 'itemId', availItem.id)
                                    setSearchQueries((prev) => ({ ...prev, [index]: '' }))
                                    setOpenDropdowns((prev) => ({ ...prev, [index]: false }))
                                  }}
                                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 transition border-b last:border-b-0"
                                >
                                  {/* Item Image */}
                                  <img
                                    src={availItem.imageUrl || '/images/placeholder.svg'}
                                    alt={availItem.name}
                                    className="w-10 h-10 object-cover rounded border border-gray-200 flex-shrink-0"
                                    onError={(e) => {
                                      e.currentTarget.src = '/images/placeholder.svg'
                                    }}
                                  />

                                  {/* Item Name */}
                                  <span className="flex-1 text-left text-sm font-medium text-gray-900">
                                    {availItem.name}
                                  </span>

                                  {/* Checkmark */}
                                  <svg className="w-5 h-5 text-blue-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" opacity="0" />
                                  </svg>
                                </button>
                              ))
                            )}
                          </div>
                        )}
                      </div>

                      {/* Close dropdown when clicking outside */}
                      {isDropdownOpen && (
                        <div
                          className="fixed inset-0 z-5"
                          onClick={() => setOpenDropdowns((prev) => ({ ...prev, [index]: false }))}
                        />
                      )}
                    </div>

                    {/* Selected Item & Quantity */}
                    {selectedItem && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <div className="flex items-center gap-3 mb-3">
                          <img
                            src={selectedItem.imageUrl || '/images/placeholder.svg'}
                            alt={selectedItem.name}
                            className="w-10 h-10 object-cover rounded border border-gray-200"
                            onError={(e) => {
                              e.currentTarget.src = '/images/placeholder.svg'
                            }}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{selectedItem.name}</p>
                            <p className="text-xs text-gray-500">Terpilih</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <label className="text-sm font-medium text-gray-600 flex-shrink-0">Jumlah:</label>
                          <input
                            type="number"
                            min="1"
                            max={maxQty}
                            value={item.qtyRequested || ''}
                            onChange={(e) => {
                              const val = e.target.value
                              if (val === '') {
                                handleItemChange(index, 'qtyRequested', 0)
                              } else {
                                const num = parseInt(val)
                                if (!isNaN(num) && num > 0 && num <= maxQty) {
                                  handleItemChange(index, 'qtyRequested', num)
                                }
                              }
                            }}
                            onBlur={(e) => {
                              if (e.target.value === '' || parseInt(e.target.value) === 0) {
                                handleItemChange(index, 'qtyRequested', 1)
                              }
                            }}
                            className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-center text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              )
            })}
          </div>

          {requestItems.length < MAX_ITEMS_PER_REQUEST && (
            <Button
              type="button"
              variant="secondary"
              className="w-full mt-4"
              onClick={addItem}
            >
              + Tambah Barang
            </Button>
          )}
        </div>

        {/* Submit */}
        <div className="pt-4 pb-8">
          <Button
            type="submit"
            size="lg"
            className="w-full"
            isLoading={submitting}
            disabled={submitting}
          >
            Kirim Request
          </Button>
        </div>
      </form>

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
