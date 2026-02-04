import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getCurrentAdmin, getAuthToken, verifyToken } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    console.log('[API /auth/me] Request received')
    
    // Try to get admin from token
    let admin = null
    
    // FIRST: Try cookie (most reliable method)
    const cookieToken = await getAuthToken()
    console.log('[API /auth/me] Cookie token exists:', !!cookieToken)
    
    if (cookieToken) {
      admin = await verifyToken(cookieToken)
      console.log('[API /auth/me] ✅ Verified from COOKIE:', admin?.username)
    }
    
    // SECOND: If no cookie, try Authorization header (from localStorage)
    if (!admin) {
      const authHeader = request.headers.get('Authorization')
      const headerToken = authHeader?.replace('Bearer ', '')
      console.log('[API /auth/me] Authorization header exists:', !!headerToken)
      
      if (headerToken) {
        admin = await verifyToken(headerToken)
        console.log('[API /auth/me] ✅ Verified from HEADER:', admin?.username)
      }
    }

    if (!admin) {
      console.log('[API /auth/me] ❌ No valid token found')
      return NextResponse.json(
        { success: false, error: 'Tidak terautentikasi' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      success: true,
      data: admin,
    })
  } catch (error) {
    console.error('[API /auth/me] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
