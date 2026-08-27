interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return <div className={`skeleton ${className}`} />;
}

export function ProductTableSkeleton() {
  return (
    <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-sm">
      <div className="border-b border-neutral-100 bg-neutral-50 px-4 py-3">
        <div className="flex gap-4">
          <Skeleton className="h-3 w-10" />
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-14 hidden md:block" />
          <Skeleton className="h-3 w-16 hidden lg:block" />
          <Skeleton className="h-3 w-14 hidden sm:block" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-3.5 border-b border-neutral-50 last:border-0">
          <Skeleton className="w-10 h-10 rounded-lg flex-shrink-0" />
          <Skeleton className="h-4 w-40 flex-1" />
          <Skeleton className="h-3 w-16 hidden md:block" />
          <Skeleton className="h-3 w-20 hidden lg:block" />
          <Skeleton className="h-4 w-14 hidden sm:block" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      ))}
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white border border-neutral-200 rounded-xl p-5 shadow-sm">
            <Skeleton className="h-3 w-24 mb-3" />
            <Skeleton className="h-8 w-16 mb-3" />
            <Skeleton className="h-3 w-14" />
          </div>
        ))}
      </div>
      <div>
        <Skeleton className="h-4 w-32 mb-4" />
        <ProductTableSkeleton />
      </div>
    </div>
  );
}
