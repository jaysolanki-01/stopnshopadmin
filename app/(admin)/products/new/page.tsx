import Link from 'next/link';
import { getCategories } from '@/lib/woocommerce/categories';
import { ProductForm } from '@/components/products/ProductForm';
import type { WCCategory } from '@/types/woocommerce';

export const metadata = { title: 'Add Product — Product Manager' };

export default async function NewProductPage() {
  let categories: WCCategory[] = [];
  let categoryError = false;

  try {
    categories = await getCategories();
  } catch {
    categoryError = true;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <Link
          href="/products"
          className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-900 transition mb-3 sm:mb-4"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
          </svg>
          Back to Products
        </Link>

        <h1 className="text-lg sm:text-xl font-semibold text-neutral-900">Add Product</h1>
        <p className="text-xs sm:text-sm text-neutral-500 mt-0.5">Create a new product in your store</p>
      </div>

      {/* Category load warning */}
      {categoryError && (
        <div className="mb-4 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800">
          Could not load categories from WooCommerce. You can still create the product and assign a category later.
        </div>
      )}

      <ProductForm categories={categories} />
    </div>
  );
}
