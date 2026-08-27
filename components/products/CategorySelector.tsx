'use client';

import type { WCCategory } from '@/types/woocommerce';

interface CategoryOption extends WCCategory {
  depth: number;
}

function buildHierarchy(categories: WCCategory[]): CategoryOption[] {
  const result: CategoryOption[] = [];

  const addChildren = (parentId: number, depth: number) => {
    categories
      .filter((c) => c.parent === parentId)
      .forEach((c) => {
        result.push({ ...c, depth });
        addChildren(c.id, depth + 1);
      });
  };

  addChildren(0, 0);
  return result;
}

interface CategorySelectorProps {
  categories: WCCategory[];
  value: number | null;
  onChange: (id: number | null) => void;
  disabled?: boolean;
}

export function CategorySelector({ categories, value, onChange, disabled }: CategorySelectorProps) {
  const hierarchy = buildHierarchy(categories);

  if (categories.length === 0) {
    return (
      <p className="mt-1.5 text-xs text-amber-600">
        No categories found. Add categories in WooCommerce first.
      </p>
    );
  }

  return (
    <select
      value={value ?? ''}
      onChange={(e) => {
        const val = e.target.value;
        onChange(val ? Number(val) : null);
      }}
      disabled={disabled}
      className="w-full px-3 py-2.5 text-sm bg-white border border-neutral-200 rounded-lg text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition disabled:opacity-60 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2214%22%20height%3D%2214%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%239ca3af%22%20stroke-width%3D%222.5%22%20stroke-linecap%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%2F%3E%3C%2Fsvg%3E')] bg-[position:right_0.75rem_center] bg-no-repeat pr-8"
    >
      <option value="">Select a category</option>
      {hierarchy.map((cat) => (
        <option key={cat.id} value={cat.id}>
          {cat.depth > 0 ? '  '.repeat(cat.depth) + '└ ' : ''}
          {cat.name}
        </option>
      ))}
    </select>
  );
}
