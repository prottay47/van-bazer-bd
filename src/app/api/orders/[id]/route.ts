import { NextResponse } from 'next/server';
import { db } from '@/db';
import { orders } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { isAdminAuthenticated } from '@/lib/auth';

// Update order status (Admin Only)
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const isAuth = await isAdminAuthenticated();
    if (!isAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { status, notes } = await req.json();
    const orderId = params.id;

    if (!orderId) {
      return NextResponse.json({ error: 'Invalid Order ID' }, { status: 400 });
    }

    const updateData: Record<string, any> = {};
    if (status) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;

    await db.update(orders).set(updateData).where(eq(orders.id, orderId));

    return NextResponse.json({ success: true, message: 'অর্ডার স্ট্যাটাস আপডেট হয়েছে!' });
  } catch (error: any) {
    console.error('Update Order Error:', error);
    return NextResponse.json(
      { error: 'অর্ডার আপডেট করতে সমস্যা হয়েছে' },
      { status: 500 }
    );
  }
}

// Delete order (Admin Only)
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const isAuth = await isAdminAuthenticated();
    if (!isAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orderId = params.id;
    if (!orderId) {
      return NextResponse.json({ error: 'Invalid Order ID' }, { status: 400 });
    }

    await db.delete(orders).where(eq(orders.id, orderId));

    return NextResponse.json({ success: true, message: 'অর্ডার মুছে ফেলা হয়েছে!' });
  } catch (error: any) {
    console.error('Delete Order Error:', error);
    return NextResponse.json(
      { error: 'অর্ডার ডিলেট করতে সমস্যা হয়েছে' },
      { status: 500 }
    );
  }
}
