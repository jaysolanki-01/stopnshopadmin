import { describe, it, expect } from 'vitest';

// Replicate the magic-byte detection from app/api/media/route.ts for unit testing
const MAGIC: Array<{ bytes: number[]; mime: string }> = [
  { bytes: [0xff, 0xd8, 0xff], mime: 'image/jpeg' },
  { bytes: [0x89, 0x50, 0x4e, 0x47], mime: 'image/png' },
  { bytes: [0x52, 0x49, 0x46, 0x46], mime: 'image/webp' },
];

function detectMime(buf: Buffer): string | null {
  for (const sig of MAGIC) {
    if (sig.bytes.every((b, i) => buf[i] === b)) return sig.mime;
  }
  return null;
}

describe('magic-byte MIME detection', () => {
  it('detects JPEG', () => {
    const buf = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
    expect(detectMime(buf)).toBe('image/jpeg');
  });

  it('detects PNG', () => {
    const buf = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a]);
    expect(detectMime(buf)).toBe('image/png');
  });

  it('detects WebP (RIFF header)', () => {
    const buf = Buffer.from([0x52, 0x49, 0x46, 0x46, 0x00, 0x00]);
    expect(detectMime(buf)).toBe('image/webp');
  });

  it('returns null for unknown file types', () => {
    const buf = Buffer.from([0x00, 0x00, 0x00, 0x00]);
    expect(detectMime(buf)).toBeNull();
  });

  it('returns null for empty buffer', () => {
    const buf = Buffer.from([]);
    expect(detectMime(buf)).toBeNull();
  });

  it('rejects a .exe disguised with wrong extension', () => {
    // MZ header for PE executables
    const buf = Buffer.from([0x4d, 0x5a, 0x90, 0x00]);
    expect(detectMime(buf)).toBeNull();
  });

  it('rejects PDF files', () => {
    // %PDF header
    const buf = Buffer.from([0x25, 0x50, 0x44, 0x46]);
    expect(detectMime(buf)).toBeNull();
  });
});
