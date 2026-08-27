import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getProduct } from '@/lib/woocommerce/products';
import { getCategories } from '@/lib/woocommerce/categories';
import { ProductEditForm } from '@/components/products/ProductEditForm';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditProductPage({ params }: PageProps) {
  const { id: rawId } = await params;
  const id = parseInt(rawId, 10);

  if (!Number.isFinite(id) || id <= 0) notFound();

  let product, categories;
  try {
    [product, categories] = await Promise.all([getProduct(id), getCategories()]);
  } catch {
    notFound();
  }

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto animate-fade-in">
      {/* Back link */}
      <Link
        href="/products"
        className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-800 transition mb-6"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Back to Products
      </Link>

      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-neutral-900">Edit Product</h1>
        <p className="text-sm text-neutral-500 mt-0.5 line-clamp-1">{product.name}</p>
      </div>

      <ProductEditForm product={product} categories={categories} />
    </div>
  );
}
