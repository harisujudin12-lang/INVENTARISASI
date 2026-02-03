import { NextResponse } from 'next/server'
import { getRequestByToken, updateRequest, getNotificationsByToken } from '@/services/requestService'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params
    const data = await getRequestByToken(token)

    if (!data) {
      return NextResponse.json(
        { success: false, error: 'Request tidak ditemukan' },
        { status: 404 }
      )
    }

    // Get notifications too
    const notifications = await getNotificationsByToken(token)

    return NextResponse.json({
      success: true,
      data: {
        ...data,
        notifications,
      },
    })
  } catch (error) {
    console.error('Get request error:', error)
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params
    const body = await request.json()

    const result = await updateRequest(token, body)

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Request berhasil diperbarui',
    })
  } catch (error) {
    console.error('Update request error:', error)
    const message = error instanceof Error ? error.message : 'Terjadi kesalahan server'
    return NextResponse.json(
      { success: false, error: message },
      { status: 400 }
    )
  }
}
