import { NextResponse } from 'next/server';
import { signAdminToken } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();
    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin1234';

    if (username !== adminUsername || password !== adminPassword) {
      return NextResponse.json(
        { error: 'ভুল এডমিন ইউজারনেম বা পাসওয়ার্ড!' },
        { status: 401 }
      );
    }

    const token = await signAdminToken();

    const response = NextResponse.json({
      success: true,
      message: 'সফলভাবে লগইন হয়েছে!',
    });

    response.cookies.set('admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return response;
  } catch (error: any) {
    return NextResponse.json(
      { error: 'লগইন করতে সমস্যা হয়েছে' },
      { status: 500 }
    );
  }
}
