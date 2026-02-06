import { NextRequest, NextResponse } from 'next/server'
import { getCurrentAdmin } from '@/lib/auth'
import { getSettings, setSettings } from '@/services/settingService'

export const dynamic = 'force-dynamic'

// GET: Retrieve settings
export async function GET() {
  try {
    const admin = await getCurrentAdmin()
    if (!admin) {
      return NextResponse.json(
        { success: false, error: 'Tidak terautentikasi' },
        { status: 401 }
      )
    }

    const settings = await getSettings(['form_title', 'form_description'])

    return NextResponse.json({
      success: true,
      data: settings,
    })
  } catch (error) {
    console.error('Get settings error:', error)
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

// PUT: Update settings
export async function PUT(request: NextRequest) {
  try {
    const admin = await getCurrentAdmin()
    if (!admin) {
      return NextResponse.json(
        { success: false, error: 'Tidak terautentikasi' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const allowedKeys = ['form_title', 'form_description']
    const filtered: Record<string, string> = {}

    for (const key of allowedKeys) {
      if (key in body) {
        filtered[key] = String(body[key]).trim()
      }
    }

    if (Object.keys(filtered).length === 0) {
      return NextResponse.json(
        { success: false, error: 'Tidak ada data yang diubah' },
        { status: 400 }
      )
    }

    await setSettings(filtered)

    return NextResponse.json({
      success: true,
      message: 'Pengaturan berhasil diperbarui',
    })
  } catch (error) {
    console.error('Update settings error:', error)
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
