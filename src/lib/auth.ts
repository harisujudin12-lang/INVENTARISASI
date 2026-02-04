import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { AdminPayload } from '@/types'

// HARDCODED for production - CHANGE THIS LATER
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'inventaris-hardcoded-secret-key-2025-xyz'
)

const COOKIE_NAME = 'admin_token'

export async function createToken(payload: AdminPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(JWT_SECRET)
}

export async function verifyToken(token: string): Promise<AdminPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as unknown as AdminPayload
  } catch (error) {
    console.error('[Auth] Token verification failed:', error)
    return null
  }
}

export async function setAuthCookie(token: string): Promise<void> {
  const cookieStore = await cookies()
  const isProduction = process.env.NODE_ENV === 'production'
  
  console.log('[Auth] Setting cookie - secure:', isProduction, 'NODE_ENV:', process.env.NODE_ENV)
  
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProduction && process.env.VERCEL === '1', // Only secure on Vercel production
    sameSite: 'lax',
    maxAge: 60 * 60 * 24, // 24 hours
    path: '/',
  })
}

export async function removeAuthCookie(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
}

export async function getAuthToken(): Promise<string | undefined> {
  const cookieStore = await cookies()
  return cookieStore.get(COOKIE_NAME)?.value
}

export async function getCurrentAdmin(): Promise<AdminPayload | null> {
  const token = await getAuthToken()
  if (!token) return null
  return verifyToken(token)
}
