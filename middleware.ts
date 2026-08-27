import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, SESSION_COOKIE } from '@/lib/auth/session';

const SECURITY_HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public paths that don't require auth
  const isPublic =
    pathname === '/login' ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/_next/') ||
    pathname === '/favicon.ico';

  // API routes handle their own auth via requireAuth() — return 401 JSON, not a redirect
  const isApiRoute = pathname.startsWith('/api/');

  if (!isPublic && !isApiRoute) {
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    const valid = token ? await verifyToken(token) : false;

    if (!valid) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('from', pathname);
      const redirect = NextResponse.redirect(loginUrl);
      for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
        redirect.headers.set(key, value);
      }
      return redirect;
    }
  }

  const response = NextResponse.next();
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }
  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|icon\\.svg|.*\\.(?:jpg|jpeg|png|gif|svg|webp|ico)$).*)',
  ],
};
