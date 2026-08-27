import { NextResponse } from 'next/server';
import { z } from 'zod';
import { updateOrderStatus } from '@/lib/woocommerce/orders';
import { handleApiError } from '@/lib/api-error';
import { requireAuth } from '@/lib/auth/api-guard';

const updateSchema = z.object({
  status: z.enum([
    'pending',
    'processing',
    'on-hold',
    'completed',
    'cancelled',
    'refunded',
    'failed',
  ]),
});

function parseId(params: { id: string }): number | null {
  const id = parseInt(params.id, 10);
  return Number.isFinite(id) && id > 0 ? id : null;
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAuth();
  if (denied) return denied;

  try {
    const { id: rawId } = await params;
    const id = parseId({ id: rawId });
    if (!id) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_ID', message: 'Invalid order ID.' } },
        { status: 400 }
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_BODY', message: 'Request body must be valid JSON.' } },
        { status: 400 }
      );
    }

    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: parsed.error.issues[0]?.message ?? 'Validation failed.',
          },
        },
        { status: 422 }
      );
    }

    const order = await updateOrderStatus(id, parsed.data.status);
    return NextResponse.json({ success: true, data: order });
  } catch (err) {
    return handleApiError(err, 'PUT /api/orders/[id]');
  }
}
