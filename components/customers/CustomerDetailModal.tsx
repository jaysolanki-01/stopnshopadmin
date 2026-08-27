'use client';

import { useEffect, useState, useCallback } from 'react';
import { OrderStatusBadge } from '@/components/orders/OrderStatusBadge';
import type { WCCustomer, WCOrder } from '@/types/woocommerce';
import { CURRENCY } from '@/lib/config';

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
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

function formatAddress(addr: { address_1: string; address_2: string; city: string; state: string; postcode: string; country: string }) {
  const parts = [addr.address_1, addr.address_2, addr.city, addr.state, addr.postcode, addr.country].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : null;
}

interface CustomerDetailModalProps {
  customer: WCCustomer;
  onClose: () => void;
}

export function CustomerDetailModal({ customer, onClose }: CustomerDetailModalProps) {
  const [orders, setOrders] = useState<WCOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    if (customer.id === 0) {
      setOrdersLoading(false);
      return;
    }
    try {
      const res = await fetch(`/api/customers/${customer.id}/orders`);
      const json = await res.json();
      if (json.success) setOrders(json.data);
    } catch {
      // silently fail
    } finally {
      setOrdersLoading(false);
    }
  }, [customer.id]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const billingAddress = formatAddress(customer.billing);
  const shippingAddress = formatAddress(customer.shipping);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[5vh] px-4" onClick={onClose}>
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-neutral-100 px-6 py-4 rounded-t-2xl flex items-center gap-4 z-10">
          <div className="w-12 h-12 rounded-full bg-neutral-100 border border-neutral-200 flex items-center justify-center flex-shrink-0">
            <span className="text-base font-semibold text-neutral-600">{getInitials(customer)}</span>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-semibold text-neutral-900 truncate">{getFullName(customer)}</h2>
            <p className="text-xs text-neutral-500">{customer.email}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-neutral-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-semibold text-neutral-900">{customer.orders_count}</p>
              <p className="text-xs text-neutral-500 mt-0.5">Orders</p>
            </div>
            <div className="bg-neutral-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-semibold text-emerald-600">{formatCurrency(customer.total_spent)}</p>
              <p className="text-xs text-neutral-500 mt-0.5">Total Spent</p>
            </div>
            <div className="bg-neutral-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-semibold text-neutral-900">
                {customer.is_paying_customer ? (
                  <span className="text-emerald-600">Yes</span>
                ) : (
                  <span className="text-neutral-400">No</span>
                )}
              </p>
              <p className="text-xs text-neutral-500 mt-0.5">Paying</p>
            </div>
          </div>

          {/* Order & Payment History */}
          <div>
            <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-3">
              Order & Payment History
            </h3>
            {ordersLoading ? (
              <div className="space-y-2">
                {[1, 2].map((i) => (
                  <div key={i} className="bg-neutral-50 rounded-xl p-4 animate-pulse">
                    <div className="h-4 bg-neutral-200 rounded w-24 mb-2" />
                    <div className="h-3 bg-neutral-100 rounded w-40" />
                  </div>
                ))}
              </div>
            ) : orders.length === 0 ? (
              <div className="bg-neutral-50 rounded-xl p-4 text-center text-sm text-neutral-400">
                No orders yet
              </div>
            ) : (
              <div className="space-y-2">
                {orders.map((order) => (
                  <div key={order.id} className="bg-neutral-50 rounded-xl p-4">
                    {/* Order header */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-neutral-900">#{order.number}</span>
                        <OrderStatusBadge status={order.status} />
                      </div>
                      <span className="text-sm font-semibold text-neutral-900">{formatCurrency(order.total)}</span>
                    </div>

                    {/* Order details */}
                    <div className="space-y-1.5 text-xs">
                      <div className="flex items-center justify-between text-neutral-500">
                        <span>Date</span>
                        <span className="text-neutral-700">{formatDateTime(order.date_created)}</span>
                      </div>

                      {/* Payment Method */}
                      <div className="flex items-center justify-between text-neutral-500">
                        <span>Payment</span>
                        <span className="text-neutral-700">{order.payment_method_title || order.payment_method || '—'}</span>
                      </div>

                      {/* Razorpay / Transaction ID */}
                      {order.transaction_id && (
                        <div className="flex items-center justify-between text-neutral-500">
                          <span>Transaction ID</span>
                          <span className="text-neutral-700 font-mono text-[11px]">{order.transaction_id}</span>
                        </div>
                      )}

                      {/* Payment date */}
                      {order.date_paid && (
                        <div className="flex items-center justify-between text-neutral-500">
                          <span>Paid on</span>
                          <span className="text-neutral-700">{formatDateTime(order.date_paid)}</span>
                        </div>
                      )}

                      {/* Items summary */}
                      <div className="flex items-start justify-between text-neutral-500 pt-1 border-t border-neutral-200 mt-1.5">
                        <span>Items</span>
                        <span className="text-neutral-700 text-right">
                          {order.line_items.slice(0, 2).map((item) => item.name).join(', ')}
                          {order.line_items.length > 2 && ` +${order.line_items.length - 2} more`}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Account Info */}
          <div>
            <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-3">Account Info</h3>
            <div className="bg-neutral-50 rounded-xl p-4 space-y-2.5">
              <InfoRow label="Username" value={customer.username || '—'} />
              <InfoRow label="Role" value={customer.role} />
              <InfoRow label="Registered" value={formatDate(customer.date_created)} />
              <InfoRow label="Last Active" value={formatDate(customer.date_modified)} />
            </div>
          </div>

          {/* Billing Details */}
          <div>
            <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-3">Billing Details</h3>
            <div className="bg-neutral-50 rounded-xl p-4 space-y-2.5">
              <InfoRow label="Name" value={`${customer.billing.first_name} ${customer.billing.last_name}`.trim() || '—'} />
              {customer.billing.company && <InfoRow label="Company" value={customer.billing.company} />}
              {customer.billing.email && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-500">Email</span>
                  <a href={`mailto:${customer.billing.email}`} className="text-neutral-900 hover:text-blue-600 transition-colors">
                    {customer.billing.email}
                  </a>
                </div>
              )}
              {customer.billing.phone && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-500">Phone</span>
                  <a href={`tel:${customer.billing.phone}`} className="text-neutral-900 hover:text-blue-600 transition-colors">
                    {customer.billing.phone}
                  </a>
                </div>
              )}
              {billingAddress && <InfoRow label="Address" value={billingAddress} />}
            </div>
          </div>

          {/* Shipping Details */}
          {shippingAddress && (
            <div>
              <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-3">Shipping Address</h3>
              <div className="bg-neutral-50 rounded-xl p-4 space-y-2.5">
                <InfoRow label="Name" value={`${customer.shipping.first_name} ${customer.shipping.last_name}`.trim() || '—'} />
                {customer.shipping.company && <InfoRow label="Company" value={customer.shipping.company} />}
                <InfoRow label="Address" value={shippingAddress} />
                {customer.shipping.phone && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-neutral-500">Phone</span>
                    <a href={`tel:${customer.shipping.phone}`} className="text-neutral-900 hover:text-blue-600 transition-colors">
                      {customer.shipping.phone}
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between text-sm gap-4">
      <span className="text-neutral-500 flex-shrink-0">{label}</span>
      <span className="text-neutral-900 text-right">{value}</span>
    </div>
  );
}
