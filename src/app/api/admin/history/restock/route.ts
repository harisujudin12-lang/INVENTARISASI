import { NextResponse } from 'next/server'
import { getCurrentAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const admin = await getCurrentAdmin()

    if (!admin) {
      return NextResponse.json(
        { success: false, error: 'Tidak terautentikasi' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20
    const skip = (page - 1) * limit

    // Query untuk action restock dan reduction
    const where = {
      action: {
        in: ['restock', 'reduction'],
      },
    }

    const [history, total] = await Promise.all([
      prisma.stockHistory.findMany({
        where,
        include: {
          item: true,
          admin: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.stockHistory.count({ where }),
    ])

    const data = history.map((h) => ({
      id: h.id,
      itemName: h.item.name,
      changeType: h.changeType,
      action: h.action || 'restock',
      qtyChange: h.qtyChange,
      notes: h.notes,
      adminName: h.admin.name,
      createdAt: h.createdAt,
    }))

    return NextResponse.json({
      success: true,
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Get restock/reduction history error:', error)
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
