import { NextResponse } from 'next/server'
import { getCurrentAdmin } from '@/lib/auth'
import { getAdminNotifications, getUnreadCount } from '@/services/notificationService'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const admin = await getCurrentAdmin()

    if (!admin) {
      return NextResponse.json(
        { success: false, error: 'Tidak terautentikasi' },
        { status: 401 }
      )
    }

    const [notifications, unreadCount] = await Promise.all([
      getAdminNotifications(admin.id),
      getUnreadCount(admin.id),
    ])

    return NextResponse.json({
      success: true,
      data: {
        notifications,
        unreadCount,
      },
    })
  } catch (error) {
    console.error('Get notifications error:', error)
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
