import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getProducts, createProduct } from '@/lib/woocommerce/products';
import { handleApiError } from '@/lib/api-error';
import { sanitizeHtml } from '@/lib/security/sanitize-html';
import { requireAuth } from '@/lib/auth/api-guard';

const querySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  per_page: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().max(200).optional(),
  status: z.enum(['publish', 'draft', 'pending', 'private', 'any']).optional(),
  category: z.string().optional(),
});

const createSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(200).trim(),
  status: z.enum(['publish', 'draft']).default('draft'),
  sku: z.string().max(100).optional(),
  regular_price: z.string().regex(/^\d*\.?\d*$/, 'Invalid price').optional(),
  sale_price: z.string().regex(/^\d*\.?\d*$/, 'Invalid price').optional(),
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
  manage_stock: z.boolean().optional(),
  stock_quantity: z.number().int().min(0).nullable().optional(),
  stock_status: z.enum(['instock', 'outofstock', 'onbackorder']).optional(),
  backorders: z.enum(['no', 'notify', 'yes']).optional(),
  low_stock_amount: z.number().int().min(0).nullable().optional(),
  sold_individually: z.boolean().optional(),
});

export async function GET(request: Request) {
  const denied = await requireAuth();
  if (denied) return denied;

  try {
    const { searchParams } = new URL(request.url);
    const parsed = querySchema.safeParse(Object.fromEntries(searchParams));

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_PARAMS', message: 'Invalid query parameters.' } },
        { status: 400 }
      );
    }

    const products = await getProducts(parsed.data);
    return NextResponse.json({ success: true, data: products });
  } catch (err) {
    return handleApiError(err, 'GET /api/products');
  }
}

export async function POST(request: Request) {
  const denied = await requireAuth();
  if (denied) return denied;

  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_BODY', message: 'Request body must be valid JSON.' } },
        { status: 400 }
      );
    }

    const parsed = createSchema.safeParse(body);
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
      description: parsed.data.description ? sanitizeHtml(parsed.data.description) : undefined,
      short_description: parsed.data.short_description ? sanitizeHtml(parsed.data.short_description) : undefined,
    };

    const product = await createProduct(sanitized);
    return NextResponse.json({ success: true, data: product }, { status: 201 });
  } catch (err) {
    return handleApiError(err, 'POST /api/products');
  }
}
