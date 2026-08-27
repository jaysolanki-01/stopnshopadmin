import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6 animate-fade-in">
      <div className="w-14 h-14 rounded-full bg-neutral-100 flex items-center justify-center mb-5">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M16 16s-1.5-2-4-2-4 2-4 2" />
          <line x1="9" y1="9" x2="9.01" y2="9" />
          <line x1="15" y1="9" x2="15.01" y2="9" />
        </svg>
      </div>
      <h1 className="text-lg font-semibold text-neutral-900 mb-1">Page not found</h1>
      <p className="text-sm text-neutral-500 mb-6 max-w-xs">
        The page you're looking for doesn't exist or may have been moved.
      </p>
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-medium bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition shadow-sm"
      >
        Go to Dashboard
      </Link>
    </div>
  );
}
