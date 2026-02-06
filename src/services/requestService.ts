import { prisma } from '@/lib/prisma'
import { v4 as uuidv4 } from 'uuid'
import { RequestStatus } from '@prisma/client'
import {
  CreateRequestInput,
  RequestData,
  ApproveRequestInput,
  HistoryFilter,
} from '@/types'
import { generateRequestNumber } from '@/lib/utils'
import { MAX_ITEMS_PER_REQUEST, NOTIFICATION_TYPES, STOCK_CHANGE_TYPES } from '@/lib/constants'
import { getSettings } from '@/services/settingService'

// ==================== GET FORM DATA FOR PUBLIC ====================
export async function getPublicFormData() {
  try {
    console.log('[Service] getPublicFormData - START')
    const [fields, divisions, items, settings] = await Promise.all([
      prisma.formField.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
      }),
      prisma.division.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' },
      }),
      prisma.item.findMany({
        where: { isActive: true, stock: { gt: 0 } },
        orderBy: { name: 'asc' },
      }),
      getSettings(['form_title', 'form_description']),
    ])

    console.log(`[Service] getPublicFormData - RESULT: ${divisions.length} divisions, ${items.length} items`)
    console.log(`[Service] Divisions: ${divisions.map(d => d.name).join(', ')}`)

    return {
      fields,
      divisions,
      items,
      formTitle: settings.form_title || 'Request Barang',
      formDescription: settings.form_description || '',
    }
  } catch (error) {
    console.error('[Service] getPublicFormData - ERROR:', error)
    throw error
  }
}

// ==================== CREATE REQUEST ====================
export async function createRequest(input: CreateRequestInput) {
  // Validasi jumlah item
  if (input.items.length === 0) {
    throw new Error('Minimal 1 barang harus dipilih')
  }
  if (input.items.length > MAX_ITEMS_PER_REQUEST) {
    throw new Error(`Maksimal ${MAX_ITEMS_PER_REQUEST} barang per request`)
  }

  // Validasi duplikat item
  const itemIds = input.items.map((i) => i.itemId)
  const uniqueItemIds = new Set(itemIds)
  if (itemIds.length !== uniqueItemIds.size) {
    throw new Error('Tidak boleh memilih barang yang sama lebih dari sekali')
  }

  // Validasi stok
  const itemsData = await prisma.item.findMany({
    where: { id: { in: itemIds } },
  })

  for (const requestItem of input.items) {
    const item = itemsData.find((i) => i.id === requestItem.itemId)
    if (!item) {
      throw new Error('Barang tidak ditemukan')
    }
    if (item.stock === 0) {
      throw new Error(`Stok ${item.name} sudah habis`)
    }
    if (requestItem.qtyRequested > item.stock) {
      throw new Error(
        `Jumlah ${item.name} melebihi stok tersedia (${item.stock})`
      )
    }
    if (requestItem.qtyRequested <= 0) {
      throw new Error('Jumlah barang harus lebih dari 0')
    }
  }

  // Validasi divisi
  const division = await prisma.division.findUnique({
    where: { id: input.divisionId },
  })
  if (!division || !division.isActive) {
    throw new Error('Divisi tidak valid')
  }

  // Generate nomor request
  const currentYear = new Date().getFullYear()
  const counter = await prisma.requestCounter.upsert({
    where: { year: currentYear },
    update: { lastNumber: { increment: 1 } },
    create: { year: currentYear, lastNumber: 1 },
  })

  const requestNumber = generateRequestNumber(currentYear, counter.lastNumber)
  const trackingToken = uuidv4()

  // Buat request
  const request = await prisma.request.create({
    data: {
      requestNumber,
      trackingToken,
      requesterName: input.requesterName,
      divisionId: input.divisionId,
      formData: input.formData as any,
      requestDate: new Date(input.requestDate),
      requestItems: {
        create: input.items.map((item) => ({
          itemId: item.itemId,
          qtyRequested: item.qtyRequested,
        })),
      },
    },
    include: {
      division: true,
      requestItems: {
        include: { item: true },
      },
    },
  })

  // Buat notifikasi untuk semua admin
  const admins = await prisma.admin.findMany()
  await prisma.notification.createMany({
    data: admins.map((admin) => ({
      type: NOTIFICATION_TYPES.NEW_REQUEST,
      title: 'Request Baru',
      message: `Request ${requestNumber} dari ${input.requesterName}`,
      requestId: request.id,
      adminId: admin.id,
    })),
  })

  return {
    ...request,
    trackingUrl: `/track/${trackingToken}`,
  }
}

// ==================== GET REQUEST BY TRACKING TOKEN ====================
export async function getRequestByToken(token: string): Promise<RequestData | null> {
  const request = await prisma.request.findUnique({
    where: { trackingToken: token },
    include: {
      division: true,
      approvedBy: true,
      requestItems: {
        include: { item: true },
      },
    },
  })

  if (!request) return null

  return {
    id: request.id,
    requestNumber: request.requestNumber,
    trackingToken: request.trackingToken,
    requesterName: request.requesterName,
    divisionId: request.divisionId,
    divisionName: request.division.name,
    status: request.status,
    rejectionReason: request.rejectionReason,
    formData: request.formData as Record<string, unknown>,
    requestDate: request.requestDate,
    approvalDate: request.approvalDate,
    approvedByName: request.approvedBy?.name || null,
    items: request.requestItems.map((ri) => ({
      id: ri.id,
      itemId: ri.itemId,
      itemName: ri.item.name,
      qtyRequested: ri.qtyRequested,
      qtyApproved: ri.qtyApproved,
    })),
  }
}

// ==================== UPDATE REQUEST (ONLY PENDING) ====================
export async function updateRequest(
  token: string,
  input: Partial<CreateRequestInput>
) {
  const request = await prisma.request.findUnique({
    where: { trackingToken: token },
  })

  if (!request) {
    throw new Error('Request tidak ditemukan')
  }

  if (request.status !== RequestStatus.PENDING) {
    throw new Error('Hanya request dengan status Pending yang bisa diubah')
  }

  // Validasi item jika ada perubahan
  if (input.items) {
    if (input.items.length === 0) {
      throw new Error('Minimal 1 barang harus dipilih')
    }
    if (input.items.length > MAX_ITEMS_PER_REQUEST) {
      throw new Error(`Maksimal ${MAX_ITEMS_PER_REQUEST} barang per request`)
    }

    const itemIds = input.items.map((i) => i.itemId)
    const itemsData = await prisma.item.findMany({
      where: { id: { in: itemIds } },
    })

    for (const requestItem of input.items) {
      const item = itemsData.find((i) => i.id === requestItem.itemId)
      if (!item) {
        throw new Error('Barang tidak ditemukan')
      }
      if (requestItem.qtyRequested > item.stock) {
        throw new Error(
          `Jumlah ${item.name} melebihi stok tersedia (${item.stock})`
        )
      }
    }

    // Update request items
    await prisma.requestItem.deleteMany({
      where: { requestId: request.id },
    })

    await prisma.requestItem.createMany({
      data: input.items.map((item) => ({
        requestId: request.id,
        itemId: item.itemId,
        qtyRequested: item.qtyRequested,
      })),
    })
  }

  // Update request data
  const updated = await prisma.request.update({
    where: { id: request.id },
    data: {
      requesterName: input.requesterName,
      divisionId: input.divisionId,
      formData: input.formData as any,
    },
    include: {
      division: true,
      requestItems: {
        include: { item: true },
      },
    },
  })

  return updated
}

// ==================== GET ALL REQUESTS (ADMIN) ====================
export async function getAllRequests(filter?: HistoryFilter) {
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
  const limit = filter?.limit || 10
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
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.request.count({ where }),
  ])

  return {
    requests: requests.map((r) => ({
      id: r.id,
      requestNumber: r.requestNumber,
      trackingToken: r.trackingToken,
      requesterName: r.requesterName,
      divisionId: r.divisionId,
      divisionName: r.division.name,
      status: r.status,
      rejectionReason: r.rejectionReason,
      formData: r.formData as Record<string, unknown>,
      requestDate: r.requestDate,
      approvalDate: r.approvalDate,
      approvedByName: r.approvedBy?.name || null,
      items: r.requestItems.map((ri) => ({
        id: ri.id,
        itemId: ri.itemId,
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

// ==================== GET REQUEST BY ID (ADMIN) ====================
export async function getRequestById(id: string): Promise<RequestData | null> {
  const request = await prisma.request.findUnique({
    where: { id },
    include: {
      division: true,
      approvedBy: true,
      requestItems: {
        include: { item: true },
      },
    },
  })

  if (!request) return null

  return {
    id: request.id,
    requestNumber: request.requestNumber,
    trackingToken: request.trackingToken,
    requesterName: request.requesterName,
    divisionId: request.divisionId,
    divisionName: request.division.name,
    status: request.status,
    rejectionReason: request.rejectionReason,
    formData: request.formData as Record<string, unknown>,
    requestDate: request.requestDate,
    approvalDate: request.approvalDate,
    approvedByName: request.approvedBy?.name || null,
    items: request.requestItems.map((ri) => ({
      id: ri.id,
      itemId: ri.itemId,
      itemName: ri.item.name,
      qtyRequested: ri.qtyRequested,
      qtyApproved: ri.qtyApproved,
    })),
  }
}

// ==================== APPROVE REQUEST ====================
export async function approveRequest(
  requestId: string,
  adminId: string,
  input: ApproveRequestInput
) {
  const request = await prisma.request.findUnique({
    where: { id: requestId },
    include: {
      requestItems: {
        include: { item: true },
      },
    },
  })

  if (!request) {
    throw new Error('Request tidak ditemukan')
  }

  if (request.status !== RequestStatus.PENDING) {
    throw new Error('Request sudah diproses')
  }

  // Validasi qty approved
  let allFull = true
  let allZero = true

  for (const approvalItem of input.items) {
    const requestItem = request.requestItems.find(
      (ri) => ri.id === approvalItem.requestItemId
    )
    if (!requestItem) {
      throw new Error('Item request tidak ditemukan')
    }

    if (approvalItem.qtyApproved < 0) {
      throw new Error('Jumlah disetujui tidak boleh negatif')
    }

    if (approvalItem.qtyApproved > requestItem.qtyRequested) {
      throw new Error(
        `Jumlah disetujui tidak boleh melebihi jumlah diminta untuk ${requestItem.item.name}`
      )
    }

    if (approvalItem.qtyApproved > requestItem.item.stock) {
      throw new Error(
        `Stok ${requestItem.item.name} tidak mencukupi (tersedia: ${requestItem.item.stock})`
      )
    }

    if (approvalItem.qtyApproved < requestItem.qtyRequested) {
      allFull = false
    }
    if (approvalItem.qtyApproved > 0) {
      allZero = false
    }
  }

  // Tentukan status
  let newStatus: RequestStatus
  if (allZero) {
    throw new Error(
      'Tidak boleh menyetujui semua item dengan jumlah 0. Gunakan fitur reject jika ingin menolak request.'
    )
  } else if (allFull) {
    newStatus = RequestStatus.APPROVED
  } else {
    newStatus = RequestStatus.PARTIALLY_APPROVED
  }

  // Transaction: update request, items, stock, history
  await prisma.$transaction(async (tx) => {
    // Update request status
    await tx.request.update({
      where: { id: requestId },
      data: {
        status: newStatus,
        approvedById: adminId,
        approvalDate: new Date(),
      },
    })

    // Update each request item and reduce stock
    for (const approvalItem of input.items) {
      const requestItem = request.requestItems.find(
        (ri) => ri.id === approvalItem.requestItemId
      )!

      // Update qty approved
      await tx.requestItem.update({
        where: { id: approvalItem.requestItemId },
        data: { qtyApproved: approvalItem.qtyApproved },
      })

      // Reduce stock
      if (approvalItem.qtyApproved > 0) {
        await tx.item.update({
          where: { id: requestItem.itemId },
          data: { stock: { decrement: approvalItem.qtyApproved } },
        })

        // Create stock history
        await tx.stockHistory.create({
          data: {
            itemId: requestItem.itemId,
            changeType: STOCK_CHANGE_TYPES.APPROVED,
            qtyChange: -approvalItem.qtyApproved,
            notes: `Request ${request.requestNumber}`,
            requestId: requestId,
            adminId: adminId,
          },
        })
      }
    }

    // Create notification for user
    await tx.notification.create({
      data: {
        type: NOTIFICATION_TYPES.STATUS_CHANGED,
        title: 'Status Request Diperbarui',
        message: `Request ${request.requestNumber} telah ${newStatus === RequestStatus.APPROVED ? 'disetujui' : 'disetujui sebagian'}`,
        requestId: requestId,
        trackingToken: request.trackingToken,
      },
    })
  })

  return getRequestById(requestId)
}

// ==================== REJECT REQUEST ====================
export async function rejectRequest(
  requestId: string,
  adminId: string,
  reason: string
) {
  if (!reason || reason.trim().length === 0) {
    throw new Error('Alasan penolakan wajib diisi')
  }

  const request = await prisma.request.findUnique({
    where: { id: requestId },
  })

  if (!request) {
    throw new Error('Request tidak ditemukan')
  }

  if (request.status !== RequestStatus.PENDING) {
    throw new Error('Request sudah diproses')
  }

  await prisma.$transaction(async (tx) => {
    await tx.request.update({
      where: { id: requestId },
      data: {
        status: RequestStatus.REJECTED,
        rejectionReason: reason,
        approvedById: adminId,
        approvalDate: new Date(),
      },
    })

    // Create notification for user
    await tx.notification.create({
      data: {
        type: NOTIFICATION_TYPES.STATUS_CHANGED,
        title: 'Request Ditolak',
        message: `Request ${request.requestNumber} telah ditolak. Alasan: ${reason}`,
        requestId: requestId,
        trackingToken: request.trackingToken,
      },
    })
  })

  return getRequestById(requestId)
}

// ==================== GET NOTIFICATIONS BY TRACKING TOKEN ====================
export async function getNotificationsByToken(token: string) {
  const notifications = await prisma.notification.findMany({
    where: { trackingToken: token },
    orderBy: { createdAt: 'desc' },
  })

  return notifications
}
