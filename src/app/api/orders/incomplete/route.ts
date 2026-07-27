import { NextResponse } from 'next/server';
import { db } from '@/db';
import { orders } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { customerName, phone, address, deliveryZone, selectedItems } = body;

    const rawPhone = String(phone || '').trim();
    const digitsOnly = rawPhone.replace(/\D/g, '');

    // Strict requirement: Must be an 11-digit phone number
    if (digitsOnly.length !== 11) {
      return NextResponse.json(
        { error: '১১ ডিজিটের মোবাইল নম্বর প্রয়োজন' },
        { status: 400 }
      );
    }

    let subtotal = 0;
    let totalQuantity = 0;

    if (Array.isArray(selectedItems)) {
      selectedItems.forEach((item: any) => {
        const qty = Math.max(1, Number(item.quantity) || 1);
        const price = Number(item.price) || 250;
        subtotal += price * qty;
        totalQuantity += qty;
      });
    }

    let deliveryCharge = Number(body.deliveryCharge);
    if (!deliveryCharge || isNaN(deliveryCharge)) {
      if (deliveryZone === 'inside_dhaka') deliveryCharge = 70;
      else if (deliveryZone === 'sub_dhaka') deliveryCharge = 100;
      else deliveryCharge = 130;
    }
    const totalPrice = subtotal + deliveryCharge;

    // Check if an incomplete order for this phone already exists
    const existing = await db
      .select()
      .from(orders)
      .where(and(eq(orders.phone, rawPhone), eq(orders.status, 'Incomplete')));

    if (existing.length > 0) {
      const targetId = existing[0].id;
      await db
        .update(orders)
        .set({
          customerName: (customerName || '').trim() || 'অসমাপ্ত কাস্টমার',
          address: (address || '').trim() || 'ঠিকানা দেওয়া হয়নি',
          deliveryZone: deliveryZone || 'inside_dhaka',
          selectedItemsJson: JSON.stringify(selectedItems || []),
          totalQuantity: totalQuantity || 1,
          subtotal,
          deliveryCharge,
          totalPrice,
          createdAt: new Date().toISOString(),
        })
        .where(eq(orders.id, targetId));

      return NextResponse.json({ success: true, message: 'অসমাপ্ত অর্ডার তথ্য আপডেট করা হয়েছে' });
    }

    // Insert new incomplete order
    const timestamp = Date.now();
    const randomNum = Math.floor(100 + Math.random() * 900);
    const id = `inc_${timestamp}_${randomNum}`;
    const orderNumber = `INC-${Math.floor(1000 + Math.random() * 9000)}`;

    const newIncomplete = {
      id,
      orderNumber,
      customerName: (customerName || '').trim() || 'অসমাপ্ত কাস্টমার',
      phone: rawPhone,
      address: (address || '').trim() || 'ঠিকানা দেওয়া হয়নি',
      deliveryZone: deliveryZone || 'inside_dhaka',
      productName: '3D ডিজাইনের সফট ফ্লোর ম্যাট',
      selectedItemsJson: JSON.stringify(selectedItems || []),
      totalQuantity: totalQuantity || 1,
      subtotal,
      deliveryCharge,
      totalPrice,
      status: 'Incomplete',
      notes: 'অটো সেভড ইনকমপ্লিট ড্রাফট',
      createdAt: new Date().toISOString(),
    };

    await db.insert(orders).values(newIncomplete);

    return NextResponse.json({ success: true, message: 'অসমাপ্ত অর্ডার ট্র্যাকিং সেভ করা হয়েছে', order: newIncomplete });
  } catch (error: any) {
    console.error('Incomplete Order Error:', error);
    return NextResponse.json({ error: 'অসমাপ্ত অর্ডার ট্র্যাকিং ব্যর্থ হয়েছে' }, { status: 500 });
  }
}
