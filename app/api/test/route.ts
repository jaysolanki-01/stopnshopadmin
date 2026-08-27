import { NextResponse } from 'next/server';
import { getProducts } from '@/lib/woocommerce/products';
import { getCategories } from '@/lib/woocommerce/categories';
import { normalizeError } from '@/lib/api-error';

// Phase 1 connection test — remove or protect this route before production
export async function GET() {
  const result = {
    timestamp: new Date().toISOString(),
    wordpressUrl: process.env.WORDPRESS_URL ?? '(not set)',
    products: { ok: false, count: 0, sample: [] as string[], error: null as string | null },
    categories: { ok: false, count: 0, names: [] as string[], error: null as string | null },
  };

  try {
    const products = await getProducts({ per_page: 5 });
    result.products.ok = true;
    result.products.count = products.length;
    result.products.sample = products.map((p) => p.name);
  } catch (err) {
    result.products.error = normalizeError(err);
  }

  try {
    const categories = await getCategories();
    result.categories.ok = true;
    result.categories.count = categories.length;
    result.categories.names = categories.slice(0, 10).map((c) => c.name);
  } catch (err) {
    result.categories.error = normalizeError(err);
  }

  const allOk = result.products.ok && result.categories.ok;
  return NextResponse.json(result, { status: allOk ? 200 : 502 });
}
