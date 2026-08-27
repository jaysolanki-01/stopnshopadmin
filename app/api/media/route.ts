import { NextResponse } from 'next/server';
import { uploadMedia } from '@/lib/woocommerce/media';
import { handleApiError } from '@/lib/api-error';
import { PRODUCT_IMAGE } from '@/lib/config';
import { requireAuth } from '@/lib/auth/api-guard';

// Allowed MIME types — validated server-side (never trust browser Content-Type alone)
const ALLOWED_MIME: ReadonlySet<string> = new Set(PRODUCT_IMAGE.acceptedTypes);

// Magic byte signatures for server-side file-type verification
const MAGIC: Array<{ bytes: number[]; mime: string }> = [
  { bytes: [0xff, 0xd8, 0xff],             mime: 'image/jpeg' },
  { bytes: [0x89, 0x50, 0x4e, 0x47],       mime: 'image/png' },
  { bytes: [0x52, 0x49, 0x46, 0x46],       mime: 'image/webp' }, // RIFF....WEBP
];

function detectMime(buf: Buffer): string | null {
  for (const sig of MAGIC) {
    if (sig.bytes.every((b, i) => buf[i] === b)) return sig.mime;
  }
  return null;
}

export async function POST(request: Request) {
  const denied = await requireAuth();
  if (denied) return denied;

  try {
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_REQUEST', message: 'Expected multipart/form-data.' } },
        { status: 400 },
      );
    }

    const file = formData.get('file');
    if (!(file instanceof File)) {
      return NextResponse.json(
        { success: false, error: { code: 'NO_FILE', message: 'No image file provided.' } },
        { status: 400 },
      );
    }

    // ── Size check ────────────────────────────────────────────────────────────
    if (file.size === 0) {
      return NextResponse.json(
        { success: false, error: { code: 'EMPTY_FILE', message: 'The uploaded file is empty.' } },
        { status: 422 },
      );
    }

    if (file.size > PRODUCT_IMAGE.maxSizeBytes) {
      const maxMB = PRODUCT_IMAGE.maxSizeMB;
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FILE_TOO_LARGE',
            message: `File is too large. Maximum allowed size is ${maxMB}MB.`,
          },
        },
        { status: 422 },
      );
    }

    // ── Read buffer ───────────────────────────────────────────────────────────
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // ── Magic-byte MIME verification (prevents MIME-type spoofing) ────────────
    const detectedMime = detectMime(buffer);
    if (!detectedMime || !ALLOWED_MIME.has(detectedMime)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_FILE_TYPE',
            message: 'Unsupported image format. Please upload a JPG, PNG or WebP file.',
          },
        },
        { status: 422 },
      );
    }

    // ── Upload to WordPress Media Library ─────────────────────────────────────
    const result = await uploadMedia(buffer, detectedMime, file.name);

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (err) {
    return handleApiError(err, 'POST /api/media');
  }
}
