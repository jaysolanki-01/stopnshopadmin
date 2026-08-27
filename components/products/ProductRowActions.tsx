'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { WCProduct } from '@/types/woocommerce';

interface ProductRowActionsProps {
  product: WCProduct;
}

export function ProductRowActions({ product }: ProductRowActionsProps) {
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Close dialog on Escape
  useEffect(() => {
    if (!showConfirm) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowConfirm(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [showConfirm]);

  const handleDuplicate = async () => {
    setDuplicating(true);
    setError(null);
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `Copy of ${product.name}`,
          status: 'draft',
          sku: product.sku ? `${product.sku}-copy` : undefined,
          categories: product.categories.length > 0
            ? product.categories.map((c) => ({ id: c.id }))
            : undefined,
          regular_price: product.regular_price || undefined,
          sale_price: product.sale_price || undefined,
          description: product.description || undefined,
          short_description: product.short_description || undefined,
          images: product.images.length > 0
            ? product.images.map((img) => ({ id: img.id }))
            : undefined,
        }),
      });
      const data = (await res.json()) as
        | { success: true; data: WCProduct }
        | { success: false; error: { code: string; message: string } };

      if (!data.success) {
        setError(data.error?.message ?? 'Failed to duplicate product.');
        return;
      }

      router.push(`/products/${data.data.id}/edit`);
      router.refresh();
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setDuplicating(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/products/${product.id}`, { method: 'DELETE' });
      const data = (await res.json()) as
        | { success: true }
        | { success: false; error: { code: string; message: string } };

      if (!data.success) {
        setError(data.error?.message ?? 'Failed to delete product.');
        setDeleting(false);
        return;
      }

      setShowConfirm(false);
      router.refresh();
    } catch {
      setError('Network error. Please try again.');
      setDeleting(false);
    }
  };

  return (
    <>
      {/* Inline actions */}
      <div className="flex items-center justify-end gap-1 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
        <Link
          href={`/products/${product.id}/edit`}
          className="text-xs font-medium text-neutral-600 hover:text-neutral-900 transition-colors px-2 py-1 rounded hover:bg-neutral-100"
        >
          Edit
        </Link>

        <button
          type="button"
          onClick={handleDuplicate}
          disabled={duplicating}
          title="Duplicate product"
          className="text-xs font-medium text-neutral-600 hover:text-neutral-900 transition-colors px-2 py-1 rounded hover:bg-neutral-100 disabled:opacity-50"
        >
          {duplicating ? '…' : 'Duplicate'}
        </button>

        {product.permalink && (
          <a
            href={product.permalink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-medium text-neutral-600 hover:text-neutral-900 transition-colors px-2 py-1 rounded hover:bg-neutral-100"
          >
            View ↗
          </a>
        )}

        <button
          type="button"
          onClick={() => { setError(null); setShowConfirm(true); }}
          title="Delete product"
          className="text-xs font-medium text-red-500 hover:text-red-700 transition-colors px-2 py-1 rounded hover:bg-red-50"
        >
          Delete
        </button>
      </div>

      {/* Error toast (duplicate errors) */}
      {error && !showConfirm && (
        <p className="text-[10px] text-red-600 text-right mt-1">{error}</p>
      )}

      {/* Delete confirmation modal */}
      {showConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
          onClick={(e) => { if (e.target === e.currentTarget) setShowConfirm(false); }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-dialog-title"
        >
          <div
            ref={dialogRef}
            className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                  <path d="M10 11v6M14 11v6" />
                  <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
                </svg>
              </div>
              <div>
                <h2 id="delete-dialog-title" className="text-sm font-semibold text-neutral-900">
                  Move to trash?
                </h2>
                <p className="text-xs text-neutral-500 mt-0.5">
                  This can be restored from WooCommerce later.
                </p>
              </div>
            </div>

            <p className="text-sm text-neutral-700 mb-5 line-clamp-2">
              <span className="font-medium">{product.name}</span> will be moved to trash.
            </p>

            {error && (
              <p className="text-xs text-red-600 mb-3">{error}</p>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                disabled={deleting}
                className="flex-1 px-4 py-2 text-sm font-medium border border-neutral-300 bg-white text-neutral-700 rounded-lg hover:bg-neutral-50 disabled:opacity-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition"
              >
                {deleting ? (
                  <><span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />Deleting…</>
                ) : 'Move to Trash'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
