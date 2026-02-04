import { NextResponse } from 'next/server'
import { getPublicFormData } from '@/services/requestService'

export const revalidate = 3600 // Cache untuk 1 jam

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
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
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
