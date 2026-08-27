// SERVER-SIDE ONLY — WordPress Media Library via wp/v2/media
import { wpFetch, wpFetchRaw } from './client';
import type { WCMediaItem, MediaUploadResult } from '@/types/woocommerce';

// Sanitise a user-supplied filename before including it in an HTTP header
function sanitiseFilename(raw: string): string {
  const base = raw.split(/[/\\]/).pop() ?? raw; // strip path separators
  return (
    base
      .toLowerCase()
      .replace(/[^a-z0-9._-]/g, '-')
      .replace(/-{2,}/g, '-')
      .replace(/^-|-$/, '')
      .substring(0, 100) || 'image'
  );
}

// Upload a single image buffer to the WordPress Media Library.
// Returns a minimal result object safe to return to the browser.
export async function uploadMedia(
  buffer: Buffer,
  mimeType: string,
  originalFilename: string,
): Promise<MediaUploadResult> {
  const filename = sanitiseFilename(originalFilename);

  const response = await wpFetchRaw('/media', {
    method: 'POST',
    rawBody: new Uint8Array(buffer),
    contentType: mimeType,
    filename,
  });

  const media = (await response.json()) as WCMediaItem;

  return {
    id: media.id,
    src: media.source_url,
    alt: media.alt_text ?? '',
  };
}

// Fetch metadata for an existing media item
export async function getMediaItem(id: number): Promise<WCMediaItem> {
  return wpFetch<WCMediaItem>(`/media/${id}`);
}
