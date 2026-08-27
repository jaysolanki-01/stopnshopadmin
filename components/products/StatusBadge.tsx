import type { WCProductStatus } from '@/types/woocommerce';

const STATUS_CONFIG: Record<
  WCProductStatus,
  { label: string; className: string }
> = {
  publish: { label: 'Published', className: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
  draft:   { label: 'Draft',     className: 'bg-neutral-100 text-neutral-500 border-neutral-200' },
  pending: { label: 'Pending',   className: 'bg-amber-50 text-amber-700 border-amber-100' },
  private: { label: 'Private',   className: 'bg-purple-50 text-purple-700 border-purple-100' },
  trash:   { label: 'Trashed',   className: 'bg-red-50 text-red-600 border-red-100' },
};

export function StatusBadge({ status }: { status: WCProductStatus }) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.draft;
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${config.className}`}
    >
      {config.label}
    </span>
  );
}
