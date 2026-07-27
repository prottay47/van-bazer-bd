import { NextResponse } from 'next/server';
import { db } from '@/db';
import { products } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';
import { isAdminAuthenticated } from '@/lib/auth';

// GET all products
export async function GET() {
  try {
    const productList = await db.select().from(products).orderBy(desc(products.createdAt));
    return NextResponse.json({ success: true, products: productList });
  } catch (error: any) {
    return NextResponse.json({ error: 'প্রোডাক্ট লোড করতে সমস্যা হয়েছে' }, { status: 500 });
  }
}

// POST new product (Admin Only)
export async function POST(req: Request) {
  try {
    const isAuth = await isAdminAuthenticated();
    if (!isAuth) {
      return NextResponse.json({ error: 'অনুমতি নেই' }, { status: 401 });
    }

    const body = await req.json();
    const { code, title, regularPrice, offerPrice, image } = body;

    if (!code || !title || !image) {
      return NextResponse.json({ error: 'সব প্রয়োজনীয় ফিল্ড পূরণ করুন' }, { status: 400 });
    }

    const id = `mat_${Date.now()}`;
    const newProduct = {
      id,
      code,
      title,
      regularPrice: Number(regularPrice) || 450,
      offerPrice: Number(offerPrice) || 250,
      image,
      inStock: 1,
      createdAt: new Date().toISOString(),
    };

    await db.insert(products).values(newProduct);

    return NextResponse.json({
      success: true,
      message: 'প্রোডাক্ট সফলভাবে যোগ করা হয়েছে!',
      product: newProduct,
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'প্রোডাক্ট যুক্ত করতে সমস্যা হয়েছে' }, { status: 500 });
  }
}
