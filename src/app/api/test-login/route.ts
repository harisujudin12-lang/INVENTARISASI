import { NextResponse } from 'next/server'
import { createToken, setAuthCookie } from '@/lib/auth'

export const dynamic = 'force-dynamic'

/**
 * TEST LOGIN ENDPOINT - Bypass database, direct token generation
 * URL: /api/test-login
 * Used for quick testing when auth is broken
 */
export async function POST() {
  try {
    console.log('[TEST LOGIN] Creating token for admin...')

    // Hardcoded test admin
    const adminPayload = {
      id: 'admin-001',
      username: 'admin',
      name: 'Administrator',
    }

    // Create token
    const token = await createToken(adminPayload)
    console.log('[TEST LOGIN] Token created:', token.substring(0, 20) + '...')

    // Set cookie
    await setAuthCookie(token)
    console.log('[TEST LOGIN] ✅ Cookie set')

    return NextResponse.json({
      success: true,
      data: {
        id: adminPayload.id,
        username: adminPayload.username,
        name: adminPayload.name,
        token: token,
      },
      message: 'TEST LOGIN - Token created (bypass database)',
    })
  } catch (error) {
    console.error('[TEST LOGIN] Error:', error)
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    )
  }
}
