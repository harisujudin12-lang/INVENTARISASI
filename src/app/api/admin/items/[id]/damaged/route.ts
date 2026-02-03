import { NextResponse } from 'next/server'
import { getCurrentAdmin } from '@/lib/auth'
import { recordDamagedItem } from '@/services/inventoryService'

export async function POST(
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
    const body = await request.json()

    const result = await recordDamagedItem(id, admin.id, body)

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Barang rusak berhasil dicatat',
    })
  } catch (error) {
    console.error('Record damaged error:', error)
    const message = error instanceof Error ? error.message : 'Terjadi kesalahan server'
    return NextResponse.json(
      { success: false, error: message },
      { status: 400 }
    )
  }
}
