import { NextResponse } from 'next/server'
import { revalidatePath, revalidateTag } from 'next/cache'
import { getCurrentAdmin } from '@/lib/auth'
import { getAllFormFields, createFormField } from '@/services/formService'

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

    const data = await getAllFormFields()

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error) {
    console.error('Get form fields error:', error)
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

    const result = await createFormField(body)

    // Revalidate public form data BEFORE returning
    await Promise.all([
      revalidatePath('/request'),
      revalidatePath('/track'),
      revalidateTag('form-data'),
    ])

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Field berhasil ditambahkan',
    })
  } catch (error) {
    console.error('Create form field error:', error)
    const message = error instanceof Error ? error.message : 'Terjadi kesalahan server'
    return NextResponse.json(
      { success: false, error: message },
      { status: 400 }
    )
  }
}
