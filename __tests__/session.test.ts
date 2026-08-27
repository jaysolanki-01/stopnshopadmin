import { describe, it, expect, beforeEach, vi } from 'vitest';

// Set env vars before importing the module
vi.stubEnv('SESSION_SECRET', 'a'.repeat(64));

const { createToken, verifyToken } = await import('@/lib/auth/session');

describe('session tokens', () => {
  it('creates a valid token', async () => {
    const token = await createToken();
    expect(typeof token).toBe('string');
    expect(token).toContain('.');
    const [payload, sig] = token.split('.');
    expect(payload.length).toBeGreaterThan(0);
    expect(sig.length).toBeGreaterThan(0);
  });

  it('verifies a valid token', async () => {
    const token = await createToken();
    const valid = await verifyToken(token);
    expect(valid).toBe(true);
  });

  it('rejects a tampered token', async () => {
    const token = await createToken();
    const tampered = token.slice(0, -1) + (token.endsWith('a') ? 'b' : 'a');
    const valid = await verifyToken(tampered);
    expect(valid).toBe(false);
  });

  it('rejects an empty token', async () => {
    expect(await verifyToken('')).toBe(false);
  });

  it('rejects a token without a dot', async () => {
    expect(await verifyToken('nodothere')).toBe(false);
  });

  it('rejects garbage input', async () => {
    expect(await verifyToken('abc.def')).toBe(false);
  });
});
