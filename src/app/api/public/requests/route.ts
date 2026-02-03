import { NextResponse } from 'next/server'
import { createRequest } from '@/services/requestService'

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const result = await createRequest(body)

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Request berhasil dikirim',
    })
  } catch (error) {
    console.error('Create request error:', error)
    const message = error instanceof Error ? error.message : 'Terjadi kesalahan server'
    return NextResponse.json(
      { success: false, error: message },
      { status: 400 }
    )
  }
}
