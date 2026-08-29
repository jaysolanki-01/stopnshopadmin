import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getProduct, updateProduct, deleteProduct } from '@/lib/woocommerce/products';
import { handleApiError } from '@/lib/api-error';
import { sanitizeHtml } from '@/lib/security/sanitize-html';
import { requireAuth } from '@/lib/auth/api-guard';

const updateSchema = z.object({
  name: z.string().min(1).max(200).trim().optional(),
  status: z.enum(['publish', 'draft']).optional(),
  sku: z.string().max(100).optional(),
  regular_price: z.string().regex(/^\d*\.?\d*$/).optional(),
  sale_price: z.string().regex(/^\d*\.?\d*$/).optional(),
  description: z.string().optional(),
  short_description: z.string().optional(),
  categories: z.array(z.object({ id: z.number().int().positive() })).optional(),
  images: z
    .array(
      z.object({
        id: z.number().int().positive().optional(),
        src: z.string().url().optional(),
        alt: z.string().max(300).optional(),
      })
    )
    .optional(),
  attributes: z.array(z.object({
    id: z.number().int().positive(),
    visible: z.boolean().optional(),
    options: z.array(z.string()),
  })).optional(),
  manage_stock: z.boolean().optional(),
  stock_quantity: z.number().int().min(0).nullable().optional(),
  stock_status: z.enum(['instock', 'outofstock', 'onbackorder']).optional(),
  backorders: z.enum(['no', 'notify', 'yes']).optional(),
  low_stock_amount: z.number().int().min(0).nullable().optional(),
  sold_individually: z.boolean().optional(),
});

function parseId(params: { id: string }): number | null {
  const id = parseInt(params.id, 10);
  return Number.isFinite(id) && id > 0 ? id : null;
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAuth();
  if (denied) return denied;

  try {
    const { id: rawId } = await params;
    const id = parseId({ id: rawId });
    if (!id) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_ID', message: 'Invalid product ID.' } },
        { status: 400 }
      );
    }

    const product = await getProduct(id);
    return NextResponse.json({ success: true, data: product });
  } catch (err) {
    return handleApiError(err, 'GET /api/products/[id]');
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAuth();
  if (denied) return denied;

  try {
    const { id: rawId } = await params;
    const id = parseId({ id: rawId });
    if (!id) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_ID', message: 'Invalid product ID.' } },
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

    // Sanitize HTML fields before sending to WooCommerce
    const sanitized = {
      ...parsed.data,
      description: parsed.data.description !== undefined ? sanitizeHtml(parsed.data.description) : undefined,
      short_description: parsed.data.short_description !== undefined ? sanitizeHtml(parsed.data.short_description) : undefined,
    };

    const product = await updateProduct(id, sanitized);
    return NextResponse.json({ success: true, data: product });
  } catch (err) {
    return handleApiError(err, 'PUT /api/products/[id]');
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAuth();
  if (denied) return denied;

  try {
    const { id: rawId } = await params;
    const id = parseId({ id: rawId });
    if (!id) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_ID', message: 'Invalid product ID.' } },
        { status: 400 }
      );
    }

    const product = await deleteProduct(id, false); // move to trash, not permanent delete
    return NextResponse.json({ success: true, data: product });
  } catch (err) {
    return handleApiError(err, 'DELETE /api/products/[id]');
  }
}
