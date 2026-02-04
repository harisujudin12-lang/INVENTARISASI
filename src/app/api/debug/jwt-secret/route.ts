import { NextResponse } from 'next/server'

export async function GET() {
  const secret = process.env.JWT_SECRET || 'inventaris-hardcoded-secret-key-2025-xyz'
  const isProduction = process.env.NODE_ENV === 'production'
  const onVercel = process.env.VERCEL === '1'
  
  return NextResponse.json({
    NODE_ENV: process.env.NODE_ENV,
    VERCEL: process.env.VERCEL,
    isProduction,
    onVercel,
    JWT_SECRET: secret.substring(0, 10) + '...' + secret.substring(secret.length - 10),
    JWT_SECRET_FULL: secret, // Show full for debugging
    message: 'Debug info - JWT_SECRET info above',
  })
}
