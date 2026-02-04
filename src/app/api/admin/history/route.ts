import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'

import { getCurrentAdmin } from '@/lib/auth'
import { getRequestHistory } from '@/services/historyService'

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
    const filter = {
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      itemId: searchParams.get('itemId') || undefined,
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20,
    }

    const data = await getRequestHistory(filter)

    return NextResponse.json({
      success: true,
      data: data.data,
      pagination: {
        total: data.total,
        page: data.page,
        limit: filter.limit,
        totalPages: data.totalPages,
      },
    })
  } catch (error) {
    console.error('Get history error:', error)
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

