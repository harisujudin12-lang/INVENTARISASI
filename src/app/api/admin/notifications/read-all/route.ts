import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'

import { getCurrentAdmin } from '@/lib/auth'
import { markAllAsRead } from '@/services/notificationService'

export async function PUT() {
  try {
    const admin = await getCurrentAdmin()

    if (!admin) {
      return NextResponse.json(
        { success: false, error: 'Tidak terautentikasi' },
        { status: 401 }
      )
    }

    await markAllAsRead(admin.id)

    return NextResponse.json({
      success: true,
      message: 'Semua notifikasi ditandai sudah dibaca',
    })
  } catch (error) {
    console.error('Mark all as read error:', error)
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

