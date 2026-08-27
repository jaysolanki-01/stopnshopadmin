import type { WCOrderStatus } from '@/types/woocommerce';

const STATUS_MAP: Record<WCOrderStatus, { label: string; className: string }> = {
  pending: { label: 'Pending', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  processing: { label: 'Processing', className: 'bg-blue-50 text-blue-700 border-blue-200' },
  'on-hold': { label: 'On Hold', className: 'bg-orange-50 text-orange-700 border-orange-200' },
  completed: { label: 'Completed', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  cancelled: { label: 'Cancelled', className: 'bg-neutral-50 text-neutral-500 border-neutral-200' },
  refunded: { label: 'Refunded', className: 'bg-purple-50 text-purple-700 border-purple-200' },
  failed: { label: 'Failed', className: 'bg-red-50 text-red-700 border-red-200' },
  trash: { label: 'Trash', className: 'bg-neutral-50 text-neutral-400 border-neutral-200' },
};

export function OrderStatusBadge({ status }: { status: WCOrderStatus }) {
  const config = STATUS_MAP[status] ?? STATUS_MAP.pending;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full border ${config.className}`}>
      {config.label}
    </span>
  );
}
