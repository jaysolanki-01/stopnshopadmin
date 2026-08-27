import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken, SESSION_COOKIE } from './session';

// Call at the top of any API route handler to verify authentication.
// Returns null if authenticated, or a 401 response to return immediately.
export async function requireAuth(): Promise<NextResponse | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token || !(await verifyToken(token))) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required.' } },
      { status: 401 },
    );
  }
  return null;
}
