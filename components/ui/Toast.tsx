'use client';

import { useEffect, useState } from 'react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error';
  duration?: number;
  onClose: () => void;
}

export function Toast({ message, type = 'success', duration = 4000, onClose }: ToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 200);
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const colors = type === 'success'
    ? 'bg-emerald-900 text-emerald-50'
    : 'bg-red-900 text-red-50';

  const icon = type === 'success'
    ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
    : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>;

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-xs pointer-events-auto">
      <div
        className={[
          'flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg text-sm font-medium transition-all duration-200',
          colors,
          visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2',
        ].join(' ')}
      >
        {icon}
        <span className="line-clamp-2">{message}</span>
      </div>
    </div>
  );
}
