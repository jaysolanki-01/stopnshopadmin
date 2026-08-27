'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { UploadedImage, MediaUploadResult } from '@/types/woocommerce';
import { PRODUCT_IMAGE } from '@/lib/config';

interface UseProductImagesReturn {
  images: UploadedImage[];
  isUploading: boolean;
  hasErrors: boolean;
  /** Images that have finished uploading — use these for product creation */
  readyImages: UploadedImage[];
  addFiles: (files: FileList | File[]) => void;
  removeImage: (localId: string) => void;
  reorderImages: (next: UploadedImage[]) => void;
  retryImage: (localId: string) => void;
  updateAlt: (localId: string, alt: string) => void;
  reset: () => void;
}

export function useProductImages(initialImages?: UploadedImage[]): UseProductImagesReturn {
  const [images, setImages] = useState<UploadedImage[]>(initialImages ?? []);
  // Track blob URLs created so we can revoke them on cleanup
  const blobUrls = useRef<Set<string>>(new Set());

  // Cleanup all blob URLs when the component unmounts
  useEffect(() => {
    const urls = blobUrls.current;
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  const uploadFile = useCallback(async (file: File, localId: string) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/media', { method: 'POST', body: formData });
      const data = (await res.json()) as
        | { success: true; data: MediaUploadResult }
        | { success: false; error: { code: string; message: string } };

      setImages((prev) =>
        prev.map((img) => {
          if (img.localId !== localId) return img;
          if (data.success) {
            return {
              ...img,
              status: 'done',
              mediaId: data.data.id,
              src: data.data.src,
              alt: data.data.alt,
            };
          }
          return { ...img, status: 'error', error: data.error.message };
        }),
      );
    } catch {
      setImages((prev) =>
        prev.map((img) =>
          img.localId === localId
            ? { ...img, status: 'error', error: 'Network error. Please try again.' }
            : img,
        ),
      );
    }
  }, []);

  const addFiles = useCallback(
    (files: FileList | File[]) => {
      const fileArray = Array.from(files);

      // Client-side pre-filter (server validates too — defence in depth)
      const valid = fileArray.filter((f) => {
        if (
          !PRODUCT_IMAGE.acceptedTypes.includes(
            f.type as (typeof PRODUCT_IMAGE.acceptedTypes)[number],
          )
        )
          return false;
        if (f.size > PRODUCT_IMAGE.maxSizeBytes) return false;
        return true;
      });

      if (valid.length === 0) return;

      const newImages: UploadedImage[] = valid.map((file) => {
        const blobUrl = URL.createObjectURL(file);
        blobUrls.current.add(blobUrl);
        return {
          localId: crypto.randomUUID(),
          previewUrl: blobUrl,
          filename: file.name,
          status: 'uploading',
          alt: '',
          _file: file,
        };
      });

      setImages((prev) => [...prev, ...newImages]);

      // Upload each file independently and in parallel
      newImages.forEach((img, i) => uploadFile(valid[i], img.localId));
    },
    [uploadFile],
  );

  const removeImage = useCallback((localId: string) => {
    setImages((prev) => {
      const img = prev.find((i) => i.localId === localId);
      if (img?.previewUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(img.previewUrl);
        blobUrls.current.delete(img.previewUrl);
      }
      return prev.filter((i) => i.localId !== localId);
    });
  }, []);

  const reorderImages = useCallback((next: UploadedImage[]) => {
    setImages(next);
  }, []);

  const retryImage = useCallback(
    (localId: string) => {
      setImages((prev) => {
        const img = prev.find((i) => i.localId === localId);
        if (!img?._file) return prev;

        // Reset to uploading state, then re-upload
        const updated = prev.map((i) =>
          i.localId === localId ? { ...i, status: 'uploading' as const, error: undefined } : i,
        );

        uploadFile(img._file, localId);
        return updated;
      });
    },
    [uploadFile],
  );

  const updateAlt = useCallback((localId: string, alt: string) => {
    setImages((prev) =>
      prev.map((img) => (img.localId === localId ? { ...img, alt } : img)),
    );
  }, []);

  const reset = useCallback(() => {
    setImages((prev) => {
      prev.forEach((img) => {
        if (img.previewUrl?.startsWith('blob:')) {
          URL.revokeObjectURL(img.previewUrl);
          blobUrls.current.delete(img.previewUrl);
        }
      });
      return [];
    });
  }, []);

  return {
    images,
    isUploading: images.some((img) => img.status === 'uploading'),
    hasErrors: images.some((img) => img.status === 'error'),
    readyImages: images.filter((img) => img.status === 'done'),
    addFiles,
    removeImage,
    reorderImages,
    retryImage,
    updateAlt,
    reset,
  };
}
