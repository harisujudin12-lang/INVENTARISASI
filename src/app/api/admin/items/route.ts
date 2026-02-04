import { NextResponse } from 'next/server'
import { getCurrentAdmin } from '@/lib/auth'
import { getAllItems, createItem } from '@/services/inventoryService'

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

    const data = await getAllItems()

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error) {
    console.error('Get items error:', error)
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const admin = await getCurrentAdmin()

    if (!admin) {
      return NextResponse.json(
        { success: false, error: 'Tidak terautentikasi' },
        { status: 401 }
      )
    }

    const body = await request.json()

    const result = await createItem(body)

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Barang berhasil ditambahkan',
    })
  } catch (error) {
    console.error('Create item error:', error)
    const message = error instanceof Error ? error.message : 'Terjadi kesalahan server'
    return NextResponse.json(
      { success: false, error: message },
      { status: 400 }
    )
  }
}
