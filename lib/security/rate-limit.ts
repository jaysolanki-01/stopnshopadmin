// In-memory sliding-window rate limiter. Suitable for single-process deployments.
// For multi-process deployments, replace with Redis-backed limiter.

interface Entry {
  count: number;
  resetAt: number;
}

const store = new Map<string, Entry>();

// Prune expired entries periodically to prevent memory leak
let lastPrune = Date.now();
const PRUNE_INTERVAL = 60_000;

function prune() {
  const now = Date.now();
  if (now - lastPrune < PRUNE_INTERVAL) return;
  lastPrune = now;
  for (const [key, entry] of store) {
    if (entry.resetAt <= now) store.delete(key);
  }
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number,
): RateLimitResult {
  prune();
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1, resetAt: now + windowMs };
  }

  entry.count++;
  if (entry.count > maxRequests) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  return { allowed: true, remaining: maxRequests - entry.count, resetAt: entry.resetAt };
}

// Preset: login endpoint — 5 attempts per 15 minutes per IP
export function checkLoginLimit(ip: string): RateLimitResult {
  return checkRateLimit(`login:${ip}`, 5, 15 * 60 * 1000);
}

// Preset: general API — 120 requests per minute per IP
export function checkApiLimit(ip: string): RateLimitResult {
  return checkRateLimit(`api:${ip}`, 120, 60 * 1000);
}
