import { NextRequest, NextResponse } from 'next/server'
import { getCurrentAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await getCurrentAdmin()

    if (!admin) {
      return NextResponse.json(
        { success: false, error: 'Tidak terautentikasi' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { action, quantity, reason } = body
    const itemId = params.id

    if (!action || !['restock', 'reduction', 'adjustment'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Action tidak valid' },
        { status: 400 }
      )
    }

    // Validate input
    if (!reason || reason.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Alasan/catatan wajib diisi' },
        { status: 400 }
      )
    }

    const item = await prisma.item.findUnique({
      where: { id: itemId },
    })

    if (!item) {
      return NextResponse.json(
        { success: false, error: 'Barang tidak ditemukan' },
        { status: 404 }
      )
    }

    let newStock = item.stock
    let historyChangeType = ''
    let historyAction = ''
    let qtyChange = 0

    if (action === 'restock') {
      if (quantity <= 0) {
        return NextResponse.json(
          { success: false, error: 'Jumlah restock harus lebih dari 0' },
          { status: 400 }
        )
      }
      newStock = item.stock + quantity
      qtyChange = quantity
      historyChangeType = 'RESTOCK'
      historyAction = 'restock'
    } else if (action === 'reduction') {
      if (quantity <= 0) {
        return NextResponse.json(
          { success: false, error: 'Jumlah pengurangan harus lebih dari 0' },
          { status: 400 }
        )
      }
      newStock = item.stock - quantity // subtract positive quantity
      qtyChange = -quantity
      historyChangeType = 'REDUCTION'
      historyAction = 'reduction'
    } else if (action === 'adjustment') {
      // Adjustment langsung set ke nilai baru
      newStock = quantity
      qtyChange = quantity - item.stock
      historyChangeType = 'ADJUSTMENT'
      historyAction = 'adjustment'
    }

    if (newStock < 0) {
      return NextResponse.json(
        { success: false, error: 'Stok tidak boleh negatif' },
        { status: 400 }
      )
    }

    // Create history and update stock
    const transactionOps: any[] = [
      prisma.stockHistory.create({
        data: {
          itemId,
          changeType: historyChangeType,
          action: historyAction,
          qtyChange,
          notes: reason,
          adminId: admin.id,
        },
      }),
      prisma.item.update({
        where: { id: itemId },
        data: { stock: newStock },
      }),
    ]

    // Also save to StockAdjustment table for adjustment actions
    if (action === 'adjustment') {
      transactionOps.push(
        prisma.stockAdjustment.create({
          data: {
            itemId,
            stockBefore: item.stock,
            stockAfter: newStock,
            reason,
            adminId: admin.id,
          },
        })
      )
    }

    const results = await prisma.$transaction(transactionOps)

    return NextResponse.json({
      success: true,
      data: { history: results[0], item: results[1] },
      message: `${action.charAt(0).toUpperCase() + action.slice(1)} berhasil tercatat`,
    })
  } catch (error) {
    console.error('Stock action error:', error)
    const message = error instanceof Error ? error.message : 'Terjadi kesalahan server'
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
}
