import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'

import { getCurrentAdmin } from '@/lib/auth'
import { exportToExcel, exportToCSV } from '@/services/historyService'
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
    const format = searchParams.get('format') || 'xlsx'
    const filter = {
      status: searchParams.get('status') as RequestStatus | undefined,
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      itemId: searchParams.get('itemId') || undefined,
    }

    if (format === 'csv') {
      const csv = await exportToCSV(filter)
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="history-${Date.now()}.csv"`,
        },
      })
    }

    const buffer = await exportToExcel(filter)
    return new NextResponse(buffer, {
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="history-${Date.now()}.xlsx"`,
      },
    })
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

