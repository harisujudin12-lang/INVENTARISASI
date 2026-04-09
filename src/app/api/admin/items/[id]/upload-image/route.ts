import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { createHash } from 'crypto';
import { prisma } from '@/lib/prisma';

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

function getFileExtFromName(name: string): 'jpg' | 'png' | 'webp' | null {
  const ext = name.toLowerCase().split('.').pop()
  if (ext === 'jpg' || ext === 'jpeg') return 'jpg'
  if (ext === 'png') return 'png'
  if (ext === 'webp') return 'webp'
  return null
}

// Check Cloudinary credentials
const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || '';
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY || '';
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET || '';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('[UPLOAD] Starting upload for item:', params.id)

    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
      console.error('[UPLOAD] ❌ Missing Cloudinary credentials!', {
        CLOUDINARY_CLOUD_NAME: !!CLOUDINARY_CLOUD_NAME,
        CLOUDINARY_API_KEY: !!CLOUDINARY_API_KEY,
        CLOUDINARY_API_SECRET: !!CLOUDINARY_API_SECRET,
      });
      return NextResponse.json(
        {
          error: 'Cloudinary credentials are not configured',
          cloudinaryConfigured: false,
        },
        { status: 500 }
      );
    }
    
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

    const extFromName = getFileExtFromName(file.name)
    const typeAllowed = ALLOWED_TYPES.includes(file.type)

    // Some mobile apps can send empty/odd MIME type even for valid jpg/png files.
    if (!typeAllowed && !extFromName) {
      console.log('[UPLOAD] ❌ Invalid file type:', file.type, file.name)
      return NextResponse.json(
        { error: 'Format file harus jpg, png, atau webp' },
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
    const ext =
      file.type === 'image/jpeg' || file.type === 'image/jpg'
        ? 'jpg'
        : file.type === 'image/png'
          ? 'png'
          : file.type === 'image/webp'
            ? 'webp'
            : extFromName || 'jpg';
    const publicId = `${params.id}-${Date.now()}`;
    const folder = 'items';
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signatureBase = `folder=${folder}&public_id=${publicId}&timestamp=${timestamp}${CLOUDINARY_API_SECRET}`;
    const signature = createHash('sha1').update(signatureBase).digest('hex');

    const cloudinaryFormData = new FormData();
    cloudinaryFormData.append('file', new Blob([buffer], { type: file.type }), `${publicId}.${ext}`);
    cloudinaryFormData.append('api_key', CLOUDINARY_API_KEY);
    cloudinaryFormData.append('timestamp', timestamp);
    cloudinaryFormData.append('signature', signature);
    cloudinaryFormData.append('folder', folder);
    cloudinaryFormData.append('public_id', publicId);

    console.log('[UPLOAD] Uploading to Cloudinary:', `${publicId}.${ext}`)

    const uploadRes = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: cloudinaryFormData,
      }
    );

    const uploadData = await uploadRes.json();

    if (!uploadRes.ok || !uploadData?.secure_url) {
      console.error('[UPLOAD] ❌ Cloudinary upload error:', uploadData);
      return NextResponse.json(
        { 
          error: 'Upload to storage failed',
          details: String(uploadData?.error?.message || 'Unknown Cloudinary error'),
          cloudinaryConfigured: !!(CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET),
        },
        { status: 500 }
      );
    }

    const publicUrl = String(uploadData.secure_url);

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
      { 
        error: 'Upload failed',
        details: String(error),
        cloudinaryConfigured: !!(CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET),
      },
      { status: 500 }
    );
  }
}
