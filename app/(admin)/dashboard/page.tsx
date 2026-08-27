import Link from 'next/link';
import Image from 'next/image';
import { getProductsWithMeta } from '@/lib/woocommerce/products';
import { getOrdersWithMeta } from '@/lib/woocommerce/orders';
import { getCustomersWithMeta } from '@/lib/woocommerce/customers';
import { StatusBadge } from '@/components/products/StatusBadge';
import { OrderStatusBadge } from '@/components/orders/OrderStatusBadge';
import { CURRENCY } from '@/lib/config';
import type { WCOrder } from '@/types/woocommerce';

async function getProductStats() {
  try {
    const [allResult, publishedResult, draftResult, lowStockResult] = await Promise.all([
      getProductsWithMeta({ per_page: 1, status: 'any' }),
      getProductsWithMeta({ per_page: 1, status: 'publish' }),
      getProductsWithMeta({ per_page: 1, status: 'draft' }),
      getProductsWithMeta({ per_page: 5, status: 'publish' }),
    ]);
    const lowStock = lowStockResult.products.filter(
      (p) => p.manage_stock && p.stock_quantity !== null && p.stock_quantity <= (p.low_stock_amount ?? 2)
    );
    return { total: allResult.total, published: publishedResult.total, drafts: draftResult.total, lowStock, error: null };
  } catch {
    return { total: 0, published: 0, drafts: 0, lowStock: [], error: 'Could not load product stats.' };
  }
}

async function getOrderStats() {
  try {
    const [allResult, processingResult, onHoldResult, completedResult] = await Promise.all([
      getOrdersWithMeta({ per_page: 1 }),
      getOrdersWithMeta({ per_page: 1, status: 'processing' }),
      getOrdersWithMeta({ per_page: 1, status: 'on-hold' }),
      getOrdersWithMeta({ per_page: 1, status: 'completed' }),
    ]);
    return {
      total: allResult.total,
      processing: processingResult.total,
      onHold: onHoldResult.total,
      completed: completedResult.total,
      error: null,
    };
  } catch {
    return { total: 0, processing: 0, onHold: 0, completed: 0, error: 'Could not load order stats.' };
  }
}

async function getRecentProducts() {
  try {
    const { products } = await getProductsWithMeta({ per_page: 5, status: 'any' });
    return products;
  } catch {
    return [];
  }
}

async function getCustomerStats() {
  try {
    const result = await getCustomersWithMeta({ per_page: 1 });
    return { total: result.total, error: null };
  } catch {
    return { total: 0, error: 'Could not load customer stats.' };
  }
}

async function getRecentOrders() {
  try {
    const { orders } = await getOrdersWithMeta({ per_page: 5 });
    return orders;
  } catch {
    return [];
  }
}

function formatCurrency(amount: string | number) {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return `${CURRENCY.symbol}0`;
  return `${CURRENCY.symbol}${num.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function getCustomerName(order: WCOrder) {
  const name = `${order.billing.first_name} ${order.billing.last_name}`.trim();
  return name || 'Guest';
}

function getInitials(order: WCOrder) {
  const f = order.billing.first_name?.[0] ?? '';
  const l = order.billing.last_name?.[0] ?? '';
  return (f + l).toUpperCase() || '?';
}

export default async function DashboardPage() {
  const [productStats, orderStats, customerStats, recentProducts, recentOrders] = await Promise.all([
    getProductStats(),
    getOrderStats(),
    getCustomerStats(),
    getRecentProducts(),
    getRecentOrders(),
  ]);

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">Dashboard</h1>
          <p className="text-sm text-neutral-500 mt-0.5">Store overview</p>
        </div>
        <Link
          href="/products/new"
          className="flex items-center gap-1.5 px-4 py-2 bg-neutral-900 text-white text-sm font-medium rounded-lg hover:bg-neutral-800 transition shadow-sm"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add Product
        </Link>
      </div>

      {/* Order Stats */}
      {orderStats.error ? (
        <div className="mb-6 bg-red-50 border border-red-100 rounded-xl p-4 text-sm text-red-600">
          {orderStats.error}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <StatCard label="Total Orders" value={orderStats.total} href="/orders" />
          <StatCard label="Processing" value={orderStats.processing} href="/orders?status=processing" accent="blue" />
          <StatCard label="On Hold" value={orderStats.onHold} href="/orders?status=on-hold" accent="amber" />
          <StatCard label="Completed" value={orderStats.completed} href="/orders?status=completed" accent="emerald" />
        </div>
      )}

      {/* Product Stats */}
      {productStats.error ? (
        <div className="mb-6 bg-red-50 border border-red-100 rounded-xl p-4 text-sm text-red-600">
          {productStats.error}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
          <StatCard label="Total Products" value={productStats.total} href="/products" />
          <StatCard label="Published" value={productStats.published} href="/products?status=publish" accent="emerald" />
          <StatCard label="Drafts" value={productStats.drafts} href="/products?status=draft" accent="amber" />
        </div>
      )}

      {/* Customer Stats */}
      {!customerStats.error && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
          <StatCard label="Total Customers" value={customerStats.total} href="/customers" accent="blue" />
        </div>
      )}

      {/* Recent Orders + Recent Products side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Recent Orders */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-neutral-900">Recent Orders</h2>
            <Link href="/orders" className="text-xs text-neutral-500 hover:text-neutral-900 transition">
              View all →
            </Link>
          </div>
          <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-sm">
            {recentOrders.length === 0 ? (
              <div className="py-12 text-center text-sm text-neutral-400">
                <svg className="mx-auto mb-2" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
                No orders yet.
              </div>
            ) : (
              <ul className="divide-y divide-neutral-100">
                {recentOrders.map((order) => (
                  <li key={order.id} className="flex items-center gap-3 px-4 py-3 hover:bg-neutral-50 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-neutral-100 border border-neutral-200 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-medium text-neutral-600">{getInitials(order)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Link href="/orders" className="text-sm font-medium text-neutral-900 hover:text-neutral-600 transition-colors">
                          #{order.number}
                        </Link>
                        <OrderStatusBadge status={order.status} />
                      </div>
                      <p className="text-xs text-neutral-400 mt-0.5 truncate">
                        {getCustomerName(order)} · {formatDate(order.date_created)}
                      </p>
                    </div>
                    <div className="text-sm font-medium text-neutral-900">
                      {formatCurrency(order.total)}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Recent Products */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-neutral-900">Recent Products</h2>
            <Link href="/products" className="text-xs text-neutral-500 hover:text-neutral-900 transition">
              View all →
            </Link>
          </div>
          <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-sm">
            {recentProducts.length === 0 ? (
              <div className="py-12 text-center text-sm text-neutral-400">
                No products yet.{' '}
                <Link href="/products/new" className="text-neutral-700 font-medium hover:underline">
                  Add your first product →
                </Link>
              </div>
            ) : (
              <ul className="divide-y divide-neutral-100">
                {recentProducts.map((product) => {
                  const image = product.images[0];
                  const price = product.sale_price || product.regular_price;
                  return (
                    <li key={product.id} className="flex items-center gap-3 px-4 py-3 hover:bg-neutral-50 transition-colors">
                      <div className="w-8 h-8 rounded-lg overflow-hidden bg-neutral-100 border border-neutral-200 flex-shrink-0">
                        {image?.src ? (
                          <Image
                            src={image.src}
                            alt={image.alt || product.name}
                            width={32}
                            height={32}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="2">
                              <rect x="3" y="3" width="18" height="18" rx="2" />
                              <circle cx="8.5" cy="8.5" r="1.5" />
                              <polyline points="21 15 16 10 5 21" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/products/${product.id}/edit`}
                          className="text-sm font-medium text-neutral-900 hover:text-neutral-600 transition-colors line-clamp-1"
                        >
                          {product.name}
                        </Link>
                        <p className="text-xs text-neutral-400 mt-0.5">
                          {product.categories[0]?.name ?? 'Uncategorized'}
                        </p>
                      </div>
                      <div className="text-sm font-medium text-neutral-900 hidden sm:block">
                        {price ? formatCurrency(price) : '—'}
                      </div>
                      <StatusBadge status={product.status} />
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Low Stock Alert */}
      {productStats.lowStock.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-500">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <h2 className="text-sm font-semibold text-neutral-900">Low Stock Alert</h2>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl overflow-hidden">
            <ul className="divide-y divide-amber-100">
              {productStats.lowStock.map((product) => (
                <li key={product.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/products/${product.id}/edit`}
                      className="text-sm font-medium text-neutral-900 hover:text-neutral-600 transition-colors"
                    >
                      {product.name}
                    </Link>
                    <p className="text-xs text-amber-600 mt-0.5">
                      {product.stock_quantity === 0 ? 'Out of stock' : `${product.stock_quantity} left in stock`}
                    </p>
                  </div>
                  <Link
                    href={`/products/${product.id}/edit`}
                    className="text-xs font-medium text-amber-700 hover:text-amber-900 transition-colors"
                  >
                    Update →
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  href,
  accent,
}: {
  label: string;
  value: number;
  href: string;
  accent?: 'emerald' | 'amber' | 'blue';
}) {
  const accentClasses = {
    emerald: 'text-emerald-600',
    amber: 'text-amber-600',
    blue: 'text-blue-600',
  };

  return (
    <Link
      href={href}
      className="bg-white border border-neutral-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow group"
    >
      <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">{label}</p>
      <p className={`mt-2 text-3xl font-semibold tracking-tight ${accent ? accentClasses[accent] : 'text-neutral-900'}`}>
        {value.toLocaleString()}
      </p>
      <p className="mt-2 text-xs text-neutral-400 group-hover:text-neutral-600 transition-colors">
        View all →
      </p>
    </Link>
  );
}
