'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { CURRENCY } from '@/lib/config';
import { OrderStatusBadge } from './OrderStatusBadge';
import type { WCOrder, WCOrderStatus } from '@/types/woocommerce';

const UPDATABLE_STATUSES: { value: WCOrderStatus; label: string }[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'processing', label: 'Processing' },
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
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatPrice(price: string) {
  const num = parseFloat(price);
  if (isNaN(num)) return '—';
  return `${CURRENCY.symbol}${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatAddress(addr: { first_name: string; last_name: string; address_1: string; address_2: string; city: string; state: string; postcode: string; country: string }) {
  const lines = [
    addr.address_1,
    addr.address_2,
    [addr.city, addr.state, addr.postcode].filter(Boolean).join(', '),
    addr.country,
  ].filter(Boolean);
  return lines;
}

function customerName(addr: { first_name: string; last_name: string }) {
  return [addr.first_name, addr.last_name].filter(Boolean).join(' ') || 'Guest';
}

interface OrderDetailModalProps {
  order: WCOrder;
  onClose: () => void;
  onStatusUpdated: (updatedOrder: WCOrder) => void;
}

export function OrderDetailModal({ order, onClose, onStatusUpdated }: OrderDetailModalProps) {
  const [currentStatus, setCurrentStatus] = useState<WCOrderStatus>(order.status);
  const [updating, setUpdating] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [statusSuccess, setStatusSuccess] = useState(false);
  const [trackingId, setTrackingId] = useState('');
  const [trackingLink, setTrackingLink] = useState('');
  const [whatsappSent, setWhatsappSent] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const handleStatusChange = async (newStatus: WCOrderStatus) => {
    if (newStatus === currentStatus) return;

    setUpdating(true);
    setStatusError(null);
    setStatusSuccess(false);

    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();

      if (!data.success) {
        setStatusError(data.error?.message ?? 'Failed to update status.');
        return;
      }

      setCurrentStatus(newStatus);
      setStatusSuccess(true);
      onStatusUpdated(data.data);
      setTimeout(() => setStatusSuccess(false), 3000);
    } catch {
      setStatusError('Network error. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-start justify-center sm:p-4 sm:pt-[8vh]">
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] sm:max-h-[85vh] flex flex-col animate-fade-in">
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-neutral-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-neutral-900 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-semibold text-neutral-900">Order #{order.number}</h2>
              <p className="text-xs text-neutral-400">{formatDate(order.date_created)}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* ── Scrollable content ── */}
        <div className="overflow-y-auto flex-1 px-4 sm:px-6 py-4 sm:py-5 space-y-4 sm:space-y-5">
          {/* Status update */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 bg-neutral-50 rounded-xl px-4 py-3.5">
            <div className="flex items-center gap-2 flex-1">
              <span className="text-sm text-neutral-600">Status:</span>
              <OrderStatusBadge status={currentStatus} />
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="order-status" className="text-xs text-neutral-500 whitespace-nowrap">Change to:</label>
              <select
                id="order-status"
                value={currentStatus}
                onChange={(e) => handleStatusChange(e.target.value as WCOrderStatus)}
                disabled={updating}
                className="px-2.5 py-1.5 text-sm bg-white border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition disabled:opacity-50"
              >
                {UPDATABLE_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
              {updating && (
                <span className="w-4 h-4 border-2 border-neutral-300 border-t-neutral-700 rounded-full animate-spin" />
              )}
            </div>
          </div>

          {/* Status feedback */}
          {statusSuccess && (
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-2.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <p className="text-sm text-emerald-700 font-medium">Order status updated successfully.</p>
            </div>
          )}
          {statusError && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <p className="text-sm text-red-700">{statusError}</p>
            </div>
          )}
          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
            <SummaryCard label="Subtotal" value={formatPrice(order.subtotal)} />
            <SummaryCard
              label="Shipping"
              value={parseFloat(order.shipping_total) > 0 ? formatPrice(order.shipping_total) : 'Free'}
            />
            <SummaryCard label="Payment" value={order.payment_method_title || '—'} />
            <SummaryCard label="Total" value={formatPrice(order.total)} highlight />
          </div>

          {/* ── Customer ── */}
          <Section title="Customer Details">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <AddressCard
                title="Billing Address"
                name={customerName(order.billing)}
                address={formatAddress(order.billing)}
                email={order.billing.email}
                phone={order.billing.phone}
              />
              <AddressCard
                title="Shipping Address"
                name={customerName(order.shipping)}
                address={formatAddress(order.shipping)}
                phone={order.shipping.phone}
                fallback={formatAddress(order.shipping).length === 0}
              />
            </div>
          </Section>

          {/* Customer note */}
          {order.customer_note && (
            <div className="flex gap-3 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
              <svg className="flex-shrink-0 mt-0.5 text-amber-500" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
              </svg>
              <div>
                <p className="text-xs font-semibold text-amber-700 mb-0.5">Customer Note</p>
                <p className="text-sm text-amber-800">{order.customer_note}</p>
              </div>
            </div>
          )}

          {/* ── Items ── */}
          <Section title={`Items (${order.line_items.length})`}>
            <div className="border border-neutral-200 rounded-xl overflow-hidden overflow-x-auto">
              <table className="w-full text-sm min-w-[400px]">
                <thead>
                  <tr className="bg-neutral-50 border-b border-neutral-100">
                    <th className="text-left text-xs font-medium text-neutral-500 px-4 py-2.5" colSpan={2}>Product</th>
                    <th className="text-center text-xs font-medium text-neutral-500 px-3 py-2.5 w-16">Qty</th>
                    <th className="text-right text-xs font-medium text-neutral-500 px-4 py-2.5 w-24">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {order.line_items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-3 w-12">
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-neutral-100 border border-neutral-200 flex-shrink-0">
                          {item.image?.src ? (
                            <Image
                              src={item.image.src}
                              alt={item.name}
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
                      <td className="px-2 py-3">
                        <p className="text-sm font-medium text-neutral-900">{item.name}</p>
                        {item.sku && <p className="text-xs text-neutral-400 font-mono">SKU: {item.sku}</p>}
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className="inline-flex items-center justify-center w-7 h-7 text-xs font-medium text-neutral-700 bg-neutral-100 rounded-lg">
                          {item.quantity}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-sm font-medium text-neutral-900">{formatPrice(item.total)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          {/* ── Order totals ── */}
          <div className="bg-neutral-50 rounded-xl px-5 py-4 space-y-2.5">
            <TotalRow label="Subtotal" value={formatPrice(order.subtotal)} />
            {parseFloat(order.discount_total) > 0 && (
              <TotalRow label="Discount" value={`-${formatPrice(order.discount_total)}`} accent="emerald" />
            )}
            {parseFloat(order.shipping_total) > 0 && (
              <TotalRow label="Shipping" value={formatPrice(order.shipping_total)} />
            )}
            {parseFloat(order.total_tax) > 0 && (
              <TotalRow label="Tax" value={formatPrice(order.total_tax)} />
            )}
            <div className="pt-2.5 border-t border-neutral-200">
              <TotalRow label="Total" value={formatPrice(order.total)} bold />
            </div>
          </div>

          {/* ── Timeline ── */}
          {(order.date_paid || order.date_completed) && (
            <Section title="Timeline">
              <div className="space-y-3">
                <TimelineItem label="Order placed" date={order.date_created} />
                {order.date_paid && <TimelineItem label="Payment received" date={order.date_paid} />}
                {order.date_completed && <TimelineItem label="Order completed" date={order.date_completed} />}
              </div>
            </Section>
          )}

          {/* ── WhatsApp Shipping ── */}
          <Section title="Send Tracking via WhatsApp">
            <div className="bg-neutral-50 rounded-xl p-4 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-medium text-neutral-500 uppercase tracking-wide mb-1">
                    Tracking ID
                  </label>
                  <input
                    type="text"
                    value={trackingId}
                    onChange={(e) => { setTrackingId(e.target.value); setWhatsappSent(false); }}
                    placeholder="e.g. AWB123456789"
                    className="w-full px-3 py-2 text-sm bg-white border border-neutral-200 rounded-lg text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-neutral-500 uppercase tracking-wide mb-1">
                    Tracking Link <span className="text-neutral-400 normal-case">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={trackingLink}
                    onChange={(e) => { setTrackingLink(e.target.value); setWhatsappSent(false); }}
                    placeholder="e.g. https://track.delhivery.com/..."
                    className="w-full px-3 py-2 text-sm bg-white border border-neutral-200 rounded-lg text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition"
                  />
                </div>
              </div>

              {/* Customer phone display */}
              <div className="flex items-center gap-2 text-xs text-neutral-500">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-neutral-400">
                  <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
                </svg>
                Sending to: <span className="font-medium text-neutral-700">{order.billing.phone || 'No phone on file'}</span>
              </div>

              {/* Send button */}
              <button
                type="button"
                onClick={() => {
                  const phone = (order.billing.phone || '').replace(/[^0-9]/g, '');
                  if (!phone) return;
                  const name = customerName(order.billing);
                  const items = order.line_items.map((i) => `${i.name} x${i.quantity}`).join('\n  ');
                  let msg = `Hi ${name}! 👋\n\nYour order *#${order.number}* from *Stop & Shop* has been shipped! 🚚\n\n📦 *Order Details:*\n  ${items}\n💰 *Total:* ${formatPrice(order.total)}`;
                  if (trackingId.trim()) {
                    msg += `\n\n📋 *Tracking ID:* ${trackingId.trim()}`;
                  }
                  if (trackingLink.trim()) {
                    msg += `\n🔗 *Track here:* ${trackingLink.trim()}`;
                  }
                  msg += `\n\nThank you for shopping with us! 🙏`;
                  const waUrl = `https://wa.me/${phone.startsWith('91') ? phone : '91' + phone}?text=${encodeURIComponent(msg)}`;
                  window.open(waUrl, '_blank', 'noopener');
                  setWhatsappSent(true);
                }}
                disabled={!trackingId.trim() || !order.billing.phone}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition disabled:opacity-40 disabled:cursor-not-allowed bg-[#25D366] text-white hover:bg-[#1fba59] shadow-sm"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                {whatsappSent ? 'Sent — Open Again' : 'Send via WhatsApp'}
              </button>

              {whatsappSent && (
                <p className="text-xs text-emerald-600 text-center">WhatsApp opened with tracking details.</p>
              )}
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-3">{title}</h3>
      {children}
    </div>
  );
}

function SummaryCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 ${highlight ? 'bg-neutral-900 text-white' : 'bg-neutral-50'}`}>
      <p className={`text-[10px] sm:text-xs ${highlight ? 'text-neutral-400' : 'text-neutral-500'}`}>{label}</p>
      <p className={`text-xs sm:text-sm font-semibold mt-0.5 truncate ${highlight ? 'text-white' : 'text-neutral-900'}`}>{value}</p>
    </div>
  );
}

function AddressCard({
  title,
  name,
  address,
  email,
  phone,
  fallback,
}: {
  title: string;
  name: string;
  address: string[];
  email?: string;
  phone?: string;
  fallback?: boolean;
}) {
  return (
    <div className="bg-neutral-50 rounded-xl p-4">
      <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-2">{title}</p>
      {fallback ? (
        <p className="text-sm text-neutral-400 italic">Same as billing</p>
      ) : (
        <>
          <p className="text-sm font-medium text-neutral-900 mb-1">{name}</p>
          <div className="space-y-0.5 text-sm text-neutral-600">
            {address.map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>
          {(email || phone) && (
            <div className="mt-3 pt-3 border-t border-neutral-200 space-y-1">
              {email && (
                <div className="flex items-center gap-2 text-sm text-neutral-600">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-neutral-400 flex-shrink-0">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                  {email}
                </div>
              )}
              {phone && (
                <div className="flex items-center gap-2 text-sm text-neutral-600">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-neutral-400 flex-shrink-0">
                    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
                  </svg>
                  {phone}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function TotalRow({ label, value, bold, accent }: { label: string; value: string; bold?: boolean; accent?: string }) {
  const valueColor = accent === 'emerald' ? 'text-emerald-600' : bold ? 'text-neutral-900' : 'text-neutral-700';
  return (
    <div className="flex justify-between items-center">
      <span className={`text-sm ${bold ? 'font-semibold text-neutral-900' : 'text-neutral-500'}`}>{label}</span>
      <span className={`text-sm ${bold ? 'font-semibold text-lg' : 'font-medium'} ${valueColor}`}>{value}</span>
    </div>
  );
}

function TimelineItem({ label, date }: { label: string; date: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-2 h-2 rounded-full bg-neutral-300 flex-shrink-0" />
      <div className="flex-1 flex items-center justify-between">
        <span className="text-sm text-neutral-700">{label}</span>
        <span className="text-xs text-neutral-400">{formatDate(date)}</span>
      </div>
    </div>
  );
}
