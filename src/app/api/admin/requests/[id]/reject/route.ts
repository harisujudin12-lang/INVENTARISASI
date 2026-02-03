import { NextResponse } from 'next/server'
import { getCurrentAdmin } from '@/lib/auth'
import { rejectRequest } from '@/services/requestService'

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

    if (!body.reason) {
      return NextResponse.json(
        { success: false, error: 'Alasan penolakan wajib diisi' },
        { status: 400 }
      )
    }

    const result = await rejectRequest(id, admin.id, body.reason)

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Request berhasil ditolak',
    })
  } catch (error) {
    console.error('Reject request error:', error)
    const message = error instanceof Error ? error.message : 'Terjadi kesalahan server'
    return NextResponse.json(
      { success: false, error: message },
      { status: 400 }
    )
  }
}
