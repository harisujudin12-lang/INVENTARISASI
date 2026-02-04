import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * DEBUG - Check if admin user exists in database
 */
export async function GET() {
  try {
    const admin = await prisma.admin.findUnique({
      where: { username: 'admin' },
      select: {
        id: true,
        username: true,
        name: true,
        createdAt: true,
      },
    })

    if (admin) {
      return NextResponse.json({
        success: true,
        data: admin,
        message: 'Admin user exists in database',
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          message: 'Admin user NOT found in database - need to seed',
          hint: 'Run: npx prisma db seed',
        },
        { status: 404 }
      )
    }
  } catch (error) {
    console.error('[DEBUG] Database error:', error)
    return NextResponse.json(
      {
        success: false,
        error: String(error),
        message: 'Database connection error',
      },
      { status: 500 }
    )
  }
}
