import { describe, it, expect, beforeEach } from 'vitest';
import { checkRateLimit, checkLoginLimit } from '@/lib/security/rate-limit';

describe('checkRateLimit', () => {
  const key = () => `test-${Date.now()}-${Math.random()}`;

  it('allows requests within the limit', () => {
    const k = key();
    const result1 = checkRateLimit(k, 3, 60000);
    expect(result1.allowed).toBe(true);
    expect(result1.remaining).toBe(2);

    const result2 = checkRateLimit(k, 3, 60000);
    expect(result2.allowed).toBe(true);
    expect(result2.remaining).toBe(1);

    const result3 = checkRateLimit(k, 3, 60000);
    expect(result3.allowed).toBe(true);
    expect(result3.remaining).toBe(0);
  });

  it('blocks requests over the limit', () => {
    const k = key();
    checkRateLimit(k, 2, 60000);
    checkRateLimit(k, 2, 60000);

    const result = checkRateLimit(k, 2, 60000);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it('resets after window expires', () => {
    const k = key();
    // Use a 1ms window so it expires immediately
    checkRateLimit(k, 1, 1);
    checkRateLimit(k, 1, 1);

    // Wait for the window to expire
    const start = Date.now();
    while (Date.now() - start < 5) { /* busy wait */ }

    const result = checkRateLimit(k, 1, 1);
    expect(result.allowed).toBe(true);
  });

  it('tracks different keys independently', () => {
    const k1 = key();
    const k2 = key();

    checkRateLimit(k1, 1, 60000);
    const blocked = checkRateLimit(k1, 1, 60000);
    expect(blocked.allowed).toBe(false);

    const other = checkRateLimit(k2, 1, 60000);
    expect(other.allowed).toBe(true);
  });

  it('provides a resetAt timestamp in the future', () => {
    const k = key();
    const result = checkRateLimit(k, 5, 60000);
    expect(result.resetAt).toBeGreaterThan(Date.now());
  });
});

describe('checkLoginLimit', () => {
  it('allows 5 login attempts', () => {
    const ip = `192.168.${Math.random()}.1`;
    for (let i = 0; i < 5; i++) {
      expect(checkLoginLimit(ip).allowed).toBe(true);
    }
    expect(checkLoginLimit(ip).allowed).toBe(false);
  });
});
