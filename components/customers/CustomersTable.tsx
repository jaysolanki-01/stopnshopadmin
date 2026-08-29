'use client';

import { useState, useEffect, useCallback } from 'react';
import { CustomerDetailModal } from './CustomerDetailModal';
import { CURRENCY, PAGINATION } from '@/lib/config';
import type { WCCustomer } from '@/types/woocommerce';

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatCurrency(amount: string | number) {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return `${CURRENCY.symbol}0`;
  return `${CURRENCY.symbol}${num.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

function getFullName(customer: WCCustomer) {
  const name = `${customer.first_name} ${customer.last_name}`.trim();
  return name || customer.username || 'Guest';
}

function getInitials(customer: WCCustomer) {
  const f = customer.first_name?.[0] ?? '';
  const l = customer.last_name?.[0] ?? '';
  return (f + l).toUpperCase() || customer.username?.[0]?.toUpperCase() || '?';
}

export function CustomersTable() {
  const [customers, setCustomers] = useState<WCCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState<number>(PAGINATION.defaultPerPage);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<WCCustomer | null>(null);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        per_page: String(perPage),
      });
      if (search) params.set('search', search);

      const res = await fetch(`/api/customers?${params}`);
      const json = await res.json();

      if (!json.success) {
        setError(json.error?.message ?? 'Failed to load customers.');
        return;
      }

      setCustomers(json.data);
      setTotal(json.meta.total);
      setTotalPages(json.meta.totalPages);
    } catch {
      setError('Failed to load customers.');
    } finally {
      setLoading(false);
    }
  }, [page, perPage, search]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  };

  const handlePerPageChange = (newPerPage: number) => {
    setPage(1);
    setPerPage(newPerPage);
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
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
            placeholder="Search by name or email..."
            className="w-full pl-9 pr-8 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-200"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => { setSearchInput(''); setPage(1); setSearch(''); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </form>

        <select
          value={perPage}
          onChange={(e) => handlePerPageChange(Number(e.target.value))}
          className="border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-200"
        >
          {PAGINATION.options.map((n) => (
            <option key={n} value={n}>{n} per page</option>
          ))}
        </select>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-sm text-red-600">{error}</div>
      )}

      {/* Table */}
      <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-100 text-left">
                <th className="px-5 py-3 font-medium text-neutral-500 text-xs uppercase tracking-wide">Customer</th>
                <th className="px-5 py-3 font-medium text-neutral-500 text-xs uppercase tracking-wide hidden sm:table-cell">Email</th>
                <th className="px-5 py-3 font-medium text-neutral-500 text-xs uppercase tracking-wide hidden md:table-cell">Orders</th>
                <th className="px-5 py-3 font-medium text-neutral-500 text-xs uppercase tracking-wide hidden md:table-cell">Spent</th>
                <th className="px-5 py-3 font-medium text-neutral-500 text-xs uppercase tracking-wide hidden lg:table-cell">Registered</th>
                <th className="px-5 py-3 font-medium text-neutral-500 text-xs uppercase tracking-wide w-20"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-5 py-3.5"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-neutral-100" /><div className="h-4 bg-neutral-100 rounded w-28" /></div></td>
                    <td className="px-5 py-3.5 hidden sm:table-cell"><div className="h-4 bg-neutral-100 rounded w-36" /></td>
                    <td className="px-5 py-3.5 hidden md:table-cell"><div className="h-4 bg-neutral-100 rounded w-10" /></td>
                    <td className="px-5 py-3.5 hidden md:table-cell"><div className="h-4 bg-neutral-100 rounded w-16" /></td>
                    <td className="px-5 py-3.5 hidden lg:table-cell"><div className="h-4 bg-neutral-100 rounded w-20" /></td>
                    <td className="px-5 py-3.5"><div className="h-4 bg-neutral-100 rounded w-10" /></td>
                  </tr>
                ))
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-neutral-400">
                    <svg className="mx-auto mb-3" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4-4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" />
                    </svg>
                    {search ? 'No customers match your search.' : 'No customers found.'}
                  </td>
                </tr>
              ) : (
                customers.map((customer) => (
                  <tr
                    key={customer.id}
                    className="hover:bg-neutral-50 transition-colors cursor-pointer group"
                    onClick={() => setSelectedCustomer(customer)}
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-neutral-100 border border-neutral-200 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-medium text-neutral-600">{getInitials(customer)}</span>
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-neutral-900 truncate">{getFullName(customer)}</p>
                          <p className="text-xs text-neutral-400 sm:hidden truncate">{customer.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-neutral-600 hidden sm:table-cell">
                      <span className="truncate block max-w-[200px]">{customer.email}</span>
                    </td>
                    <td className="px-5 py-3.5 hidden md:table-cell">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        customer.orders_count > 0
                          ? 'bg-blue-50 text-blue-700'
                          : 'bg-neutral-50 text-neutral-400'
                      }`}>
                        {customer.orders_count}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-medium text-neutral-900 hidden md:table-cell">
                      {formatCurrency(customer.total_spent)}
                    </td>
                    <td className="px-5 py-3.5 text-neutral-500 hidden lg:table-cell">
                      {formatDate(customer.date_created)}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <span className="text-xs text-neutral-400 group-hover:text-neutral-600 transition-colors font-medium">
                        View →
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {!loading && totalPages > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
          <p className="text-neutral-500 text-xs">
            {total > 0
              ? `Showing ${(page - 1) * perPage + 1}–${Math.min(page * perPage, total)} of ${total.toLocaleString()} customers`
              : 'No customers'}
          </p>
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1.5 border border-neutral-200 rounded-lg text-neutral-600 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition text-sm"
              >
                ← Prev
              </button>
              <span className="text-neutral-500 text-xs px-2">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-3 py-1.5 border border-neutral-200 rounded-lg text-neutral-600 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition text-sm"
              >
                Next →
              </button>
            </div>
          )}
        </div>
      )}

      {/* Detail Modal */}
      {selectedCustomer && (
        <CustomerDetailModal
          customer={selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
        />
      )}
    </div>
  );
}
