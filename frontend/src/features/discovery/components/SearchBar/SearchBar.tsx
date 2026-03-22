/**
 * SearchBar — debounced search input for browse page.
 */
import { type ReactElement, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Loader2, Search, X } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  isLoading?: boolean | undefined;
}

export function SearchBar({
  value,
  onChange,
  isLoading,
}: SearchBarProps): ReactElement {
  const { t } = useTranslation();
  const [local, setLocal] = useState(value);

  // Sync external value changes (e.g. URL params)
  useEffect(() => {
    setLocal(value);
  }, [value]);

  // Debounce: propagate after 300ms of inactivity (min 3 chars or empty)
  useEffect(() => {
    const id = setTimeout(() => {
      if (local !== value) {
        // Only trigger search with 3+ chars, or empty to clear
        if (local.length >= 3 || local.length === 0) {
          onChange(local);
        }
      }
    }, 300);
    return () => clearTimeout(id);
  }, [local, value, onChange]);

  const showMinCharsHint = local.length > 0 && local.length < 3;

  return (
    <div>
      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5A6A60]"
          aria-hidden="true"
        />
      <input
        type="search"
        value={local}
        onChange={e => setLocal(e.target.value)}
        placeholder={t(
          'discovery.search.placeholder',
          'Search by title, author, or ISBN...',
        )}
        className="w-full bg-[#1A251D] border border-[#28382D] rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder-[#5A6A60] focus:border-[#E4B643] focus:outline-none transition-colors"
        aria-label={t('discovery.search.placeholder', 'Search')}
      />
      {isLoading ? (
        <Loader2
          className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#E4B643] animate-spin"
          aria-hidden="true"
        />
      ) : (
        local && (
          <button
            type="button"
            onClick={() => {
              setLocal('');
              onChange('');
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5A6A60] hover:text-white"
            aria-label={t('discovery.search.clear', 'Clear search')}
          >
            <X className="w-4 h-4" />
          </button>
        )
      )}
      </div>
      {showMinCharsHint && (
        <p className="mt-1 text-xs text-[#5A6A60]">
          {t('discovery.search.minChars', 'Type at least 3 characters')}
        </p>
      )}
    </div>
  );
}
