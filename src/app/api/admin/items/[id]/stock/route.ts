import { NextResponse } from 'next/server'
import { getCurrentAdmin } from '@/lib/auth'
import { updateStock } from '@/services/inventoryService'

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
    const body = await request.json()

    if (typeof body.stock !== 'number') {
      return NextResponse.json(
        { success: false, error: 'Stok harus berupa angka' },
        { status: 400 }
      )
    }

    const result = await updateStock(id, body.stock)

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Stok berhasil diperbarui',
    })
  } catch (error) {
    console.error('Update stock error:', error)
    const message = error instanceof Error ? error.message : 'Terjadi kesalahan server'
    return NextResponse.json(
      { success: false, error: message },
      { status: 400 }
    )
  }
}
