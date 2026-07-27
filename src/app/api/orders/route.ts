import { NextResponse } from 'next/server';
import { db } from '@/db';
import { orders } from '@/db/schema';
import { desc, eq, and } from 'drizzle-orm';
import { isAdminAuthenticated } from '@/lib/auth';

const PRODUCT_DETAILS = {
  name: '3D ডিজাইনের সফট ফ্লোর ম্যাট',
  insideDhakaCharge: 70,
  outsideDhakaCharge: 130,
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { customerName, phone, address, deliveryZone, selectedItems } = body;

    // Form Validation
    if (!customerName || !phone || !address || !deliveryZone) {
      return NextResponse.json(
        { error: 'সকল প্রয়োজনীয় তথ্য (নাম, ফোন নম্বর ও ঠিকানা) পূরণ করুন' },
        { status: 400 }
      );
    }

    if (!selectedItems || !Array.isArray(selectedItems) || selectedItems.length === 0) {
      return NextResponse.json(
        { error: 'কমপক্ষে ১টি ডিজাইন সিলেক্ট করুন' },
        { status: 400 }
      );
    }

    let subtotal = 0;
    let totalQuantity = 0;

    selectedItems.forEach((item: any) => {
      const qty = Math.max(1, Number(item.quantity) || 1);
      const price = Number(item.price) || 250;
      subtotal += price * qty;
      totalQuantity += qty;
    });

    let deliveryCharge = Number(body.deliveryCharge);
    if (!deliveryCharge || isNaN(deliveryCharge)) {
      if (deliveryZone === 'inside_dhaka') {
        deliveryCharge = 70;
      } else if (deliveryZone === 'sub_dhaka') {
        deliveryCharge = 100;
      } else {
        deliveryCharge = 130;
      }
    }
    const totalPrice = subtotal + deliveryCharge;

    const timestamp = Date.now();
    const randomNum = Math.floor(100 + Math.random() * 900);
    const id = `ord_${timestamp}_${randomNum}`;
    const orderNumber = `VB-${Math.floor(1000 + Math.random() * 9000)}`;

    const newOrder = {
      id,
      orderNumber,
      customerName: customerName.trim(),
      phone: phone.trim(),
      address: address.trim(),
      deliveryZone,
      productName: PRODUCT_DETAILS.name,
      selectedItemsJson: JSON.stringify(selectedItems),
      totalQuantity,
      subtotal,
      deliveryCharge,
      totalPrice,
      status: 'Pending',
      notes: '',
      createdAt: new Date().toISOString(),
    };

    // Clean up any incomplete draft for this phone number
    try {
      await db
        .delete(orders)
        .where(and(eq(orders.phone, phone.trim()), eq(orders.status, 'Incomplete')));
    } catch (e) {
      console.error('Error cleaning incomplete draft:', e);
    }

    await db.insert(orders).values(newOrder);

    return NextResponse.json({
      success: true,
      message: 'অর্ডার সফলভাবে সম্পন্ন হয়েছে!',
      order: newOrder,
    });
  } catch (error: any) {
    console.error('Order Error:', error);
    return NextResponse.json(
      { error: 'অর্ডার করতে সমস্যা হয়েছে। দয়া করে আবার চেষ্টা করুন।' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const isAuth = await isAdminAuthenticated();
    if (!isAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const allOrders = await db.select().from(orders).orderBy(desc(orders.createdAt));

    const totalOrders = allOrders.length;
    const totalRevenue = allOrders
      .filter((o) => o.status !== 'Cancelled' && o.status !== 'Incomplete')
      .reduce((sum, o) => sum + o.totalPrice, 0);

    const pendingOrders = allOrders.filter((o) => o.status === 'Pending').length;
    const confirmedOrders = allOrders.filter((o) => o.status === 'Confirmed').length;
    const shippedOrders = allOrders.filter((o) => o.status === 'Shipped').length;
    const cancelledOrders = allOrders.filter((o) => o.status === 'Cancelled').length;
    const incompleteOrders = allOrders.filter((o) => o.status === 'Incomplete').length;

    const todayStr = new Date().toISOString().split('T')[0];
    const todayOrders = allOrders.filter((o) => o.createdAt.startsWith(todayStr));
    const todayRevenue = todayOrders
      .filter((o) => o.status !== 'Cancelled' && o.status !== 'Incomplete')
      .reduce((sum, o) => sum + o.totalPrice, 0);

    return NextResponse.json({
      orders: allOrders,
      stats: {
        totalOrders,
        totalRevenue,
        pendingOrders,
        confirmedOrders,
        shippedOrders,
        cancelledOrders,
        incompleteOrders,
        todayOrdersCount: todayOrders.length,
        todayRevenue,
      },
    });
  } catch (error: any) {
    console.error('Fetch Orders Error:', error);
    return NextResponse.json(
      { error: 'অর্ডার ডাটা আনতে সমস্যা হয়েছে' },
      { status: 500 }
    );
  }
}
