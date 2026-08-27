'use client';

import { useRef, useState, useCallback } from 'react';
import type { UploadedImage } from '@/types/woocommerce';
import { PRODUCT_IMAGE } from '@/lib/config';

interface ProductImageUploaderProps {
  images: UploadedImage[];
  onAddFiles: (files: FileList | File[]) => void;
  onRemove: (localId: string) => void;
  onReorder: (next: UploadedImage[]) => void;
  onRetry: (localId: string) => void;
}

export function ProductImageUploader({
  images,
  onAddFiles,
  onRemove,
  onReorder,
  onRetry,
}: ProductImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDraggingFiles, setIsDraggingFiles] = useState(false);
  const dragCounter = useRef(0);

  // ── File input / OS drag-and-drop ─────────────────────────────────────────

  const openPicker = () => fileInputRef.current?.click();

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      onAddFiles(e.target.files);
      e.target.value = ''; // allow re-selecting same file
    }
  };

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current++;
    setIsDraggingFiles(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    dragCounter.current--;
    if (dragCounter.current === 0) setIsDraggingFiles(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      dragCounter.current = 0;
      setIsDraggingFiles(false);
      const files = e.dataTransfer.files;
      if (files?.length) onAddFiles(files);
    },
    [onAddFiles],
  );

  // ── Grid drag-to-reorder ──────────────────────────────────────────────────

  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dropIdx, setDropIdx] = useState<number | null>(null);

  const handleCardDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.effectAllowed = 'move';
    // Delay state update so the drag ghost renders the normal card, not the faded one
    setTimeout(() => setDragIdx(index), 0);
  };

  const handleCardDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation(); // prevent triggering the file-drop zone
    e.dataTransfer.dropEffect = 'move';
    setDropIdx(index);
  };

  const handleCardDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (dragIdx !== null && dragIdx !== index) {
      const next = [...images];
      const [moved] = next.splice(dragIdx, 1);
      next.splice(index, 0, moved);
      onReorder(next);
    }
    setDragIdx(null);
    setDropIdx(null);
  };

  const handleCardDragEnd = () => {
    setDragIdx(null);
    setDropIdx(null);
  };

  const acceptStr = PRODUCT_IMAGE.acceptedExtensions.join(',');

  // ── Empty state ───────────────────────────────────────────────────────────

  if (images.length === 0) {
    return (
      <>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptStr}
          className="hidden"
          onChange={handleFileInput}
        />
        <div
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={openPicker}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && openPicker()}
          className={[
            'border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center gap-3 cursor-pointer transition-colors select-none',
            isDraggingFiles
              ? 'border-neutral-500 bg-neutral-50'
              : 'border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50',
          ].join(' ')}
        >
          <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-neutral-700">
              {isDraggingFiles ? 'Drop images here' : 'Drag & drop images here'}
            </p>
            <p className="text-xs text-neutral-400 mt-0.5">or click to browse files</p>
          </div>
          <p className="text-xs text-neutral-400">JPG, PNG, WebP · Max {PRODUCT_IMAGE.maxSizeMB}MB per image</p>
        </div>
      </>
    );
  }

  // ── Grid state ────────────────────────────────────────────────────────────

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={acceptStr}
        className="hidden"
        onChange={handleFileInput}
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {images.map((image, index) => (
          <div
            key={image.localId}
            draggable={image.status === 'done'}
            onDragStart={(e) => handleCardDragStart(e, index)}
            onDragOver={(e) => handleCardDragOver(e, index)}
            onDrop={(e) => handleCardDrop(e, index)}
            onDragEnd={handleCardDragEnd}
            className={[
              'relative aspect-square rounded-xl overflow-hidden border transition-all group',
              dragIdx === index ? 'opacity-40 scale-95' : 'opacity-100',
              dropIdx === index && dragIdx !== index ? 'border-neutral-500 ring-2 ring-neutral-300' : 'border-neutral-200',
              image.status === 'done' ? 'cursor-grab active:cursor-grabbing' : '',
            ].join(' ')}
          >
            {/* Thumbnail */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image.src ?? image.previewUrl}
              alt={image.alt || image.filename}
              className={[
                'w-full h-full object-cover',
                image.status === 'uploading' ? 'blur-sm' : '',
                image.status === 'error' ? 'opacity-40' : '',
              ].join(' ')}
            />

            {/* Uploading overlay */}
            {image.status === 'uploading' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/60">
                <div className="w-6 h-6 border-2 border-neutral-300 border-t-neutral-700 rounded-full animate-spin" />
                <span className="text-[10px] text-neutral-600 mt-1.5 font-medium">Uploading…</span>
              </div>
            )}

            {/* Error overlay */}
            {image.status === 'error' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-50/80 p-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round">
                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <p className="text-[9px] text-red-600 text-center mt-1 leading-tight line-clamp-2">
                  {image.error ?? 'Upload failed'}
                </p>
                <button
                  type="button"
                  onClick={() => onRetry(image.localId)}
                  className="mt-1.5 text-[9px] font-medium text-red-700 underline"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Featured badge */}
            {index === 0 && image.status === 'done' && (
              <div className="absolute bottom-1.5 left-1.5">
                <span className="text-[9px] font-semibold bg-neutral-900 text-white px-1.5 py-0.5 rounded-sm">
                  Featured
                </span>
              </div>
            )}

            {/* Remove button */}
            <button
              type="button"
              onClick={() => onRemove(image.localId)}
              title="Remove image"
              className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-neutral-900/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
            >
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        ))}

        {/* Add more button */}
        <button
          type="button"
          onClick={openPicker}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className={[
            'aspect-square border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-1.5 transition-colors',
            isDraggingFiles
              ? 'border-neutral-400 bg-neutral-50'
              : 'border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50',
          ].join(' ')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span className="text-xs text-neutral-400">Add images</span>
        </button>
      </div>

      {/* Hint */}
      <p className="text-xs text-neutral-400 mt-2">
        Drag cards to reorder · First image is the featured product image
      </p>
    </>
  );
}
