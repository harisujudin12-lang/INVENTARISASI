import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * DEBUG endpoint untuk test Supabase Storage connection
 */
export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    )

    // Test: List files in bucket
    const { data, error } = await supabase.storage
      .from('items')
      .list('', {
        limit: 5,
        offset: 0,
      })

    if (error) {
      return NextResponse.json({
        success: false,
        error: 'Supabase storage error',
        details: String(error),
        env: {
          NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅' : '❌',
          SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅' : '❌',
        }
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Supabase Storage connected',
      fileCount: data?.length || 0,
      files: data?.map(f => f.name).slice(0, 5) || [],
      env: {
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅' : '❌',
        SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅' : '❌',
      }
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: String(error),
    }, { status: 500 })
  }
}
