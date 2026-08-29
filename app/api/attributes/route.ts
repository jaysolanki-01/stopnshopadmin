import { NextResponse } from 'next/server';
import { getAttributesWithTerms } from '@/lib/woocommerce/attributes';
import { handleApiError } from '@/lib/api-error';
import { requireAuth } from '@/lib/auth/api-guard';

export async function GET() {
  const denied = await requireAuth();
  if (denied) return denied;

  try {
    const attributes = await getAttributesWithTerms();
    return NextResponse.json({ success: true, data: attributes });
  } catch (err) {
    return handleApiError(err, 'GET /api/attributes');
  }
}
