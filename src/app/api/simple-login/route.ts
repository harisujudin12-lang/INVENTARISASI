import { NextResponse } from 'next/server'
import { createToken, setAuthCookie } from '@/lib/auth'

export const dynamic = 'force-dynamic'

/**
 * SIMPLE TEST - Create token immediately without any database check
 * Just POST to this endpoint to get a token
 */
export async function POST() {
  try {
    console.log('[SIMPLE-LOGIN] Creating token...')

    const adminPayload = {
      id: 'admin-001',
      username: 'admin',
      name: 'Administrator',
    }

    const token = await createToken(adminPayload)
    await setAuthCookie(token)
    
    console.log('[SIMPLE-LOGIN] ✅ Token created and cookie set')

    return NextResponse.json({
      success: true,
      data: {
        id: adminPayload.id,
        username: adminPayload.username,
        name: adminPayload.name,
        token: token,
      },
      message: 'Token generated - copy to localStorage',
    })
  } catch (error) {
    console.error('[SIMPLE-LOGIN] Error:', error)
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    )
  }
}
