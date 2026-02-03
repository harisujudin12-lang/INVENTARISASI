import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { prisma } from '@/lib/prisma';

const UPLOAD_DIR = path.join(process.cwd(), 'public/images/items');
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get form data
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Only jpg, png, webp allowed' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'File size max 5MB' },
        { status: 400 }
      );
    }

    // Get item
    const item = await prisma.item.findUnique({
      where: { id: params.id }
    });

    if (!item) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate unique filename
    const ext = file.type === 'image/jpeg' ? 'jpg' : 
                file.type === 'image/png' ? 'png' : 'webp';
    const filename = `${params.id}-${Date.now()}.${ext}`;
    const filepath = path.join(UPLOAD_DIR, filename);

    // Save file
    await fs.writeFile(filepath, buffer);

    // Update item with image URL
    const imageUrl = `/images/items/${filename}`;
    const updated = await prisma.item.update({
      where: { id: params.id },
      data: { imageUrl }
    });

    return NextResponse.json({
      success: true,
      imageUrl,
      item: updated
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Upload failed' },
      { status: 500 }
    );
  }
}
