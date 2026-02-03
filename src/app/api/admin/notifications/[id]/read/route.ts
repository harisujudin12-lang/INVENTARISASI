import { NextResponse } from 'next/server'
import { getCurrentAdmin } from '@/lib/auth'
import { markAsRead } from '@/services/notificationService'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getCurrentAdmin()

    if (!admin) {
      return NextResponse.json(
        { success: false, error: 'Tidak terautentikasi' },
        { status: 401 }
      )
    }

    const { id } = await params
    await markAsRead(id)

    return NextResponse.json({
      success: true,
      message: 'Notifikasi ditandai sudah dibaca',
    })
  } catch (error) {
    console.error('Mark as read error:', error)
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
