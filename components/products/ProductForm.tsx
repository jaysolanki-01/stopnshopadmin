'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FormField } from '@/components/ui/FormField';
import { FormSection } from '@/components/ui/FormSection';
import { RichTextEditor } from '@/components/ui/RichTextEditor';
import { CategorySelector } from '@/components/products/CategorySelector';
import { AttributeSelector, type SelectedAttribute } from '@/components/products/AttributeSelector';
import { ProductImageUploader } from '@/components/products/ProductImageUploader';
import { useProductImages } from '@/hooks/useProductImages';
import { CURRENCY } from '@/lib/config';
import type { WCCategory, WCProduct } from '@/types/woocommerce';

// ─── Types ───────────────────────────────────────────────────────────────────

interface FormState {
  name: string;
  sku: string;
  categoryId: number | null;
  regularPrice: string;
  salePrice: string;
  manageStock: boolean;
  stockQuantity: string;
  stockStatus: 'instock' | 'outofstock' | 'onbackorder';
  backorders: 'no' | 'notify' | 'yes';
  lowStockAmount: string;
  soldIndividually: boolean;
  attributes: SelectedAttribute[];
  shortDescription: string;
  description: string;
}

interface FormErrors {
  name?: string;
  sku?: string;
  regularPrice?: string;
  salePrice?: string;
}

const INITIAL_FORM: FormState = {
  name: '',
  sku: '',
  categoryId: null,
  regularPrice: '',
  salePrice: '',
  manageStock: false,
  stockQuantity: '',
  stockStatus: 'instock',
  backorders: 'no',
  lowStockAmount: '',
  soldIndividually: false,
  attributes: [],
  shortDescription: '',
  description: '',
};

// ─── Input class helper ───────────────────────────────────────────────────────

function inputCls(hasError = false) {
  return [
    'w-full px-3 py-2.5 text-sm bg-white border rounded-lg text-neutral-900',
    'placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900',
    'focus:border-transparent transition',
    hasError ? 'border-red-300' : 'border-neutral-200',
  ].join(' ');
}

// ─── Success state ────────────────────────────────────────────────────────────

function SuccessState({
  product,
  status,
  onAddAnother,
}: {
  product: WCProduct;
  status: 'draft' | 'publish';
  onAddAnother: () => void;
}) {
  return (
    <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-10 text-center">
      <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>

      <h2 className="text-lg font-semibold text-neutral-900 mb-1">
        {status === 'publish' ? 'Product Published!' : 'Draft Saved!'}
      </h2>
      <p className="text-sm text-neutral-500 mb-8 max-w-xs mx-auto">
        <span className="font-medium text-neutral-700">{product.name}</span> has been{' '}
        {status === 'publish' ? 'published to your store.' : 'saved as a draft.'}
      </p>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        {product.permalink && (
          <a
            href={product.permalink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-medium bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition"
          >
            View Product
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </a>
        )}
        <Link
          href={`/products/${product.id}/edit`}
          className="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-medium border border-neutral-300 bg-white text-neutral-700 rounded-lg hover:bg-neutral-50 transition"
        >
          Edit Product
        </Link>
        <button
          onClick={onAddAnother}
          className="text-sm text-neutral-500 hover:text-neutral-800 transition px-3 py-2.5"
        >
          + Add Another
        </button>
      </div>
    </div>
  );
}

// ─── Main form ────────────────────────────────────────────────────────────────

interface ProductFormProps {
  categories: WCCategory[];
}

export function ProductForm({ categories }: ProductFormProps) {
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState<'draft' | 'publish' | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ product: WCProduct; status: 'draft' | 'publish' } | null>(null);

  const {
    images,
    isUploading: imagesUploading,
    hasErrors: imagesHaveErrors,
    readyImages,
    addFiles,
    removeImage,
    reorderImages,
    retryImage,
    reset: resetImages,
  } = useProductImages();

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (key in errors) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  // Client-side validation
  const validate = (): boolean => {
    const next: FormErrors = {};

    if (!form.name.trim()) {
      next.name = 'Product name is required.';
    } else if (form.name.trim().length > 200) {
      next.name = 'Product name must be 200 characters or fewer.';
    }

    if (form.regularPrice && !/^\d+(\.\d{0,2})?$/.test(form.regularPrice)) {
      next.regularPrice = 'Enter a valid price (e.g. 3999 or 3999.50).';
    }

    if (form.salePrice && !/^\d+(\.\d{0,2})?$/.test(form.salePrice)) {
      next.salePrice = 'Enter a valid price (e.g. 2999 or 2999.50).';
    }

    if (form.salePrice && form.regularPrice) {
      const reg = parseFloat(form.regularPrice);
      const sale = parseFloat(form.salePrice);
      if (!isNaN(reg) && !isNaN(sale) && sale >= reg) {
        next.salePrice = 'Sale price must be less than the regular price.';
      }
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (status: 'draft' | 'publish') => {
    if (!validate()) return;

    if (imagesUploading) {
      setApiError('Please wait for all images to finish uploading.');
      return;
    }
    if (imagesHaveErrors) {
      setApiError('Some images failed to upload. Please retry or remove them before saving.');
      return;
    }

    setSubmitting(status);
    setApiError(null);

    // Build image payload: first ready image is featured, rest are gallery
    const imageIds = readyImages.map((img) => ({ id: img.mediaId! }));

    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          status,
          sku: form.sku.trim() || undefined,
          categories: form.categoryId ? [{ id: form.categoryId }] : undefined,
          regular_price: form.regularPrice || undefined,
          sale_price: form.salePrice || undefined,
          manage_stock: form.manageStock,
          stock_quantity: form.manageStock && form.stockQuantity ? parseInt(form.stockQuantity, 10) : null,
          stock_status: form.manageStock ? undefined : form.stockStatus,
          backorders: form.manageStock ? form.backorders : undefined,
          low_stock_amount: form.manageStock && form.lowStockAmount ? parseInt(form.lowStockAmount, 10) : null,
          sold_individually: form.soldIndividually,
          attributes: form.attributes.length > 0
            ? form.attributes.filter((a) => a.options.length > 0).map((a) => ({
                id: a.id,
                visible: a.visible,
                options: a.options,
              }))
            : undefined,
          short_description: form.shortDescription || undefined,
          description: form.description || undefined,
          images: imageIds.length > 0 ? imageIds : undefined,
        }),
      });

      const data = (await res.json()) as
        | { success: true; data: WCProduct }
        | { success: false; error: { code: string; message: string } };

      if (!data.success) {
        setApiError(data.error?.message ?? 'Failed to create product. Please try again.');
        return;
      }

      setSuccess({ product: data.data, status });
    } catch {
      setApiError('Network error. Please check your connection and try again.');
    } finally {
      setSubmitting(null);
    }
  };

  const handleAddAnother = () => {
    setSuccess(null);
    setForm(INITIAL_FORM);
    setErrors({});
    setApiError(null);
    resetImages();
  };

  if (success) {
    return <SuccessState product={success.product} status={success.status} onAddAnother={handleAddAnother} />;
  }

  const isDisabled = !!submitting || imagesUploading;

  return (
    <form onSubmit={(e) => e.preventDefault()} noValidate className="space-y-4">
      {/* API-level error */}
      {apiError && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          <svg className="flex-shrink-0 mt-0.5 text-red-500" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <p className="text-sm text-red-700">{apiError}</p>
        </div>
      )}

      {/* ── Product Details ── */}
      <FormSection title="Product Details">
        <FormField label="Product Name" required error={errors.name}>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setField('name', e.target.value)}
            placeholder="Enter product name"
            disabled={isDisabled}
            maxLength={200}
            className={inputCls(!!errors.name)}
          />
        </FormField>

        <FormField
          label="SKU"
          hint="Stock Keeping Unit — leave empty if you don't use SKUs."
          error={errors.sku}
        >
          <input
            type="text"
            value={form.sku}
            onChange={(e) => setField('sku', e.target.value)}
            placeholder="e.g. PERF-BB-100"
            disabled={isDisabled}
            maxLength={100}
            className={inputCls(!!errors.sku)}
          />
        </FormField>
      </FormSection>

      {/* ── Category ── */}
      <FormSection title="Category">
        <FormField label="Category">
          <CategorySelector
            categories={categories}
            value={form.categoryId}
            onChange={(id) => setField('categoryId', id)}
            disabled={isDisabled}
          />
        </FormField>
      </FormSection>

      {/* ── Pricing ── */}
      <FormSection title="Pricing">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Regular Price" error={errors.regularPrice}>
            <div className="relative">
              <span className="absolute inset-y-0 left-3 flex items-center text-sm text-neutral-400 pointer-events-none select-none">
                {CURRENCY.symbol}
              </span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.regularPrice}
                onChange={(e) => setField('regularPrice', e.target.value)}
                placeholder="0.00"
                disabled={isDisabled}
                className={`${inputCls(!!errors.regularPrice)} pl-7`}
              />
            </div>
          </FormField>

          <FormField
            label="Sale Price"
            hint="Leave empty if there's no sale."
            error={errors.salePrice}
          >
            <div className="relative">
              <span className="absolute inset-y-0 left-3 flex items-center text-sm text-neutral-400 pointer-events-none select-none">
                {CURRENCY.symbol}
              </span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.salePrice}
                onChange={(e) => setField('salePrice', e.target.value)}
                placeholder="0.00"
                disabled={isDisabled}
                className={`${inputCls(!!errors.salePrice)} pl-7`}
              />
            </div>
          </FormField>
        </div>
      </FormSection>

      {/* ── Inventory ── */}
      <FormSection title="Inventory">
        <div className="flex items-center gap-3">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={form.manageStock}
              onChange={(e) => setField('manageStock', e.target.checked)}
              disabled={isDisabled}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-neutral-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-neutral-900 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-neutral-900" />
          </label>
          <span className="text-sm text-neutral-700">Track stock quantity</span>
        </div>

        {form.manageStock ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
            <FormField label="Stock Quantity">
              <input
                type="number"
                min="0"
                step="1"
                value={form.stockQuantity}
                onChange={(e) => setField('stockQuantity', e.target.value)}
                placeholder="0"
                disabled={isDisabled}
                className={inputCls()}
              />
            </FormField>

            <FormField label="Low Stock Threshold" hint="Get notified when stock falls below this.">
              <input
                type="number"
                min="0"
                step="1"
                value={form.lowStockAmount}
                onChange={(e) => setField('lowStockAmount', e.target.value)}
                placeholder="e.g. 5"
                disabled={isDisabled}
                className={inputCls()}
              />
            </FormField>

            <FormField label="Allow Backorders">
              <select
                value={form.backorders}
                onChange={(e) => setField('backorders', e.target.value as FormState['backorders'])}
                disabled={isDisabled}
                className={inputCls()}
              >
                <option value="no">Do not allow</option>
                <option value="notify">Allow, but notify customer</option>
                <option value="yes">Allow</option>
              </select>
            </FormField>
          </div>
        ) : (
          <FormField label="Stock Status" hint="Manually set the stock status.">
            <select
              value={form.stockStatus}
              onChange={(e) => setField('stockStatus', e.target.value as FormState['stockStatus'])}
              disabled={isDisabled}
              className={inputCls()}
            >
              <option value="instock">In stock</option>
              <option value="outofstock">Out of stock</option>
              <option value="onbackorder">On backorder</option>
            </select>
          </FormField>
        )}

        <div className="flex items-center gap-3 mt-1">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={form.soldIndividually}
              onChange={(e) => setField('soldIndividually', e.target.checked)}
              disabled={isDisabled}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-neutral-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-neutral-900 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-neutral-900" />
          </label>
          <span className="text-sm text-neutral-700">Sold individually (limit one per order)</span>
        </div>
      </FormSection>

      {/* ── Attributes ── */}
      <FormSection title="Attributes" description="Select product attributes like size, color, etc.">
        <AttributeSelector
          value={form.attributes}
          onChange={(attrs) => setField('attributes', attrs)}
          disabled={isDisabled}
        />
      </FormSection>

      {/* ── Description ── */}
      <FormSection title="Description">
        <FormField label="Short Description" hint="Shown on product listing cards and search results.">
          <RichTextEditor
            value={form.shortDescription}
            onChange={(html) => setField('shortDescription', html)}
            placeholder="A brief summary of this product…"
            minHeight={90}
          />
        </FormField>

        <FormField label="Full Description" hint="Shown on the product detail page.">
          <RichTextEditor
            value={form.description}
            onChange={(html) => setField('description', html)}
            placeholder="Full product description…"
            minHeight={160}
          />
        </FormField>
      </FormSection>

      {/* ── Images ── */}
      <FormSection
        title="Images"
        description="First image is used as the featured product image. Drag to reorder."
      >
        <ProductImageUploader
          images={images}
          onAddFiles={addFiles}
          onRemove={removeImage}
          onReorder={reorderImages}
          onRetry={retryImage}
        />
      </FormSection>

      {/* ── Actions ── */}
      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <button
          type="button"
          onClick={() => handleSubmit('draft')}
          disabled={isDisabled}
          className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-medium border border-neutral-300 bg-white text-neutral-700 rounded-lg hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {submitting === 'draft' ? (
            <>
              <span className="w-3.5 h-3.5 border-2 border-neutral-400 border-t-neutral-700 rounded-full animate-spin" />
              Saving…
            </>
          ) : (
            'Save as Draft'
          )}
        </button>

        <button
          type="button"
          onClick={() => handleSubmit('publish')}
          disabled={isDisabled}
          className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-medium bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm"
        >
          {submitting === 'publish' ? (
            <>
              <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              Publishing…
            </>
          ) : (
            'Publish Product'
          )}
        </button>
      </div>
    </form>
  );
}
