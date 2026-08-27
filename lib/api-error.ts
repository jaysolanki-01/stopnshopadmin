import { NextResponse } from 'next/server';
import type { WCApiError } from '@/lib/woocommerce/client';

// Maps known WooCommerce error codes to client-safe messages
const WC_ERROR_MAP: Record<string, { code: string; message: string; status: number }> = {
  woocommerce_rest_product_invalid_sku: {
    code: 'DUPLICATE_SKU',
    message: 'This SKU is already being used by another product.',
    status: 409,
  },
  woocommerce_rest_invalid_term: {
    code: 'INVALID_CATEGORY',
    message: 'One or more selected categories are invalid.',
    status: 422,
  },
};

export function handleApiError(err: unknown, context = 'API') {
  console.error(`[${context}]`, JSON.stringify(err));

  if (err && typeof err === 'object') {
    const e = err as Partial<WCApiError>;

    if (e.status === 401 || e.status === 403) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication failed. Check WooCommerce API credentials.' } },
        { status: 502 }
      );
    }

    const wcCode = e.body?.code;
    if (wcCode && WC_ERROR_MAP[wcCode]) {
      const mapped = WC_ERROR_MAP[wcCode];
      return NextResponse.json(
        { success: false, error: { code: mapped.code, message: mapped.message } },
        { status: mapped.status }
      );
    }

    if (e.status && e.status >= 400 && e.status < 500) {
      return NextResponse.json(
        { success: false, error: { code: 'BAD_REQUEST', message: e.body?.message ?? 'Invalid request.' } },
        { status: 422 }
      );
    }
  }

  return NextResponse.json(
    { success: false, error: { code: 'SERVER_ERROR', message: 'Something went wrong. Please try again.' } },
    { status: 500 }
  );
}

export function normalizeError(err: unknown): string {
  if (err && typeof err === 'object') {
    const e = err as { body?: { message?: string; code?: string }; message?: string };
    if (e.body?.message) return `[${e.body.code ?? 'WC'}] ${e.body.message}`;
    if (e.message) return e.message;
  }
  if (err instanceof Error) return err.message;
  return String(err);
}
