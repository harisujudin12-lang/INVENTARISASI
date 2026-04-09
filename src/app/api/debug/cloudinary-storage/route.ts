import { NextResponse } from 'next/server'

/**
 * DEBUG endpoint untuk test Cloudinary connection
 */
export async function GET() {
  try {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME || ''
    const apiKey = process.env.CLOUDINARY_API_KEY || ''
    const apiSecret = process.env.CLOUDINARY_API_SECRET || ''

    if (!cloudName || !apiKey || !apiSecret) {
      return NextResponse.json({
        success: false,
        error: 'Cloudinary credentials missing',
        env: {
          CLOUDINARY_CLOUD_NAME: cloudName ? '✅' : '❌',
          CLOUDINARY_API_KEY: apiKey ? '✅' : '❌',
          CLOUDINARY_API_SECRET: apiSecret ? '✅' : '❌',
        }
      })
    }

    const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64')
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/resources/image?max_results=5`,
      {
        method: 'GET',
        headers: {
          Authorization: `Basic ${auth}`,
        },
        cache: 'no-store',
      }
    )

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json({
        success: false,
        error: 'Cloudinary API error',
        details: String(data?.error?.message || 'Unknown error'),
        env: {
          CLOUDINARY_CLOUD_NAME: cloudName ? '✅' : '❌',
          CLOUDINARY_API_KEY: apiKey ? '✅' : '❌',
          CLOUDINARY_API_SECRET: apiSecret ? '✅' : '❌',
        }
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Cloudinary connected',
      fileCount: data?.resources?.length || 0,
      files: data?.resources?.map((f: { public_id: string }) => f.public_id).slice(0, 5) || [],
      env: {
        CLOUDINARY_CLOUD_NAME: cloudName ? '✅' : '❌',
        CLOUDINARY_API_KEY: apiKey ? '✅' : '❌',
        CLOUDINARY_API_SECRET: apiSecret ? '✅' : '❌',
      }
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: String(error),
    }, { status: 500 })
  }
}
