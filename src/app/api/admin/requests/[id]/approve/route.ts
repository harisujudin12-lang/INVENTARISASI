import { NextResponse } from 'next/server'
import { getCurrentAdmin } from '@/lib/auth'
import { approveRequest } from '@/services/requestService'

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

    const result = await approveRequest(id, admin.id, body)

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Request berhasil diproses',
    })
  } catch (error) {
    console.error('Approve request error:', error)
    const message = error instanceof Error ? error.message : 'Terjadi kesalahan server'
    return NextResponse.json(
      { success: false, error: message },
      { status: 400 }
    )
  }
}
