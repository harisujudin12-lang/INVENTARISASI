import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { createClient } from '@supabase/supabase-js';
import { prisma } from '@/lib/prisma';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('[UPLOAD] Starting upload for item:', params.id)
    
    // Get form data
    const formData = await request.formData();
    const file = formData.get('file') as File;

    console.log('[UPLOAD] File received:', file?.name, 'Size:', file?.size, 'Type:', file?.type)

    if (!file) {
      console.log('[UPLOAD] ❌ No file provided')
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      console.log('[UPLOAD] ❌ Invalid file type:', file.type)
      return NextResponse.json(
        { error: 'Only jpg, png, webp allowed' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_SIZE) {
      console.log('[UPLOAD] ❌ File too large:', file.size)
      return NextResponse.json(
        { error: 'File size max 5MB' },
        { status: 400 }
      );
    }

    // Get item
    const item = await prisma.item.findUnique({
      where: { id: params.id }
    });

    console.log('[UPLOAD] Item found:', item?.id, item?.name)

    if (!item) {
      console.log('[UPLOAD] ❌ Item not found')
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    console.log('[UPLOAD] Buffer created, size:', buffer.length)

    // Generate unique filename
    const ext = file.type === 'image/jpeg' ? 'jpg' : 
                file.type === 'image/png' ? 'png' : 'webp';
    const filename = `${params.id}-${Date.now()}.${ext}`;
    console.log('[UPLOAD] Uploading to Supabase:', filename)

    // Upload to Supabase Storage
    const { data, error: uploadError } = await supabase.storage
      .from('items')
      .upload(filename, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('[UPLOAD] ❌ Supabase upload error:', uploadError);
      return NextResponse.json(
        { error: 'Upload to storage failed: ' + String(uploadError) },
        { status: 500 }
      );
    }

    console.log('[UPLOAD] ✅ Uploaded to Supabase:', data?.path)

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('items')
      .getPublicUrl(filename);

    console.log('[UPLOAD] Public URL:', publicUrl)

    // Update item with image URL
    const updated = await prisma.item.update({
      where: { id: params.id },
      data: { imageUrl: publicUrl }
    });

    console.log('[UPLOAD] ✅ Database updated, imageUrl:', updated.imageUrl)

    // Revalidate public form data and inventory cache
    console.log('[UPLOAD] Revalidating cache...')
    await Promise.all([
      revalidatePath('/admin/inventory'),
      revalidatePath('/request'),
      revalidatePath('/track'),
      revalidateTag('form-data'),
      revalidateTag('inventory-data'),
    ]);
    console.log('[UPLOAD] ✅ Cache revalidated')

    return NextResponse.json({
      success: true,
      imageUrl: publicUrl,
      item: updated
    });
  } catch (error) {
    console.error('[UPLOAD] ❌ Exception:', error);
    return NextResponse.json(
      { error: 'Upload failed: ' + String(error) },
      { status: 500 }
    );
  }
}
