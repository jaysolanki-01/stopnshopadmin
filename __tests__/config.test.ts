import { describe, it, expect } from 'vitest';
import { CURRENCY, PAGINATION, PRODUCT_IMAGE } from '@/lib/config';

describe('app config', () => {
  it('uses INR currency', () => {
    expect(CURRENCY.symbol).toBe('₹');
    expect(CURRENCY.code).toBe('INR');
  });

  it('has reasonable pagination defaults', () => {
    expect(PAGINATION.defaultPerPage).toBe(20);
    expect(PAGINATION.options).toContain(20);
    expect(PAGINATION.options).toContain(50);
    expect(PAGINATION.options).toContain(100);
  });

  it('has image config constraints', () => {
    expect(PRODUCT_IMAGE.maxSizeMB).toBe(10);
    expect(PRODUCT_IMAGE.maxSizeBytes).toBe(10 * 1024 * 1024);
    expect(PRODUCT_IMAGE.acceptedTypes).toContain('image/jpeg');
    expect(PRODUCT_IMAGE.acceptedTypes).toContain('image/png');
    expect(PRODUCT_IMAGE.acceptedTypes).toContain('image/webp');
  });
});
