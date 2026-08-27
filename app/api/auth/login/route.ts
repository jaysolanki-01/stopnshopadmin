import { NextResponse } from 'next/server';
import { timingSafeEqual } from 'node:crypto';
import { createToken, SESSION_COOKIE, SESSION_MAX_AGE } from '@/lib/auth/session';
import { checkLoginLimit } from '@/lib/security/rate-limit';

function safeCompare(a: string, b: string): boolean {
  // Pad to same length first so timingSafeEqual doesn't throw; the length check
  // still leaks length difference — acceptable for a single-admin panel
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

export async function POST(request: Request) {
  // Rate limit: 5 attempts per 15 minutes per IP
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? request.headers.get('x-real-ip')
    ?? '127.0.0.1';
  const limit = checkLoginLimit(ip);
  if (!limit.allowed) {
    return NextResponse.json(
      { success: false, error: 'Too many login attempts. Please try again later.' },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid request body.' },
      { status: 400 },
    );
  }

  const password = typeof (body as Record<string, unknown>).password === 'string'
    ? (body as Record<string, unknown>).password as string
    : '';

  const adminPassword = process.env.ADMIN_PASSWORD ?? '';

  if (!adminPassword || !safeCompare(password, adminPassword)) {
    // Always respond after a tiny constant delay to blunt brute-force timing
    await new Promise((r) => setTimeout(r, 200));
    return NextResponse.json(
      { success: false, error: 'Incorrect password.' },
      { status: 401 },
    );
  }

  const token = await createToken();

  const response = NextResponse.json({ success: true });
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: SESSION_MAX_AGE,
    path: '/',
  });
  return response;
}
