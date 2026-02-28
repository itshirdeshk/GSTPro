'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, Check, ChevronDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ComboBoxOption {
  value: string;
  label: string;
  extra?: string;
}

interface ComboBoxProps {
  options: ComboBoxOption[];
  value?: string;
  onChange: (value: string) => void;
  onSearch?: (query: string) => void;
  onLoadMore?: () => void;
  loading?: boolean;
  hasMore?: boolean;
  placeholder?: string;
  label?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  searchPlaceholder?: string;
  emptyMessage?: string;
}

export function ComboBox({
  options,
  value,
  onChange,
  onSearch,
  onLoadMore,
  loading,
  hasMore,
  placeholder = 'Select...',
  label,
  error,
  required,
  disabled,
  searchPlaceholder = 'Search...',
  emptyMessage = 'No results found',
}: ComboBoxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedOptionCache, setSelectedOptionCache] = useState<ComboBoxOption | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Find selected option in current options or use cached version
  const selectedOption = options.find((opt) => opt.value === value) || 
    (selectedOptionCache?.value === value ? selectedOptionCache : null);

  // Update cache when we find the selected option in current options
  useEffect(() => {
    if (value) {
      const found = options.find((opt) => opt.value === value);
      if (found) {
        setSelectedOptionCache(found);
      }
    } else {
      setSelectedOptionCache(null);
    }
  }, [value, options]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (open && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [open]);

  // Handle search - immediate on mount, debounced on change
  useEffect(() => {
    if (onSearch) {
      if (search === '') {
        // Immediate fetch for empty search (initial load or cleared search)
        onSearch('');
      } else {
        // Debounce for non-empty search
        const timer = setTimeout(() => {
          onSearch(search);
        }, 300);
        return () => clearTimeout(timer);
      }
    }
  }, [search, onSearch]);

  // Handle infinite scroll
  useEffect(() => {
    if (!listRef.current || !onLoadMore || !hasMore || loading) return;

    const handleScroll = () => {
      if (!listRef.current) return;
      const { scrollTop, scrollHeight, clientHeight } = listRef.current;
      if (scrollHeight - scrollTop <= clientHeight * 1.5) {
        onLoadMore();
      }
    };

    const list = listRef.current;
    list.addEventListener('scroll', handleScroll);
    return () => list.removeEventListener('scroll', handleScroll);
  }, [onLoadMore, hasMore, loading]);

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setSearch('');
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {label && (
        <label className="block text-sm font-medium text-text2 mb-1.5">
          {label}
          {required && <span className="text-red ml-1">*</span>}
        </label>
      )}

      <button
        type="button"
        onClick={() => !disabled && setOpen(!open)}
        disabled={disabled}
        className={cn(
          'w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-lg border text-sm text-left transition-all outline-none',
          'bg-bg3 border-border text-text',
          'hover:border-accent/50',
          'focus:border-accent focus:ring-2 focus:ring-accent/20',
disabled && 'opacity-50 cursor-not-allowed',
          error && 'border-red focus:border-red focus:ring-red/20',
        )}
      >
        <span className={cn('truncate', !selectedOption && 'text-text3')}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <div className="flex items-center gap-1 flex-shrink-0">
          {value && !disabled && (
            <X
              size={16}
              className="text-text3 hover:text-text transition-colors"
              onClick={handleClear}
            />
          )}
          <ChevronDown
            size={16}
            className={cn('text-text3 transition-transform', open && 'rotate-180')}
          />
        </div>
      </button>

      {error && <p className="mt-1.5 text-xs text-red">{error}</p>}

      {open && (
        <div className="absolute z-50 w-full mt-2 bg-surface border border-border rounded-lg shadow-lg overflow-hidden">
          <div className="p-2 border-b border-border">
            <div className="flex items-center gap-2 bg-bg3 rounded-lg px-3 py-2 border border-border">
              <Search size={16} className="text-text3 flex-shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder={searchPlaceholder}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-transparent text-sm text-text placeholder:text-text3 outline-none flex-1"
              />
            </div>
          </div>

          <div ref={listRef} className="max-h-60 overflow-y-auto">
            {options.length === 0 && !loading ? (
              <div className="p-4 text-center text-sm text-text3">{emptyMessage}</div>
            ) : (
              <>
                {options.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      onChange(option.value);
                      setOpen(false);
                      setSearch('');
                    }}
                    className={cn(
                      'w-full flex items-center justify-between gap-2 px-3 py-2.5 text-sm text-left transition-colors',
                      'hover:bg-bg3',
                      option.value === value && 'bg-accent/10 text-accent',
                    )}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{option.label}</div>
                      {option.extra && (
                        <div className="text-xs text-text3 truncate">{option.extra}</div>
                      )}
                    </div>
                    {option.value === value && (
                      <Check size={16} className="flex-shrink-0 text-accent" />
                    )}
                  </button>
                ))}
                {loading && (
                  <div className="p-4 text-center text-sm text-text3">
                    <div className="inline-block w-4 h-4 border-2 border-text3 border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
