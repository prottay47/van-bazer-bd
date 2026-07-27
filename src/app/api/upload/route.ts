import { NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/auth';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

export async function POST(req: Request) {
  try {
    const isAuth = await isAdminAuthenticated();
    if (!isAuth) {
      return NextResponse.json({ error: 'অনুমতি নেই' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'কোনো ফাইল আপলোড করা হয়নি' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Convert image to WebP format using Sharp
    const webpBuffer = await sharp(buffer)
      .webp({ quality: 82, effort: 4 })
      .toBuffer();

    // Ensure uploads directory exists in persistent data folder
    const uploadDir = path.join(process.cwd(), 'data', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const fileName = `product_${Date.now()}_${Math.floor(Math.random() * 1000)}.webp`;
    const filePath = path.join(uploadDir, fileName);

    // Write WebP file to disk
    await fs.promises.writeFile(filePath, webpBuffer);

    const publicUrl = `/uploads/${fileName}`;

    return NextResponse.json({
      success: true,
      message: 'ছবি সফলভাবে WebP ফরম্যাটে আপলোড করা হয়েছে!',
      url: publicUrl,
    });
  } catch (error: any) {
    console.error('Upload Error:', error);
    return NextResponse.json(
      { error: 'ছবি প্রসেস ও আপলোড করতে সমস্যা হয়েছে' },
      { status: 500 }
    );
  }
}
