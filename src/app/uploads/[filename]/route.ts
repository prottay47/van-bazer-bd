import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

const MIME_TYPES: Record<string, string> = {
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.avif': 'image/avif',
};

export async function GET(
  req: Request,
  { params }: { params: { filename: string } }
) {
  const { filename } = params;
  const safeFilename = path.basename(filename);
  const filePath = path.join(process.cwd(), 'data', 'uploads', safeFilename);

  try {
    // stat দিয়ে একবারেই size + mtime পাওয়া যায়, existsSync এর মত event loop block করে না
    const stat = await fs.promises.stat(filePath);
    if (!stat.isFile()) {
      return new NextResponse('File not found', { status: 404 });
    }

    const etag = `"${stat.size}-${stat.mtimeMs}"`;

    // Browser এর কাছে already থাকলে body পাঠানোর দরকার নেই
    if (req.headers.get('if-none-match') === etag) {
      return new NextResponse(null, {
        status: 304,
        headers: {
          ETag: etag,
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      });
    }

    const ext = path.extname(safeFilename).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    // পুরো ফাইল RAM এ না তুলে stream করা হয়
    const nodeStream = fs.createReadStream(filePath);
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        nodeStream.on('data', (chunk) => {
          controller.enqueue(new Uint8Array(chunk as Buffer));
        });
        nodeStream.on('end', () => controller.close());
        nodeStream.on('error', (err) => controller.error(err));
      },
      cancel() {
        nodeStream.destroy();
      },
    });

    return new NextResponse(body, {
      headers: {
        'Content-Type': contentType,
        'Content-Length': String(stat.size),
        'Cache-Control': 'public, max-age=31536000, immutable',
        ETag: etag,
        'Accept-Ranges': 'bytes',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error: any) {
    if (error?.code === 'ENOENT') {
      return new NextResponse('File not found', { status: 404 });
    }
    return new NextResponse('Error reading file', { status: 500 });
  }
}
