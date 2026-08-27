'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { APP_NAME } from '@/lib/config';

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = (await res.json()) as { success: boolean; error?: string };

      if (!data.success) {
        setError(data.error ?? 'Incorrect password. Please try again.');
        setPassword('');
        inputRef.current?.focus();
        return;
      }

      const from = searchParams.get('from');
      router.push(from && from !== '/login' ? from : '/dashboard');
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Image
            src="/logo.png"
            alt={APP_NAME}
            width={220}
            height={60}
            className="h-12 w-auto"
            priority
          />
        </div>

        <div className="bg-white border border-neutral-200 rounded-2xl shadow-sm px-8 py-8">
          <h1 className="text-lg font-semibold text-neutral-900 mb-1">{APP_NAME}</h1>
          <p className="text-sm text-neutral-500 mb-6">Enter your password to continue.</p>

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div>
              <label
                htmlFor="password"
                className="block text-xs font-medium text-neutral-700 mb-1.5"
              >
                Password
              </label>
              <input
                ref={inputRef}
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                autoComplete="current-password"
                disabled={loading}
                className={[
                  'w-full px-3 py-2.5 text-sm bg-white border rounded-lg text-neutral-900',
                  'placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900',
                  'focus:border-transparent transition disabled:opacity-60',
                  error ? 'border-red-300' : 'border-neutral-200',
                ].join(' ')}
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-red-600">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="flex-shrink-0">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !password}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm"
            >
              {loading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Signing in…
                </>
              ) : 'Sign in'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-neutral-400 mt-6">
          {APP_NAME} — Admin access only
        </p>
      </div>
    </div>
  );
}
