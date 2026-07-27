import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

export async function GET(
  req: Request,
  { params }: { params: { filename: string } }
) {
  try {
    const { filename } = params;
    const safeFilename = path.basename(filename);
    const filePath = path.join(process.cwd(), 'data', 'uploads', safeFilename);

    if (!fs.existsSync(filePath)) {
      return new NextResponse('File not found', { status: 404 });
    }

    const fileBuffer = await fs.promises.readFile(filePath);

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'image/webp',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    return new NextResponse('Error reading file', { status: 500 });
  }
}
