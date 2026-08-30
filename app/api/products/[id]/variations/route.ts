import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getVariations, createVariation, updateVariation, deleteVariation } from '@/lib/woocommerce/products';
import { handleApiError } from '@/lib/api-error';
import { requireAuth } from '@/lib/auth/api-guard';

const variationSchema = z.object({
  regular_price: z.string().regex(/^\d*\.?\d*$/).optional(),
  sale_price: z.string().regex(/^\d*\.?\d*$/).optional(),
  sku: z.string().max(100).optional(),
  status: z.enum(['publish', 'private']).optional(),
  manage_stock: z.boolean().optional(),
  stock_quantity: z.number().int().min(0).nullable().optional(),
  stock_status: z.enum(['instock', 'outofstock', 'onbackorder']).optional(),
  attributes: z.array(z.object({
    id: z.number().int().positive(),
    option: z.string(),
  })).optional(),
});

const batchSchema = z.object({
  create: z.array(variationSchema).optional(),
  update: z.array(variationSchema.extend({ id: z.number().int().positive() })).optional(),
  delete: z.array(z.number().int().positive()).optional(),
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
        { status: 400 },
      );
    }

    const variations = await getVariations(id);
    return NextResponse.json({ success: true, data: variations });
  } catch (err) {
    return handleApiError(err, 'GET /api/products/[id]/variations');
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAuth();
  if (denied) return denied;

  try {
    const { id: rawId } = await params;
    const id = parseId({ id: rawId });
    if (!id) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_ID', message: 'Invalid product ID.' } },
        { status: 400 },
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_BODY', message: 'Request body must be valid JSON.' } },
        { status: 400 },
      );
    }

    // Check if it's a batch operation
    const batchParsed = batchSchema.safeParse(body);
    if (batchParsed.success && (batchParsed.data.create || batchParsed.data.update || batchParsed.data.delete)) {
      const results: { created: unknown[]; updated: unknown[]; deleted: unknown[] } = {
        created: [],
        updated: [],
        deleted: [],
      };

      if (batchParsed.data.create) {
        for (const v of batchParsed.data.create) {
          const created = await createVariation(id, v);
          results.created.push(created);
        }
      }

      if (batchParsed.data.update) {
        for (const v of batchParsed.data.update) {
          const { id: vid, ...rest } = v;
          const updated = await updateVariation(id, vid, rest);
          results.updated.push(updated);
        }
      }

      if (batchParsed.data.delete) {
        for (const vid of batchParsed.data.delete) {
          await deleteVariation(id, vid);
          results.deleted.push(vid);
        }
      }

      return NextResponse.json({ success: true, data: results });
    }

    // Single variation create
    const parsed = variationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0]?.message ?? 'Validation failed.' },
        },
        { status: 422 },
      );
    }

    const variation = await createVariation(id, parsed.data);
    return NextResponse.json({ success: true, data: variation }, { status: 201 });
  } catch (err) {
    return handleApiError(err, 'POST /api/products/[id]/variations');
  }
}
