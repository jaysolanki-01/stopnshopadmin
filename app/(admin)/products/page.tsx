import Image from 'next/image';
import Link from 'next/link';
import { Suspense } from 'react';
import { getProductsWithMeta } from '@/lib/woocommerce/products';
import { StatusBadge } from '@/components/products/StatusBadge';
import { ProductSearch } from '@/components/products/ProductSearch';
import { Pagination } from '@/components/products/Pagination';
import { ProductRowActions } from '@/components/products/ProductRowActions';
import { ProductTableSkeleton } from '@/components/ui/Skeleton';
import { CURRENCY, PAGINATION } from '@/lib/config';
import type { WCProduct } from '@/types/woocommerce';

function formatDate(iso: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

interface PageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

async function ProductList({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? '1', 10));
  const search = params.search ?? '';
  const status = params.status ?? '';

  let products: WCProduct[] = [];
  let total = 0;
  let totalPages = 1;
  let error: string | null = null;

  try {
    ({ products, total, totalPages } = await getProductsWithMeta({
      page,
      per_page: PAGINATION.defaultPerPage,
      search: search || undefined,
      status: status || undefined,
    }));
  } catch {
    error = 'Unable to load products. Please check your WooCommerce connection and try again.';
  }

  if (error) {
    return (
      <div className="bg-white border border-red-100 rounded-xl p-8 text-center">
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-sm">
        {products.length === 0 ? (
          <div className="py-20 text-center">
            <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-4">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 01-8 0" />
              </svg>
            </div>
            <p className="text-sm font-medium text-neutral-700">
              {search ? `No products found for "${search}"` : 'No products yet'}
            </p>
            <p className="mt-1 text-xs text-neutral-400">
              {search ? 'Try a different search term.' : 'Add your first product to get started.'}
            </p>
            {!search && (
              <Link
                href="/products/new"
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-neutral-900 text-white text-sm font-medium rounded-lg hover:bg-neutral-800 transition"
              >
                + Add Product
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-100 bg-neutral-50">
                  <th className="text-left text-xs font-medium text-neutral-500 px-4 py-3 w-14">Image</th>
                  <th className="text-left text-xs font-medium text-neutral-500 px-4 py-3">Product</th>
                  <th className="text-left text-xs font-medium text-neutral-500 px-4 py-3 hidden md:table-cell">SKU</th>
                  <th className="text-left text-xs font-medium text-neutral-500 px-4 py-3 hidden lg:table-cell">Category</th>
                  <th className="text-left text-xs font-medium text-neutral-500 px-4 py-3 hidden sm:table-cell">Price</th>
                  <th className="text-left text-xs font-medium text-neutral-500 px-4 py-3">Status</th>
                  <th className="text-left text-xs font-medium text-neutral-500 px-4 py-3 hidden lg:table-cell">Created</th>
                  <th className="text-right text-xs font-medium text-neutral-500 px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {products.map((product) => (
                  <ProductRow key={product.id} product={product} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Pagination
        page={page}
        totalPages={totalPages}
        total={total}
        perPage={PAGINATION.defaultPerPage}
      />
    </>
  );
}

function ProductRow({ product }: { product: WCProduct }) {
  const image = product.images[0];
  const price = product.sale_price || product.regular_price;
  const category = product.categories[0]?.name ?? '—';

  return (
    <tr className="hover:bg-neutral-50 transition-colors group">
      {/* Thumbnail */}
      <td className="px-4 py-3">
        <div className="w-10 h-10 rounded-lg overflow-hidden bg-neutral-100 border border-neutral-200 flex-shrink-0">
          {image?.src ? (
            <Image
              src={image.src}
              alt={image.alt || product.name}
              width={40}
              height={40}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
            </div>
          )}
        </div>
      </td>

      {/* Name */}
      <td className="px-4 py-3">
        <Link
          href={`/products/${product.id}/edit`}
          className="font-medium text-neutral-900 hover:text-neutral-600 transition-colors line-clamp-1"
        >
          {product.name}
        </Link>
      </td>

      {/* SKU */}
      <td className="px-4 py-3 hidden md:table-cell">
        <span className="text-neutral-500 font-mono text-xs">{product.sku || '—'}</span>
      </td>

      {/* Category */}
      <td className="px-4 py-3 hidden lg:table-cell">
        <span className="text-neutral-600">{category}</span>
      </td>

      {/* Price */}
      <td className="px-4 py-3 hidden sm:table-cell">
        {price ? (
          <div className="flex items-baseline gap-1.5">
            <span className="font-medium text-neutral-900">
              {CURRENCY.symbol}{parseFloat(price).toLocaleString('en-IN')}
            </span>
            {product.sale_price && product.regular_price && (
              <span className="text-xs text-neutral-400 line-through">
                {CURRENCY.symbol}{parseFloat(product.regular_price).toLocaleString('en-IN')}
              </span>
            )}
          </div>
        ) : (
          <span className="text-neutral-400">—</span>
        )}
      </td>

      {/* Status */}
      <td className="px-4 py-3">
        <StatusBadge status={product.status} />
      </td>

      {/* Created */}
      <td className="px-4 py-3 hidden lg:table-cell">
        <span className="text-xs text-neutral-500">
          {formatDate(product.date_created)}
        </span>
      </td>

      {/* Actions */}
      <td className="px-4 py-3 text-right">
        <ProductRowActions product={product} />
      </td>
    </tr>
  );
}

export default async function ProductsPage({ searchParams }: PageProps) {
  const params = await searchParams;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div>
          <h1 className="text-lg sm:text-xl font-semibold text-neutral-900">Products</h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-0.5">Manage your product catalogue</p>
        </div>
        <Link
          href="/products/new"
          className="flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-neutral-900 text-white text-sm font-medium rounded-lg hover:bg-neutral-800 transition shadow-sm"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span className="hidden sm:inline">Add Product</span>
          <span className="sm:hidden">Add</span>
        </Link>
      </div>

      {/* Search & filters */}
      <div className="mb-4">
        <Suspense>
          <ProductSearch
            defaultSearch={params.search ?? ''}
            defaultStatus={params.status ?? ''}
          />
        </Suspense>
      </div>

      {/* Table */}
      <Suspense fallback={<ProductTableSkeleton />}>
        <ProductList searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
