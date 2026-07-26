import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const SECRET_KEY = new TextEncoder().encode(
  process.env.ADMIN_JWT_SECRET || 'van-bazer-bd-secure-secret-key-2026'
);

export async function signAdminToken() {
  return await new SignJWT({ role: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(SECRET_KEY);
}

export async function verifyAdminToken(token: string) {
  try {
    const verified = await jwtVerify(token, SECRET_KEY);
    return verified.payload;
  } catch (err) {
    return null;
  }
}

export async function isAdminAuthenticated() {
  const cookieStore = cookies();
  const token = cookieStore.get('admin_token')?.value;
  if (!token) return false;

  const payload = await verifyAdminToken(token);
  return !!payload;
}
