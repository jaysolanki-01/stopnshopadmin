// Uses Web Crypto API throughout — compatible with Edge (middleware) and Node.js runtimes

const ALGORITHM = { name: 'HMAC', hash: 'SHA-256' } as const;

export const SESSION_COOKIE = 'admin_session';
export const SESSION_MAX_AGE = 8 * 60 * 60; // 8 hours in seconds

function requireSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('SESSION_SECRET must be set and at least 32 characters.');
  }
  return secret;
}

async function importKey(secret: string): Promise<CryptoKey> {
  return globalThis.crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    ALGORITHM,
    false,
    ['sign', 'verify'],
  );
}

// Encodes an ArrayBuffer or Uint8Array to base64url (no padding)
function toBase64Url(input: ArrayBuffer | Uint8Array): string {
  const arr = input instanceof Uint8Array ? input : new Uint8Array(input);
  let str = '';
  for (let i = 0; i < arr.length; i++) str += String.fromCharCode(arr[i]);
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// Decodes a base64url string back to Uint8Array
function fromBase64Url(str: string): Uint8Array {
  const padded = str.padEnd(str.length + ((4 - (str.length % 4)) % 4), '=');
  const binary = atob(padded.replace(/-/g, '+').replace(/_/g, '/'));
  const arr = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) arr[i] = binary.charCodeAt(i);
  return arr;
}

// Token format: <base64url_payload>.<base64url_hmac>
// Payload: JSON { exp: unix_ms }

export async function createToken(): Promise<string> {
  const secret = requireSecret();
  const payload = toBase64Url(
    new TextEncoder().encode(
      JSON.stringify({ exp: Date.now() + SESSION_MAX_AGE * 1000 }),
    ),
  );
  const key = await importKey(secret);
  const sig = await globalThis.crypto.subtle.sign(
    ALGORITHM,
    key,
    new TextEncoder().encode(payload),
  );
  return `${payload}.${toBase64Url(sig)}`;
}

export async function verifyToken(token: string): Promise<boolean> {
  const secret = process.env.SESSION_SECRET;
  if (!secret) return false;

  const dot = token.lastIndexOf('.');
  if (dot === -1) return false;

  const payload = token.slice(0, dot);
  const sigStr = token.slice(dot + 1);

  try {
    const key = await importKey(secret);
    const valid = await globalThis.crypto.subtle.verify(
      ALGORITHM,
      key,
      fromBase64Url(sigStr) as BufferSource,
      new TextEncoder().encode(payload) as BufferSource,
    );
    if (!valid) return false;

    const { exp } = JSON.parse(new TextDecoder().decode(fromBase64Url(payload)));
    return typeof exp === 'number' && exp > Date.now();
  } catch {
    return false;
  }
}
