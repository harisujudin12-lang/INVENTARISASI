import { NextResponse } from 'next/server'
import { removeAuthCookie } from '@/lib/auth'

export async function POST() {
  try {
    await removeAuthCookie()

    return NextResponse.json({
      success: true,
      message: 'Berhasil logout',
    })
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
