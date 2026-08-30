'use client';

import { useState, useEffect, useCallback } from 'react';
import { CURRENCY } from '@/lib/config';
import type { SelectedAttribute } from './AttributeSelector';

interface VariationRow {
  id?: number;
  attributes: Array<{ id: number; name: string; option: string }>;
  regular_price: string;
  sale_price: string;
  sku: string;
  stock_status: 'instock' | 'outofstock' | 'onbackorder';
  manage_stock: boolean;
  stock_quantity: number | null;
  isNew?: boolean;
}

interface VariationManagerProps {
  productId?: number;
  attributes: SelectedAttribute[];
  disabled?: boolean;
}

function inputCls() {
  return 'w-full px-2.5 py-2 text-sm bg-white border border-neutral-200 rounded-lg text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition';
}

export function VariationManager({ productId, attributes, disabled }: VariationManagerProps) {
  const [variations, setVariations] = useState<VariationRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const variationAttrs = attributes.filter((a) => a.variation && a.options.length > 0);

  const fetchVariations = useCallback(async () => {
    if (!productId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/products/${productId}/variations`);
      const json = await res.json();
      if (json.success) {
        setVariations(
          json.data.map((v: VariationRow) => ({
            id: v.id,
            attributes: v.attributes,
            regular_price: v.regular_price || '',
            sale_price: v.sale_price || '',
            sku: v.sku || '',
            stock_status: v.stock_status || 'instock',
            manage_stock: v.manage_stock || false,
            stock_quantity: v.stock_quantity,
          })),
        );
      }
    } catch {
      setError('Failed to load variations.');
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    fetchVariations();
  }, [fetchVariations]);

  const generateVariations = () => {
    if (variationAttrs.length === 0) return;

    const combos = cartesian(variationAttrs.map((a) => a.options.map((o) => ({ id: a.id, name: a.name, option: o }))));

    const newVariations: VariationRow[] = combos.map((combo) => {
      const existing = variations.find((v) =>
        combo.every((c) => v.attributes.some((va) => va.id === c.id && va.option === c.option)),
      );
      if (existing) return existing;
      return {
        attributes: combo,
        regular_price: '',
        sale_price: '',
        sku: '',
        stock_status: 'instock' as const,
        manage_stock: false,
        stock_quantity: null,
        isNew: true,
      };
    });

    setVariations(newVariations);
  };

  const updateVariation = (index: number, field: keyof VariationRow, value: string | number | null) => {
    setVariations((prev) =>
      prev.map((v, i) => (i === index ? { ...v, [field]: value } : v)),
    );
  };

  const removeVariation = (index: number) => {
    setVariations((prev) => prev.filter((_, i) => i !== index));
  };

  const saveVariations = async () => {
    if (!productId) return;
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const toCreate = variations.filter((v) => !v.id).map((v) => ({
        regular_price: v.regular_price,
        sale_price: v.sale_price || undefined,
        sku: v.sku || undefined,
        stock_status: v.stock_status,
        manage_stock: v.manage_stock,
        stock_quantity: v.manage_stock ? v.stock_quantity : undefined,
        attributes: v.attributes.map((a) => ({ id: a.id, option: a.option })),
      }));

      const toUpdate = variations.filter((v) => v.id).map((v) => ({
        id: v.id!,
        regular_price: v.regular_price,
        sale_price: v.sale_price || undefined,
        sku: v.sku || undefined,
        stock_status: v.stock_status,
        manage_stock: v.manage_stock,
        stock_quantity: v.manage_stock ? v.stock_quantity : undefined,
      }));

      const res = await fetch(`/api/products/${productId}/variations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          create: toCreate.length > 0 ? toCreate : undefined,
          update: toUpdate.length > 0 ? toUpdate : undefined,
        }),
      });

      const json = await res.json();
      if (!json.success) {
        setError(json.error?.message ?? 'Failed to save variations.');
        return;
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      await fetchVariations();
    } catch {
      setError('Network error saving variations.');
    } finally {
      setSaving(false);
    }
  };

  if (variationAttrs.length === 0) {
    return (
      <div className="text-sm text-neutral-400 py-4 text-center">
        Enable &quot;Used for variations&quot; on at least one attribute with selected options to create variations.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Actions */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={generateVariations}
          disabled={disabled || saving}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 disabled:opacity-50 transition"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Generate Variations
        </button>

        {productId && variations.length > 0 && (
          <button
            type="button"
            onClick={saveVariations}
            disabled={disabled || saving}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium border border-neutral-300 bg-white text-neutral-700 rounded-lg hover:bg-neutral-50 disabled:opacity-50 transition"
          >
            {saving ? (
              <><span className="w-3 h-3 border-2 border-neutral-400 border-t-neutral-700 rounded-full animate-spin" />Saving…</>
            ) : (
              'Save Variations'
            )}
          </button>
        )}

        <span className="text-xs text-neutral-400">
          {variations.length} variation{variations.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Feedback */}
      {success && (
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <p className="text-xs text-emerald-700 font-medium">Variations saved.</p>
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          <p className="text-xs text-red-700">{error}</p>
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="animate-pulse space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-neutral-100 rounded-lg" />
          ))}
        </div>
      ) : (
        /* Variation cards */
        <div className="space-y-2">
          {variations.map((v, i) => (
            <div key={v.id ?? `new-${i}`} className="border border-neutral-200 rounded-lg p-3 sm:p-4 bg-white">
              {/* Variation label */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  {v.attributes.map((a) => (
                    <span
                      key={a.id}
                      className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-neutral-100 text-neutral-700"
                    >
                      {a.name}: {a.option}
                    </span>
                  ))}
                  {v.isNew && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-50 text-blue-600">
                      New
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => removeVariation(i)}
                  disabled={disabled || saving}
                  className="p-1 rounded text-neutral-400 hover:text-red-500 hover:bg-red-50 transition disabled:opacity-50"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              {/* Price fields */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-medium text-neutral-500 uppercase tracking-wide mb-1">
                    Regular Price
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-2.5 flex items-center text-xs text-neutral-400 pointer-events-none">
                      {CURRENCY.symbol}
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={v.regular_price}
                      onChange={(e) => updateVariation(i, 'regular_price', e.target.value)}
                      placeholder="0.00"
                      disabled={disabled || saving}
                      className={`${inputCls()} pl-6`}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-neutral-500 uppercase tracking-wide mb-1">
                    Sale Price
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-2.5 flex items-center text-xs text-neutral-400 pointer-events-none">
                      {CURRENCY.symbol}
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={v.sale_price}
                      onChange={(e) => updateVariation(i, 'sale_price', e.target.value)}
                      placeholder="0.00"
                      disabled={disabled || saving}
                      className={`${inputCls()} pl-6`}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-neutral-500 uppercase tracking-wide mb-1">
                    SKU
                  </label>
                  <input
                    type="text"
                    value={v.sku}
                    onChange={(e) => updateVariation(i, 'sku', e.target.value)}
                    placeholder="Optional"
                    disabled={disabled || saving}
                    className={inputCls()}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!productId && variations.length > 0 && (
        <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          Save the product first, then come back to edit to save variations with their prices.
        </p>
      )}
    </div>
  );
}

function cartesian<T>(arrays: T[][]): T[][] {
  if (arrays.length === 0) return [[]];
  return arrays.reduce<T[][]>(
    (acc, arr) => acc.flatMap((combo) => arr.map((item) => [...combo, item])),
    [[]],
  );
}
