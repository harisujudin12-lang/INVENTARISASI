import { NextResponse } from 'next/server'
import { getPublicFormData } from '@/services/requestService'

export async function GET() {
  try {
    const data = await getPublicFormData()

    return NextResponse.json(
      {
        success: true,
        data,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
          'X-Cache-Tag': 'form-data',
        },
      }
    )
  } catch (error) {
    console.error('Get form error:', error)
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
