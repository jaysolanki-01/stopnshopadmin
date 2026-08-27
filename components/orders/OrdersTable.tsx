'use client';

import { useState, useEffect, useCallback } from 'react';
import { OrderStatusBadge } from './OrderStatusBadge';
import { OrderDetailModal } from './OrderDetailModal';
import { CURRENCY, PAGINATION } from '@/lib/config';
import type { WCOrder } from '@/types/woocommerce';

const ORDER_STATUSES: { value: string; label: string }[] = [
  { value: '', label: 'All Orders' },
  { value: 'processing', label: 'Processing' },
  { value: 'pending', label: 'Pending' },
  { value: 'on-hold', label: 'On Hold' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'refunded', label: 'Refunded' },
  { value: 'failed', label: 'Failed' },
];

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatPrice(price: string) {
  const num = parseFloat(price);
  if (isNaN(num)) return '—';
  return `${CURRENCY.symbol}${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function customerName(order: WCOrder): string {
  const name = [order.billing.first_name, order.billing.last_name].filter(Boolean).join(' ');
  return name || 'Guest';
}

function itemsSummary(order: WCOrder): string {
  if (order.line_items.length === 0) return '—';
  const first = order.line_items[0].name;
  if (order.line_items.length === 1) return first;
  return `${first} +${order.line_items.length - 1} more`;
}

export function OrdersTable() {
  const [orders, setOrders] = useState<WCOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [perPage, setPerPage] = useState(PAGINATION.defaultPerPage);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<WCOrder | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        per_page: String(perPage),
      });
      if (status) params.set('status', status);
      if (search) params.set('search', search);

      const res = await fetch(`/api/orders?${params}`);
      const data = await res.json();

      if (!data.success) {
        setError(data.error?.message ?? 'Failed to load orders.');
        return;
      }

      setOrders(data.data);
      setTotal(data.meta.total);
      setTotalPages(data.meta.totalPages);
    } catch {
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }, [page, perPage, status, search]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setPage(1);
    setSearch('');
  };

  const handleStatusChange = (newStatus: string) => {
    setPage(1);
    setStatus(newStatus);
  };

  const handlePerPageChange = (newPerPage: number) => {
    setPage(1);
    setPerPage(newPerPage);
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearch} className="flex-1 relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
            width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
          >
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by order number, customer name or email…"
            className="w-full pl-9 pr-8 py-2.5 text-sm bg-white border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition"
          />
          {searchInput && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded text-neutral-400 hover:text-neutral-600"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </form>

        <select
          value={status}
          onChange={(e) => handleStatusChange(e.target.value)}
          className="px-3 py-2.5 text-sm bg-white border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition"
        >
          {ORDER_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>

        <select
          value={perPage}
          onChange={(e) => handlePerPageChange(Number(e.target.value))}
          className="px-3 py-2.5 text-sm bg-white border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition"
        >
          {PAGINATION.options.map((n) => (
            <option key={n} value={n}>{n} per page</option>
          ))}
        </select>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <svg className="flex-shrink-0 mt-0.5 text-red-500" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <OrderTableSkeleton />
        ) : orders.length === 0 ? (
          <div className="py-20 text-center">
            <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-4">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
            </div>
            <p className="text-sm font-medium text-neutral-700">
              {search || status ? 'No orders match your filters' : 'No orders yet'}
            </p>
            <p className="mt-1 text-xs text-neutral-400">
              {search || status ? 'Try a different search term or status filter.' : 'Orders will appear here when customers place them.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-100 bg-neutral-50">
                  <th className="text-left text-xs font-medium text-neutral-500 px-4 py-3">Order</th>
                  <th className="text-left text-xs font-medium text-neutral-500 px-4 py-3">Customer</th>
                  <th className="text-left text-xs font-medium text-neutral-500 px-4 py-3 hidden lg:table-cell">Items</th>
                  <th className="text-left text-xs font-medium text-neutral-500 px-4 py-3 hidden sm:table-cell">Total</th>
                  <th className="text-left text-xs font-medium text-neutral-500 px-4 py-3">Status</th>
                  <th className="text-left text-xs font-medium text-neutral-500 px-4 py-3 hidden md:table-cell">Date</th>
                  <th className="text-right text-xs font-medium text-neutral-500 px-4 py-3 w-20">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {orders.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-neutral-50 transition-colors group cursor-pointer"
                    onClick={() => setSelectedOrder(order)}
                  >
                    {/* Order number */}
                    <td className="px-4 py-3.5">
                      <span className="text-sm font-semibold text-neutral-900">#{order.number}</span>
                    </td>

                    {/* Customer */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-neutral-100 border border-neutral-200 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-semibold text-neutral-500">
                            {customerName(order).charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-neutral-900 truncate">{customerName(order)}</p>
                          <p className="text-xs text-neutral-400 truncate">{order.billing.email || order.billing.phone || '—'}</p>
                        </div>
                      </div>
                    </td>

                    {/* Items */}
                    <td className="px-4 py-3.5 hidden lg:table-cell">
                      <p className="text-sm text-neutral-600 truncate max-w-[200px]">{itemsSummary(order)}</p>
                      <p className="text-xs text-neutral-400">
                        {order.line_items.length} item{order.line_items.length !== 1 ? 's' : ''}
                      </p>
                    </td>

                    {/* Total */}
                    <td className="px-4 py-3.5 hidden sm:table-cell">
                      <span className="text-sm font-medium text-neutral-900">{formatPrice(order.total)}</span>
                      {order.payment_method_title && (
                        <p className="text-xs text-neutral-400 truncate max-w-[120px]">{order.payment_method_title}</p>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3.5">
                      <OrderStatusBadge status={order.status} />
                    </td>

                    {/* Date */}
                    <td className="px-4 py-3.5 hidden md:table-cell">
                      <p className="text-sm text-neutral-700">{formatDate(order.date_created)}</p>
                      <p className="text-xs text-neutral-400">{formatTime(order.date_created)}</p>
                    </td>

                    {/* View button */}
                    <td className="px-4 py-3.5 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedOrder(order);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-neutral-600 bg-neutral-100 rounded-lg hover:bg-neutral-200 lg:opacity-0 lg:group-hover:opacity-100 transition"
                      >
                        View
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-neutral-500">
            Showing {(page - 1) * perPage + 1}–{Math.min(page * perPage, total)} of {total.toLocaleString()} orders
          </p>
          <div className="flex gap-1.5">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm border border-neutral-200 rounded-lg bg-white hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
              Previous
            </button>
            <div className="flex items-center px-3 text-xs text-neutral-500">
              Page {page} of {totalPages}
            </div>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm border border-neutral-200 rounded-lg bg-white hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              Next
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Total count when not paginated */}
      {!loading && totalPages <= 1 && total > 0 && (
        <p className="text-xs text-neutral-500">{total.toLocaleString()} order{total !== 1 ? 's' : ''}</p>
      )}

      {/* Detail modal */}
      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onStatusUpdated={(updatedOrder) => {
            setOrders((prev) =>
              prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o))
            );
            setSelectedOrder(updatedOrder);
          }}
        />
      )}
    </div>
  );
}

function OrderTableSkeleton() {
  return (
    <>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-neutral-100 bg-neutral-50">
            <th className="text-left text-xs font-medium text-neutral-500 px-4 py-3">Order</th>
            <th className="text-left text-xs font-medium text-neutral-500 px-4 py-3">Customer</th>
            <th className="text-left text-xs font-medium text-neutral-500 px-4 py-3 hidden lg:table-cell">Items</th>
            <th className="text-left text-xs font-medium text-neutral-500 px-4 py-3 hidden sm:table-cell">Total</th>
            <th className="text-left text-xs font-medium text-neutral-500 px-4 py-3">Status</th>
            <th className="text-left text-xs font-medium text-neutral-500 px-4 py-3 hidden md:table-cell">Date</th>
            <th className="text-right text-xs font-medium text-neutral-500 px-4 py-3 w-20">Details</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100">
          {Array.from({ length: 6 }).map((_, i) => (
            <tr key={i} className="animate-pulse">
              <td className="px-4 py-3.5"><div className="h-4 w-12 bg-neutral-100 rounded" /></td>
              <td className="px-4 py-3.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-neutral-100 rounded-full" />
                  <div className="space-y-1.5">
                    <div className="h-3.5 w-24 bg-neutral-100 rounded" />
                    <div className="h-3 w-32 bg-neutral-50 rounded" />
                  </div>
                </div>
              </td>
              <td className="px-4 py-3.5 hidden lg:table-cell"><div className="h-4 w-28 bg-neutral-100 rounded" /></td>
              <td className="px-4 py-3.5 hidden sm:table-cell"><div className="h-4 w-16 bg-neutral-100 rounded" /></td>
              <td className="px-4 py-3.5"><div className="h-5 w-16 bg-neutral-100 rounded-full" /></td>
              <td className="px-4 py-3.5 hidden md:table-cell"><div className="h-4 w-20 bg-neutral-100 rounded" /></td>
              <td className="px-4 py-3.5"><div className="h-4 w-8 bg-neutral-100 rounded ml-auto" /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
