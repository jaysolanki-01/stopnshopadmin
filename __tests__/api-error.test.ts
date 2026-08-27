import { describe, it, expect } from 'vitest';
import { handleApiError } from '@/lib/api-error';

describe('handleApiError', () => {
  it('maps WooCommerce duplicate SKU error', async () => {
    const err = {
      status: 400,
      body: { code: 'woocommerce_rest_product_invalid_sku', message: 'SKU already exists' },
    };
    const res = handleApiError(err);
    const data = await res.json();
    expect(res.status).toBe(409);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe('DUPLICATE_SKU');
  });

  it('maps 401 WooCommerce auth errors to 502', async () => {
    const err = { status: 401, body: { code: 'UNAUTHORIZED' } };
    const res = handleApiError(err);
    expect(res.status).toBe(502);
    const data = await res.json();
    expect(data.error.code).toBe('UNAUTHORIZED');
  });

  it('returns generic 500 for unknown errors', async () => {
    const res = handleApiError(new Error('something broke'));
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error.code).toBe('SERVER_ERROR');
    expect(data.error.message).toBe('Something went wrong. Please try again.');
  });

  it('never leaks WooCommerce internal info in generic errors', async () => {
    const err = { status: 500, body: { code: 'internal_error', message: 'MySQL connection failed at row 42' } };
    const res = handleApiError(err);
    const data = await res.json();
    expect(data.error.message).not.toContain('MySQL');
  });

  it('maps 4xx errors to 422 with safe message', async () => {
    const err = { status: 422, body: { code: 'rest_error', message: 'Invalid field value' } };
    const res = handleApiError(err);
    expect(res.status).toBe(422);
    const data = await res.json();
    expect(data.error.code).toBe('BAD_REQUEST');
  });
});
