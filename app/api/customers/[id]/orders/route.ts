import { NextResponse } from 'next/server';
import { getOrdersByCustomer } from '@/lib/woocommerce/orders';
import { handleApiError } from '@/lib/api-error';
import { requireAuth } from '@/lib/auth/api-guard';

function parseId(params: { id: string }): number | null {
  const id = parseInt(params.id, 10);
  return Number.isFinite(id) && id > 0 ? id : null;
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAuth();
  if (denied) return denied;

  try {
    const { id: rawId } = await params;
    const id = parseId({ id: rawId });
    if (!id) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_ID', message: 'Invalid customer ID.' } },
        { status: 400 }
      );
    }

    const orders = await getOrdersByCustomer(id);
    return NextResponse.json({ success: true, data: orders });
  } catch (err) {
    return handleApiError(err, 'GET /api/customers/[id]/orders');
  }
}
