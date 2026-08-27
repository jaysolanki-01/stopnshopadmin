import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCustomersWithMeta } from '@/lib/woocommerce/customers';
import { handleApiError } from '@/lib/api-error';
import { requireAuth } from '@/lib/auth/api-guard';

const querySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  per_page: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().max(200).optional(),
  orderby: z.enum(['registered_date', 'id', 'name', 'email']).default('registered_date'),
  order: z.enum(['asc', 'desc']).default('desc'),
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

    const result = await getCustomersWithMeta(parsed.data);
    return NextResponse.json({
      success: true,
      data: result.customers,
      meta: { total: result.total, totalPages: result.totalPages },
    });
  } catch (err) {
    return handleApiError(err, 'GET /api/customers');
  }
}
