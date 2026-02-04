import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyToken } from '@/lib/auth'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip auth check for login page and auth API routes
  if (pathname === '/admin/login' || pathname.startsWith('/api/auth')) {
    return NextResponse.next()
  }

  // Check for Authorization header (from localStorage)
  const authHeader = request.headers.get('Authorization')
  const tokenFromHeader = authHeader?.replace('Bearer ', '')

  // Check for cookie token
  let token = request.cookies.get('admin_token')?.value

  // Use header token if available (takes precedence)
  if (tokenFromHeader) {
    token = tokenFromHeader
    console.log('[Middleware] Using token from Authorization header')
  }

  // Protect admin routes and API admin routes
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    if (!token) {
      // For API routes, return 401
      if (pathname.startsWith('/api/admin')) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 401 }
        )
      }
      // For pages, redirect to login
      const loginUrl = new URL('/admin/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }

    try {
      const payload = await verifyToken(token)
      if (!payload) {
        // For API routes, return 401
        if (pathname.startsWith('/api/admin')) {
          return NextResponse.json(
            { success: false, error: 'Unauthorized' },
            { status: 401 }
          )
        }
        // For pages, redirect to login
        const loginUrl = new URL('/admin/login', request.url)
        loginUrl.searchParams.set('redirect', pathname)
        const response = NextResponse.redirect(loginUrl)
        response.cookies.delete('admin_token')
        return response
      }
    } catch (error) {
      console.error('[Middleware] Token verification error:', error)
      // For API routes, return 401
      if (pathname.startsWith('/api/admin')) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 401 }
        )
      }
      // For pages, redirect to login
      const loginUrl = new URL('/admin/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
}
