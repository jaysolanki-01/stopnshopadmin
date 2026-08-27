import { NextResponse } from 'next/server';
import { getCategories } from '@/lib/woocommerce/categories';
import { handleApiError } from '@/lib/api-error';
import { requireAuth } from '@/lib/auth/api-guard';

// Categories change infrequently — revalidate every 5 minutes
export const revalidate = 300;

export async function GET() {
  const denied = await requireAuth();
  if (denied) return denied;

  try {
    const categories = await getCategories();
    return NextResponse.json({ success: true, data: categories });
  } catch (err) {
    return handleApiError(err, 'GET /api/categories');
  }
}
