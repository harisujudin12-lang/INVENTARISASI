import { NextResponse } from 'next/server'
import { getCurrentAdmin } from '@/lib/auth'
import { getRequestHistory } from '@/services/historyService'
import { RequestStatus } from '@prisma/client'

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
      status: searchParams.get('status') as RequestStatus | undefined,
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20,
    }

    const result = await getRequestHistory(filter)

    return NextResponse.json({
      success: true,
      data: result.data,
      pagination: {
        total: result.total,
        page: result.page,
        limit: filter.limit,
        totalPages: result.totalPages,
      },
    })
  } catch (error) {
    console.error('Get request history error:', error)
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
