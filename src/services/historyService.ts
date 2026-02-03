import { prisma } from '@/lib/prisma'
import { HistoryFilter, StockHistoryData } from '@/types'
import * as XLSX from 'xlsx'

// ==================== GET HISTORY ====================
export async function getHistory(filter?: HistoryFilter) {
  const where: Record<string, unknown> = {}

  if (filter?.startDate || filter?.endDate) {
    where.createdAt = {}
    if (filter.startDate) {
      (where.createdAt as Record<string, Date>).gte = new Date(filter.startDate)
    }
    if (filter.endDate) {
      (where.createdAt as Record<string, Date>).lte = new Date(filter.endDate)
    }
  }

  if (filter?.itemId) {
    where.itemId = filter.itemId
  }

  const page = filter?.page || 1
  const limit = filter?.limit || 20
  const skip = (page - 1) * limit

  const [history, total] = await Promise.all([
    prisma.stockHistory.findMany({
      where,
      include: {
        item: true,
        request: true,
        admin: true,
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.stockHistory.count({ where }),
  ])

  const data: StockHistoryData[] = history.map((h) => ({
    id: h.id,
    itemId: h.itemId,
    itemName: h.item.name,
    changeType: h.changeType,
    qtyChange: h.qtyChange,
    notes: h.notes,
    requestNumber: h.request?.requestNumber || null,
    adminName: h.admin.name,
    createdAt: h.createdAt,
  }))

  return {
    data,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  }
}

// ==================== GET REQUEST HISTORY ====================
export async function getRequestHistory(filter?: HistoryFilter) {
  const where: Record<string, unknown> = {}

  if (filter?.status) {
    where.status = filter.status
  }

  if (filter?.startDate || filter?.endDate) {
    where.requestDate = {}
    if (filter.startDate) {
      (where.requestDate as Record<string, Date>).gte = new Date(filter.startDate)
    }
    if (filter.endDate) {
      (where.requestDate as Record<string, Date>).lte = new Date(filter.endDate)
    }
  }

  if (filter?.itemId) {
    where.requestItems = {
      some: { itemId: filter.itemId },
    }
  }

  const page = filter?.page || 1
  const limit = filter?.limit || 20
  const skip = (page - 1) * limit

  const [requests, total] = await Promise.all([
    prisma.request.findMany({
      where,
      include: {
        division: true,
        approvedBy: true,
        requestItems: {
          include: { item: true },
        },
      },
      orderBy: { requestDate: 'desc' },
      skip,
      take: limit,
    }),
    prisma.request.count({ where }),
  ])

  return {
    data: requests.map((r) => ({
      id: r.id,
      requestNumber: r.requestNumber,
      requesterName: r.requesterName,
      divisionName: r.division.name,
      status: r.status,
      rejectionReason: r.rejectionReason,
      requestDate: r.requestDate,
      approvalDate: r.approvalDate,
      approvedByName: r.approvedBy?.name || null,
      items: r.requestItems.map((ri) => ({
        itemName: ri.item.name,
        qtyRequested: ri.qtyRequested,
        qtyApproved: ri.qtyApproved,
      })),
    })),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  }
}

// ==================== EXPORT TO EXCEL ====================
export async function exportToExcel(filter?: HistoryFilter) {
  const { data } = await getRequestHistory({ ...filter, limit: 10000 })

  const rows = data.flatMap((r) =>
    r.items.map((item) => ({
      'No Request': r.requestNumber,
      'Nama Requester': r.requesterName,
      Divisi: r.divisionName,
      'Nama Barang': item.itemName,
      'Jumlah Diminta': item.qtyRequested,
      'Jumlah Disetujui': item.qtyApproved || '-',
      Status: r.status,
      'Alasan Penolakan': r.rejectionReason || '-',
      'Tanggal Request': new Date(r.requestDate).toLocaleDateString('id-ID'),
      'Tanggal Approval': r.approvalDate
        ? new Date(r.approvalDate).toLocaleDateString('id-ID')
        : '-',
      'Diproses Oleh': r.approvedByName || '-',
    }))
  )

  const worksheet = XLSX.utils.json_to_sheet(rows)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'History Request')

  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
  return buffer
}

// ==================== EXPORT TO CSV ====================
export async function exportToCSV(filter?: HistoryFilter) {
  const { data } = await getRequestHistory({ ...filter, limit: 10000 })

  const headers = [
    'No Request',
    'Nama Requester',
    'Divisi',
    'Nama Barang',
    'Jumlah Diminta',
    'Jumlah Disetujui',
    'Status',
    'Alasan Penolakan',
    'Tanggal Request',
    'Tanggal Approval',
    'Diproses Oleh',
  ]

  const rows = data.flatMap((r) =>
    r.items.map((item) => [
      r.requestNumber,
      r.requesterName,
      r.divisionName,
      item.itemName,
      item.qtyRequested,
      item.qtyApproved || '-',
      r.status,
      r.rejectionReason || '-',
      new Date(r.requestDate).toLocaleDateString('id-ID'),
      r.approvalDate
        ? new Date(r.approvalDate).toLocaleDateString('id-ID')
        : '-',
      r.approvedByName || '-',
    ])
  )

  const csvContent = [
    headers.join(','),
    ...rows.map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    ),
  ].join('\n')

  return csvContent
}

// ==================== EXPORT STOCK HISTORY (RESTOCK + REDUCTION) ====================
export async function getRestockReductionHistory(filter?: HistoryFilter) {
  const where: Record<string, unknown> = {
    OR: [
      { action: 'restock' },
      { action: 'reduction' },
      { changeType: 'RESTOCK' },
      { changeType: 'REDUCTION' },
    ],
  }

  if (filter?.startDate || filter?.endDate) {
    where.createdAt = {}
    if (filter.startDate) {
      (where.createdAt as Record<string, Date>).gte = new Date(filter.startDate)
    }
    if (filter.endDate) {
      (where.createdAt as Record<string, Date>).lte = new Date(filter.endDate)
    }
  }

  if (filter?.itemId) {
    where.itemId = filter.itemId
  }

  const history = await prisma.stockHistory.findMany({
    where,
    include: {
      item: true,
      admin: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 10000,
  })

  return history.map((h) => ({
    id: h.id,
    itemName: h.item.name,
    action: h.action || h.changeType,
    quantity: h.qtyChange,
    reason: h.notes,
    admin: h.admin.name,
    date: h.createdAt,
  }))
}

export async function exportRestockReductionToExcel(filter?: HistoryFilter) {
  const data = await getRestockReductionHistory(filter)

  const rows = data.map((item) => ({
    'Nama Barang': item.itemName,
    Tipe: item.action === 'restock' ? 'Restock' : 'Reduction',
    Jumlah: Math.abs(item.quantity),
    Catatan: item.reason || '-',
    'Diproses Oleh': item.admin,
    Tanggal: new Date(item.date).toLocaleDateString('id-ID'),
    Waktu: new Date(item.date).toLocaleTimeString('id-ID'),
  }))

  const worksheet = XLSX.utils.json_to_sheet(rows)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Restock & Reduction')

  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
  return buffer
}

export async function exportRestockReductionToCSV(filter?: HistoryFilter) {
  const data = await getRestockReductionHistory(filter)

  const headers = ['Nama Barang', 'Tipe', 'Jumlah', 'Catatan', 'Diproses Oleh', 'Tanggal', 'Waktu']

  const rows = data.map((item) => [
    item.itemName,
    item.action === 'restock' ? 'Restock' : 'Reduction',
    Math.abs(item.quantity),
    item.reason || '-',
    item.admin,
    new Date(item.date).toLocaleDateString('id-ID'),
    new Date(item.date).toLocaleTimeString('id-ID'),
  ])

  const csvContent = [
    headers.join(','),
    ...rows.map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    ),
  ].join('\n')

  return csvContent
}

// ==================== EXPORT STOCK ADJUSTMENT ====================
export async function getStockAdjustmentHistory(filter?: HistoryFilter) {
  const where: Record<string, unknown> = {
    OR: [
      { action: 'adjustment' },
      { changeType: 'ADJUSTMENT' },
    ],
  }

  if (filter?.startDate || filter?.endDate) {
    where.createdAt = {}
    if (filter.startDate) {
      (where.createdAt as Record<string, Date>).gte = new Date(filter.startDate)
    }
    if (filter.endDate) {
      (where.createdAt as Record<string, Date>).lte = new Date(filter.endDate)
    }
  }

  if (filter?.itemId) {
    where.itemId = filter.itemId
  }

  const history = await prisma.stockHistory.findMany({
    where,
    include: {
      item: true,
      admin: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 10000,
  })

  return history.map((h) => ({
    id: h.id,
    itemName: h.item.name,
    newStock: h.qtyChange,
    reason: h.notes,
    admin: h.admin.name,
    date: h.createdAt,
  }))
}

export async function exportStockAdjustmentToExcel(filter?: HistoryFilter) {
  const data = await getStockAdjustmentHistory(filter)

  const rows = data.map((item) => ({
    'Nama Barang': item.itemName,
    'Stok Baru': item.newStock,
    Alasan: item.reason || '-',
    'Diproses Oleh': item.admin,
    Tanggal: new Date(item.date).toLocaleDateString('id-ID'),
    Waktu: new Date(item.date).toLocaleTimeString('id-ID'),
  }))

  const worksheet = XLSX.utils.json_to_sheet(rows)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Stock Adjustment')

  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
  return buffer
}

export async function exportStockAdjustmentToCSV(filter?: HistoryFilter) {
  const data = await getStockAdjustmentHistory(filter)

  const headers = ['Nama Barang', 'Stok Baru', 'Alasan', 'Diproses Oleh', 'Tanggal', 'Waktu']

  const rows = data.map((item) => [
    item.itemName,
    item.newStock,
    item.reason || '-',
    item.admin,
    new Date(item.date).toLocaleDateString('id-ID'),
    new Date(item.date).toLocaleTimeString('id-ID'),
  ])

  const csvContent = [
    headers.join(','),
    ...rows.map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    ),
  ].join('\n')

  return csvContent
}
