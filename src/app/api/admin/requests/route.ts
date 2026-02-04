import { NextResponse } from 'next/server'
import { getCurrentAdmin } from '@/lib/auth'
import { getAllRequests } from '@/services/requestService'
import { RequestStatus } from '@prisma/client'

export const dynamic = 'force-dynamic'

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
      itemId: searchParams.get('itemId') || undefined,
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 10,
    }

    const data = await getAllRequests(filter)

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error) {
    console.error('Get requests error:', error)
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
