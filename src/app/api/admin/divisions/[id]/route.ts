import { NextResponse } from 'next/server'
import { revalidatePath, revalidateTag } from 'next/cache'
import { getCurrentAdmin } from '@/lib/auth'
import { updateDivision, deleteDivision } from '@/services/divisionService'

export const dynamic = 'force-dynamic'

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

    if (!body.name || body.name.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Nama divisi wajib diisi' },
        { status: 400 }
      )
    }

    const result = await updateDivision(id, body.name)

    // Revalidate public form data
    revalidatePath('/request')
    revalidatePath('/track')
    revalidateTag('form-data')

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Divisi berhasil diperbarui',
    })
  } catch (error) {
    console.error('Update division error:', error)
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
    console.log('[DELETE /admin/divisions] Deleting division:', id)
    await deleteDivision(id)
    console.log('[DELETE /admin/divisions] Successfully deleted division:', id)

    // Revalidate public form data
    revalidatePath('/request')
    revalidatePath('/track')
    revalidateTag('form-data')

    return NextResponse.json({
      success: true,
      message: 'Divisi berhasil dihapus',
    })
  } catch (error) {
    console.error('[DELETE /admin/divisions] Error:', error)
    const message = error instanceof Error ? error.message : 'Terjadi kesalahan server'
    return NextResponse.json(
      { success: false, error: message },
      { status: 400 }
    )
  }
}
