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

    const [adjustments, total] = await Promise.all([
      prisma.stockAdjustment.findMany({
        include: {
          item: true,
          admin: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.stockAdjustment.count(),
    ])

    const data = adjustments.map((a) => ({
      id: a.id,
      itemName: a.item.name,
      stockBefore: a.stockBefore,
      stockAfter: a.stockAfter,
      reason: a.reason,
      adminName: a.admin.name,
      createdAt: a.createdAt,
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
    console.error('Get adjustment history error:', error)
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
