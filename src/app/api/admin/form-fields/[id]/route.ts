import { NextResponse } from 'next/server'
import { getCurrentAdmin } from '@/lib/auth'
import { updateFormField, deleteFormField } from '@/services/formService'

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

    const result = await updateFormField(id, body)

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Field berhasil diperbarui',
    })
  } catch (error) {
    console.error('Update form field error:', error)
    const message = error instanceof Error ? error.message : 'Terjadi kesalahan server'
    return NextResponse.json(
      { success: false, error: message },
      { status: 400 }
    )
  }
}

export async function DELETE(
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
    await deleteFormField(id)

    return NextResponse.json({
      success: true,
      message: 'Field berhasil dihapus',
    })
  } catch (error) {
    console.error('Delete form field error:', error)
    const message = error instanceof Error ? error.message : 'Terjadi kesalahan server'
    return NextResponse.json(
      { success: false, error: message },
      { status: 400 }
    )
  }
}
