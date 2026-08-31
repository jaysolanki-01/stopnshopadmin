'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useRef, useState, useCallback } from 'react';

const STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'publish', label: 'Published' },
  { value: 'draft', label: 'Draft' },
  { value: 'pending', label: 'Pending' },
];

interface CategoryOption {
  id: number;
  name: string;
}

interface ProductSearchProps {
  defaultSearch?: string;
  defaultStatus?: string;
  defaultCategory?: string;
  categories?: CategoryOption[];
}

export function ProductSearch({ defaultSearch = '', defaultStatus = '', defaultCategory = '', categories = [] }: ProductSearchProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(defaultSearch);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.delete('page'); // reset pagination on filter change
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams],
  );

  const handleSearchChange = (value: string) => {
    setSearch(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => updateParam('search', value.trim()), 400);
  };

  const handleStatusChange = (value: string) => {
    updateParam('status', value);
  };

  const handleCategoryChange = (value: string) => {
    updateParam('category', value);
  };

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      {/* Search input */}
      <div className="relative flex-1">
        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-neutral-400">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>
        <input
          type="search"
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Search products by name or SKU…"
          className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-neutral-200 rounded-lg placeholder-neutral-400 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition"
        />
      </div>

      {/* Status filter */}
      <div className="relative">
        <select
          defaultValue={defaultStatus}
          onChange={(e) => handleStatusChange(e.target.value)}
          className="appearance-none pl-3 pr-8 py-2.5 text-sm bg-white border border-neutral-200 rounded-lg text-neutral-700 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition cursor-pointer"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-2.5 flex items-center pointer-events-none text-neutral-400">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </div>

      {/* Category filter */}
      {categories.length > 0 && (
        <div className="relative">
          <select
            defaultValue={defaultCategory}
            onChange={(e) => handleCategoryChange(e.target.value)}
            className="appearance-none pl-3 pr-8 py-2.5 text-sm bg-white border border-neutral-200 rounded-lg text-neutral-700 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition cursor-pointer"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={String(cat.id)}>
                {cat.name}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-2.5 flex items-center pointer-events-none text-neutral-400">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
}
