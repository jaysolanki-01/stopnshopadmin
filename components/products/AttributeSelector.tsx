'use client';

import { useState, useEffect } from 'react';

interface AttributeTerm {
  id: number;
  name: string;
  slug: string;
}

interface Attribute {
  id: number;
  name: string;
  slug: string;
  terms: AttributeTerm[];
}

export interface SelectedAttribute {
  id: number;
  name: string;
  visible: boolean;
  options: string[];
}

interface AttributeSelectorProps {
  value: SelectedAttribute[];
  onChange: (attrs: SelectedAttribute[]) => void;
  disabled?: boolean;
}

export function AttributeSelector({ value, onChange, disabled }: AttributeSelectorProps) {
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/attributes')
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setAttributes(json.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const toggleAttribute = (attr: Attribute) => {
    const existing = value.find((a) => a.id === attr.id);
    if (existing) {
      onChange(value.filter((a) => a.id !== attr.id));
    } else {
      onChange([...value, { id: attr.id, name: attr.name, visible: true, options: [] }]);
    }
  };

  const toggleTerm = (attrId: number, termName: string) => {
    onChange(
      value.map((a) => {
        if (a.id !== attrId) return a;
        const has = a.options.includes(termName);
        return {
          ...a,
          options: has ? a.options.filter((o) => o !== termName) : [...a.options, termName],
        };
      })
    );
  };

  const toggleVisible = (attrId: number) => {
    onChange(
      value.map((a) => (a.id === attrId ? { ...a, visible: !a.visible } : a))
    );
  };

  const selectAllTerms = (attrId: number) => {
    const attr = attributes.find((a) => a.id === attrId);
    if (!attr) return;
    onChange(
      value.map((a) =>
        a.id === attrId ? { ...a, options: attr.terms.map((t) => t.name) } : a
      )
    );
  };

  const clearAllTerms = (attrId: number) => {
    onChange(
      value.map((a) => (a.id === attrId ? { ...a, options: [] } : a))
    );
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-2">
        <div className="h-10 bg-neutral-100 rounded-lg" />
        <div className="h-10 bg-neutral-100 rounded-lg" />
      </div>
    );
  }

  if (attributes.length === 0) {
    return (
      <p className="text-sm text-neutral-400">No attributes found in WooCommerce.</p>
    );
  }

  return (
    <div className="space-y-3">
      {attributes.map((attr) => {
        const selected = value.find((a) => a.id === attr.id);
        const isActive = !!selected;

        return (
          <div key={attr.id} className="border border-neutral-200 rounded-lg overflow-hidden">
            {/* Attribute header */}
            <button
              type="button"
              onClick={() => toggleAttribute(attr)}
              disabled={disabled}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-neutral-50 transition-colors disabled:opacity-50"
            >
              <div className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                  isActive ? 'bg-neutral-900 border-neutral-900' : 'border-neutral-300'
                }`}>
                  {isActive && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </div>
                <span className="text-sm font-medium text-neutral-900">{attr.name}</span>
              </div>
              <span className="text-xs text-neutral-400">
                {attr.terms.length} option{attr.terms.length !== 1 ? 's' : ''}
              </span>
            </button>

            {/* Attribute terms */}
            {isActive && (
              <div className="border-t border-neutral-100 px-4 py-3 bg-neutral-50">
                {/* Controls */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selected.visible}
                        onChange={() => toggleVisible(attr.id)}
                        disabled={disabled}
                        className="w-3.5 h-3.5 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900"
                      />
                      <span className="text-xs text-neutral-500">Visible on product page</span>
                    </label>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => selectAllTerms(attr.id)}
                      disabled={disabled}
                      className="text-neutral-500 hover:text-neutral-900 transition-colors disabled:opacity-50"
                    >
                      Select all
                    </button>
                    <span className="text-neutral-300">|</span>
                    <button
                      type="button"
                      onClick={() => clearAllTerms(attr.id)}
                      disabled={disabled}
                      className="text-neutral-500 hover:text-neutral-900 transition-colors disabled:opacity-50"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                {/* Term chips */}
                <div className="flex flex-wrap gap-1.5">
                  {attr.terms.map((term) => {
                    const isSelected = selected.options.includes(term.name);
                    return (
                      <button
                        key={term.id}
                        type="button"
                        onClick={() => toggleTerm(attr.id, term.name)}
                        disabled={disabled}
                        className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium border transition-colors disabled:opacity-50 ${
                          isSelected
                            ? 'bg-neutral-900 text-white border-neutral-900'
                            : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-400'
                        }`}
                      >
                        {term.name}
                      </button>
                    );
                  })}
                </div>

                {selected.options.length > 0 && (
                  <p className="text-xs text-neutral-400 mt-2">
                    {selected.options.length} selected: {selected.options.join(', ')}
                  </p>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
