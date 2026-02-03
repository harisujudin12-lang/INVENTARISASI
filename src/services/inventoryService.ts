import { prisma } from '@/lib/prisma'
import { CreateItemRequest, DamagedItemRequest, ItemWithStatus } from '@/types'
import { STOCK_CHANGE_TYPES } from '@/lib/constants'

// ==================== GET ALL ITEMS ====================
export async function getAllItems(): Promise<ItemWithStatus[]> {
  const items = await prisma.item.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
  })

  return items.map((item) => ({
    ...item,
    isLowStock: item.stock <= item.threshold,
  }))
}

// ==================== GET ITEM BY ID ====================
export async function getItemById(id: string) {
  const item = await prisma.item.findUnique({
    where: { id },
  })

  if (!item) return null

  return {
    ...item,
    isLowStock: item.stock <= item.threshold,
  }
}

// ==================== CREATE ITEM ====================
export async function createItem(input: CreateItemRequest) {
  // Validasi nama unik
  const existing = await prisma.item.findUnique({
    where: { name: input.name },
  })

  if (existing) {
    throw new Error('Nama barang sudah ada')
  }

  if (input.stock < 0) {
    throw new Error('Stok tidak boleh negatif')
  }

  const item = await prisma.item.create({
    data: {
      name: input.name,
      stock: input.stock,
      threshold: input.threshold ?? 10,
    },
  })

  return item
}

// ==================== UPDATE ITEM ====================
export async function updateItem(
  id: string,
  input: Partial<CreateItemRequest>
) {
  const item = await prisma.item.findUnique({
    where: { id },
  })

  if (!item) {
    throw new Error('Barang tidak ditemukan')
  }

  // Validasi nama unik jika diubah
  if (input.name && input.name !== item.name) {
    const existing = await prisma.item.findUnique({
      where: { name: input.name },
    })
    if (existing) {
      throw new Error('Nama barang sudah ada')
    }
  }

  const updated = await prisma.item.update({
    where: { id },
    data: {
      name: input.name,
      threshold: input.threshold,
    },
  })

  return updated
}

// ==================== UPDATE STOCK (OVERWRITE) ====================
export async function updateStock(id: string, stock: number) {
  if (stock < 0) {
    throw new Error('Stok tidak boleh negatif')
  }

  const item = await prisma.item.findUnique({
    where: { id },
  })

  if (!item) {
    throw new Error('Barang tidak ditemukan')
  }

  // Langsung overwrite tanpa history
  const updated = await prisma.item.update({
    where: { id },
    data: { stock },
  })

  return updated
}

// ==================== RECORD DAMAGED ITEM ====================
export async function recordDamagedItem(
  id: string,
  adminId: string,
  input: DamagedItemRequest
) {
  const item = await prisma.item.findUnique({
    where: { id },
  })

  if (!item) {
    throw new Error('Barang tidak ditemukan')
  }

  if (input.qty <= 0) {
    throw new Error('Jumlah rusak harus lebih dari 0')
  }

  if (input.qty > item.stock) {
    throw new Error('Jumlah rusak melebihi stok tersedia')
  }

  if (!input.notes || input.notes.trim().length === 0) {
    throw new Error('Catatan/alasan wajib diisi')
  }

  // Transaction: kurangi stok dan catat history
  const [updated] = await prisma.$transaction([
    prisma.item.update({
      where: { id },
      data: { stock: { decrement: input.qty } },
    }),
    prisma.stockHistory.create({
      data: {
        itemId: id,
        changeType: STOCK_CHANGE_TYPES.DAMAGED,
        qtyChange: -input.qty,
        notes: input.notes,
        adminId: adminId,
      },
    }),
  ])

  return updated
}

// ==================== DELETE ITEM (SOFT) ====================
export async function deleteItem(id: string) {
  const item = await prisma.item.findUnique({
    where: { id },
    include: {
      requestItems: {
        include: {
          request: true,
        },
      },
    },
  })

  if (!item) {
    throw new Error('Barang tidak ditemukan')
  }

  // Cek apakah ada request pending dengan item ini
  const hasPendingRequest = item.requestItems.some(
    (ri) => ri.request.status === 'PENDING'
  )

  if (hasPendingRequest) {
    throw new Error('Tidak dapat menghapus barang yang masih ada di request pending')
  }

  // Soft delete
  await prisma.item.update({
    where: { id },
    data: { isActive: false },
  })

  return { success: true }
}

// ==================== GET LOW STOCK ITEMS ====================
export async function getLowStockItems(): Promise<ItemWithStatus[]> {
  const items = await prisma.item.findMany({
    where: {
      isActive: true,
      stock: {
        lte: prisma.item.fields.threshold,
      },
    },
    orderBy: { stock: 'asc' },
  })

  // Workaround karena Prisma tidak support field comparison langsung
  const allItems = await prisma.item.findMany({
    where: { isActive: true },
    orderBy: { stock: 'asc' },
  })

  return allItems
    .filter((item) => item.stock <= item.threshold)
    .map((item) => ({
      ...item,
      isLowStock: true,
    }))
}

// ==================== GET TOTAL STOCK ====================
export async function getTotalStock(): Promise<number> {
  const result = await prisma.item.aggregate({
    where: { isActive: true },
    _sum: { stock: true },
  })

  return result._sum.stock || 0
}

// ==================== ADJUST STOCK (KOREKSI) ====================
export async function adjustStock(
  id: string,
  newStock: number,
  reason: string,
  adminId: string
) {
  const item = await prisma.item.findUnique({
    where: { id },
  })

  if (!item) {
    throw new Error('Barang tidak ditemukan')
  }

  if (newStock < 0) {
    throw new Error('Stok tidak boleh negatif')
  }

  if (!reason || reason.trim().length === 0) {
    throw new Error('Alasan koreksi wajib diisi')
  }

  // Create adjustment log and update stock
  const [adjustment, updated] = await prisma.$transaction([
    prisma.stockAdjustment.create({
      data: {
        itemId: id,
        stockBefore: item.stock,
        stockAfter: newStock,
        reason,
        adminId,
      },
    }),
    prisma.item.update({
      where: { id },
      data: { stock: newStock },
    }),
  ])

  return { adjustment, updated }
}

// ==================== RESTOCK (PENAMBAHAN) ====================
export async function restockItem(
  id: string,
  quantity: number,
  reason: string,
  adminId: string
) {
  const item = await prisma.item.findUnique({
    where: { id },
  })

  if (!item) {
    throw new Error('Barang tidak ditemukan')
  }

  if (quantity <= 0) {
    throw new Error('Jumlah penambahan harus lebih dari 0')
  }

  if (!reason || reason.trim().length === 0) {
    throw new Error('Catatan penambahan wajib diisi')
  }

  const newStock = item.stock + quantity

  // Create history and update stock
  const [history, updated] = await prisma.$transaction([
    prisma.stockHistory.create({
      data: {
        itemId: id,
        changeType: 'RESTOCK',
        action: 'restock',
        qtyChange: quantity,
        notes: reason,
        adminId,
      },
    }),
    prisma.item.update({
      where: { id },
      data: { stock: newStock },
    }),
  ])

  return { history, updated }
}

// ==================== GET ALL STOCK ADJUSTMENTS ====================
export async function getStockAdjustments(itemId?: string) {
  return await prisma.stockAdjustment.findMany({
    where: itemId ? { itemId } : undefined,
    include: {
      admin: {
        select: { id: true, name: true, username: true },
      },
      item: {
        select: { id: true, name: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  })
}
