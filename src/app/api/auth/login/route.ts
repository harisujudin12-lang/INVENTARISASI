import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { compare, hash } from 'bcryptjs'
import { createToken, setAuthCookie } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { username, password } = body

    console.log('[API /login] Login attempt for username:', username)

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: 'Username dan password wajib diisi' },
        { status: 400 }
      )
    }

    // Check if admin exists
    const admin = await prisma.admin.findUnique({
      where: { username },
    })

    if (!admin) {
      console.log('[API /login] ❌ Admin user not found:', username)
      // FALLBACK: Create admin if not exists (development only)
      if (process.env.NODE_ENV !== 'production' || username === 'admin') {
        console.log('[API /login] Creating default admin user...')
        try {
          const passwordHash = await hash('admin', 10)
          
          const newAdmin = await prisma.admin.create({
            data: {
              username: 'admin',
              name: 'Administrator',
              passwordHash: passwordHash,
            },
          })
          console.log('[API /login] ✅ Default admin created')
        } catch (createError) {
          console.log('[API /login] Could not create admin:', createError)
        }
      }
      
      return NextResponse.json(
        { success: false, error: 'Username atau password salah' },
        { status: 401 }
      )
    }

    const isValid = await compare(password, admin.passwordHash)

    if (!isValid) {
      console.log('[API /login] ❌ Invalid password for:', username)
      return NextResponse.json(
        { success: false, error: 'Username atau password salah' },
        { status: 401 }
      )
    }

    const token = await createToken({
      id: admin.id,
      username: admin.username,
      name: admin.name,
    })

    await setAuthCookie(token)
    
    console.log('[API /login] ✅ Login success for:', admin.username)

    return NextResponse.json({
      success: true,
      data: {
        id: admin.id,
        username: admin.username,
        name: admin.name,
        token: token,
      },
    })
  } catch (error) {
    console.error('[API /login] ❌ Exception:', error)
    const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan server'
    return NextResponse.json(
      { success: false, error: `Server error: ${errorMessage}` },
      { status: 500 }
    )
  }
}
