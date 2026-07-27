import { NextResponse } from 'next/server';
import { db } from '@/db';
import { products } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { isAdminAuthenticated } from '@/lib/auth';

// PATCH update product (stock toggle or price/details update)
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const isAuth = await isAdminAuthenticated();
    if (!isAuth) {
      return NextResponse.json({ error: 'অনুমতি নেই' }, { status: 401 });
    }

    const { id } = params;
    const body = await req.json();

    await db.update(products).set(body).where(eq(products.id, id));

    return NextResponse.json({
      success: true,
      message: 'প্রোডাক্ট আপডেট সম্পন্ন হয়েছে!',
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'প্রোডাক্ট আপডেট করতে সমস্যা হয়েছে' }, { status: 500 });
  }
}

// DELETE product
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const isAuth = await isAdminAuthenticated();
    if (!isAuth) {
      return NextResponse.json({ error: 'অনুমতি নেই' }, { status: 401 });
    }

    const { id } = params;
    await db.delete(products).where(eq(products.id, id));

    return NextResponse.json({
      success: true,
      message: 'প্রোডাক্ট সফলভাবে ডিলেট করা হয়েছে!',
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'প্রোডাক্ট ডিলেট করতে সমস্যা হয়েছে' }, { status: 500 });
  }
}
