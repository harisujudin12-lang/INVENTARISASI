import { NextResponse } from 'next/server'
import { getCurrentAdmin } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const admin = await getCurrentAdmin()
    
    console.log('[API /me] Current admin:', admin)

    if (!admin) {
      return NextResponse.json(
        { success: false, error: 'Tidak terautentikasi' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      success: true,
      data: admin,
    })
  } catch (error) {
    console.error('Get me error:', error)
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
