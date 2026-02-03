import { NextResponse } from 'next/server'
import { getCurrentAdmin } from '@/lib/auth'
import { getAllDivisions, createDivision } from '@/services/divisionService'

export async function GET() {
  try {
    const admin = await getCurrentAdmin()

    if (!admin) {
      return NextResponse.json(
        { success: false, error: 'Tidak terautentikasi' },
        { status: 401 }
      )
    }

    const data = await getAllDivisions()

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error) {
    console.error('Get divisions error:', error)
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

    if (!body.name || body.name.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Nama divisi wajib diisi' },
        { status: 400 }
      )
    }

    const result = await createDivision(body.name)

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Divisi berhasil ditambahkan',
    })
  } catch (error) {
    console.error('Create division error:', error)
    const message = error instanceof Error ? error.message : 'Terjadi kesalahan server'
    return NextResponse.json(
      { success: false, error: message },
      { status: 400 }
    )
  }
}
