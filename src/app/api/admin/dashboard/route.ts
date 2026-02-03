import { NextResponse } from 'next/server'
import { getCurrentAdmin } from '@/lib/auth'
import { getDashboardData } from '@/services/dashboardService'

export async function GET() {
  try {
    const admin = await getCurrentAdmin()

    if (!admin) {
      return NextResponse.json(
        { success: false, error: 'Tidak terautentikasi' },
        { status: 401 }
      )
    }

    const data = await getDashboardData(admin.id)

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error) {
    console.error('Get dashboard error:', error)
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
