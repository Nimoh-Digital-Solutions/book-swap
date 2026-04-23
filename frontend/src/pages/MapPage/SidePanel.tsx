import {
  type ReactElement,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';

import {
  CONDITION_OPTIONS,
  GENRE_OPTIONS,
  LANGUAGE_OPTIONS,
} from '@constants/bookOptions';
import type { BrowseBook } from '@features/discovery/types/discovery.types';
import {
  BookOpen,
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  ChevronUp,
  Loader2,
  RotateCcw,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react';

import { RADIUS_OPTIONS } from './map.constants';

// ---------------------------------------------------------------------------
// CollapsibleSection
// ---------------------------------------------------------------------------

function CollapsibleSection({
  title,
  icon,
  children,
  defaultOpen = false,
}: {
  title: string;
  icon: ReactElement;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-[#28382D]/60">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center justify-between w-full px-4 py-3 text-left hover:bg-[#1A251D]/50 transition-colors"
      >
        <span className="flex items-center gap-2 text-xs font-bold tracking-widest uppercase text-[#8C9C92]">
          {icon}
          {title}
        </span>
        {open ? (
          <ChevronUp className="w-3.5 h-3.5 text-[#5A6A60]" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5 text-[#5A6A60]" />
        )}
      </button>
      {open && <div className="px-4 pb-3">{children}</div>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// FilterChip
// ---------------------------------------------------------------------------

function FilterChip({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) {
  return (
    <span className="inline-flex items-center gap-1 bg-[#28382D] text-white text-[10px] px-2 py-0.5 rounded-full">
      {label}
      <button
        type="button"
        onClick={onRemove}
        className="hover:text-[#E4B643] transition-colors"
        aria-label={`Remove ${label}`}
      >
        <X className="w-2.5 h-2.5" />
      </button>
    </span>
  );
}

// ---------------------------------------------------------------------------
// SidePanel
// ---------------------------------------------------------------------------

export interface SidePanelProps {
  books: BrowseBook[];
  isLoading: boolean;
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  onSelectBook: (book: BrowseBook) => void;
  selectedBookId: string | null;
  searchQuery: string;
  onSearchChange: (v: string) => void;
  radius: number;
  onRadiusChange: (v: number) => void;
  radiusCounts: Record<string, number> | undefined;
  genres: string[];
  onGenreToggle: (g: string) => void;
  languages: string[];
  onLanguageChange: (langs: string[]) => void;
  conditions: string[];
  onConditionToggle: (c: string) => void;
  onClearAll: () => void;
  hasActiveFilters: boolean;
}

export function SidePanel({
  books,
  isLoading,
  isOpen,
  onOpen,
  onClose,
  onSelectBook,
  selectedBookId,
  searchQuery,
  onSearchChange,
  radius,
  onRadiusChange,
  radiusCounts,
  genres,
  onGenreToggle,
  languages,
  onLanguageChange,
  conditions,
  onConditionToggle,
  onClearAll,
  hasActiveFilters,
}: SidePanelProps) {
  const { t } = useTranslation();
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (localSearch.length >= 3 || localSearch.length === 0) {
      debounceRef.current = setTimeout(() => onSearchChange(localSearch), 300);
    }
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [localSearch, onSearchChange]);

  useEffect(() => {
    if (selectedBookId) {
      listRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [selectedBookId]);

  const sortedBooks = useMemo(() => {
    if (!selectedBookId) return books;
    const selected = books.find((b) => b.id === selectedBookId);
    if (!selected) return books;
    return [selected, ...books.filter((b) => b.id !== selectedBookId)];
  }, [books, selectedBookId]);

  const activeFilterCount =
    genres.length +
    languages.length +
    conditions.length +
    (searchQuery ? 1 : 0);

  return (
    <div
      className={`absolute top-0 left-0 h-full z-10 transition-[width] duration-300 ease-in-out flex ${
        isOpen ? 'w-[420px]' : 'w-0'
      }`}
    >
      {/* Panel content */}
      <div
        className={`h-full w-[420px] shrink-0 bg-[#0f1a14] border-r border-[#28382D]/50 flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="px-5 pt-5 pb-4 shrink-0">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-white font-bold text-lg tracking-tight">
                {t('map.panel.title', 'Books nearby')}
              </h2>
              <p className="text-[#5A6A60] text-xs mt-1">
                {isLoading ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    {t('map.panel.loading', 'Loading...')}
                  </span>
                ) : (
                  <span>
                    <span className="text-[#E4B643] font-semibold">
                      {books.length}
                    </span>{' '}
                    {t('map.panel.booksLabel', 'books found')}
                  </span>
                )}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 -mr-1 -mt-1 rounded-xl hover:bg-[#1A251D] text-[#5A6A60] hover:text-white transition-colors"
              aria-label={t('map.panel.close', 'Close panel')}
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>
          </div>

        {/* Search bar */}
        <div className="relative">
          <Search
            className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#3d5c47]"
            aria-hidden="true"
          />
          <input
            type="search"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder={t('map.search.placeholder', 'Search books, authors...')}
            className="w-full bg-[#152018] border border-[#1e3026] rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder-[#3d5c47] focus:border-[#E4B643]/50 focus:ring-1 focus:ring-[#E4B643]/20 focus:outline-none transition-all"
            aria-label={t('map.search.placeholder', 'Search books, authors...')}
          />
          {localSearch && (
            <button
              type="button"
              onClick={() => {
                setLocalSearch('');
                onSearchChange('');
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5A6A60] hover:text-white transition-colors"
              aria-label={t('map.search.clear', 'Clear search')}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Radius pills */}
      <div className="px-5 pb-3 shrink-0">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-[#3d5c47] mb-2">
          {t('map.radius.label', 'Distance')}
        </p>
        <div
          className="flex flex-wrap gap-1.5"
          role="radiogroup"
          aria-label={t('map.radius.label', 'Distance')}
        >
          {RADIUS_OPTIONS.map((opt) => {
            const isActive = radius === opt.value;
            const count = radiusCounts?.[String(opt.value)];
            return (
              <button
                key={opt.value}
                type="button"
                role="radio"
                aria-checked={isActive}
                onClick={() => onRadiusChange(opt.value)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-[#E4B643] text-[#0f1a14] font-bold shadow-[0_0_12px_rgba(228,182,67,0.25)]'
                    : 'bg-[#152018] text-[#8C9C92] hover:text-white hover:bg-[#1A251D]'
                }`}
              >
                {opt.label}
                {count != null && (
                  <span
                    className={`ml-1 ${isActive ? 'opacity-60' : 'text-[#3d5c47]'}`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter bar */}
      <div className="px-5 pb-3 shrink-0">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setFiltersExpanded((v) => !v)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              filtersExpanded || activeFilterCount > 0
                ? 'bg-[#1A251D] text-white'
                : 'text-[#5A6A60] hover:text-[#8C9C92]'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            {t('map.filters.toggle', 'Filters')}
            {activeFilterCount > 0 && (
              <span className="bg-[#E4B643] text-[#0f1a14] text-[10px] font-bold min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-1">
                {activeFilterCount}
              </span>
            )}
            {filtersExpanded ? (
              <ChevronUp className="w-3 h-3 text-[#5A6A60]" />
            ) : (
              <ChevronDown className="w-3 h-3 text-[#5A6A60]" />
            )}
          </button>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={onClearAll}
              className="flex items-center gap-1.5 text-[11px] font-medium text-[#E4B643]/70 hover:text-[#E4B643] transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              {t('map.filters.clearAll', 'Clear all')}
            </button>
          )}
        </div>

        {hasActiveFilters && !filtersExpanded && (
          <div className="flex flex-wrap gap-1.5 mt-2.5">
            {genres.map((g) => (
              <FilterChip
                key={`g-${g}`}
                label={g}
                onRemove={() => onGenreToggle(g)}
              />
            ))}
            {languages.map((l) => {
              const opt = LANGUAGE_OPTIONS.find((o) => o.value === l);
              return (
                <FilterChip
                  key={`l-${l}`}
                  label={opt?.label ?? l}
                  onRemove={() =>
                    onLanguageChange(languages.filter((x) => x !== l))
                  }
                />
              );
            })}
            {conditions.map((c) => (
              <FilterChip
                key={`c-${c}`}
                label={c.replace('_', ' ')}
                onRemove={() => onConditionToggle(c)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Expanded filter sections */}
      {filtersExpanded && (
        <div className="shrink-0 overflow-y-auto max-h-[40vh] mx-5 mb-3 rounded-xl bg-[#152018] border border-[#1e3026]">
          <CollapsibleSection
            title={t('map.filters.genre', 'Genre')}
            icon={<BookOpen className="w-3.5 h-3.5" />}
            defaultOpen
          >
            <div className="flex flex-wrap gap-1.5">
              {GENRE_OPTIONS.map((genre) => {
                const active = genres.includes(genre);
                return (
                  <button
                    key={genre}
                    type="button"
                    aria-pressed={active}
                    onClick={() => onGenreToggle(genre)}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${
                      active
                        ? 'bg-[#E4B643] text-[#0f1a14] font-bold'
                        : 'bg-[#0f1a14] text-[#8C9C92] hover:text-white hover:bg-[#1A251D]'
                    }`}
                  >
                    {genre}
                  </button>
                );
              })}
            </div>
          </CollapsibleSection>

          <CollapsibleSection
            title={t('map.filters.language', 'Language')}
            icon={<span className="text-[10px]">🌐</span>}
          >
            <select
              value={languages[0] ?? ''}
              onChange={(e) =>
                onLanguageChange(e.target.value ? [e.target.value] : [])
              }
              className="w-full appearance-none bg-[#0f1a14] border border-[#1e3026] rounded-lg py-2 pl-3 pr-8 text-sm text-white focus:ring-1 focus:ring-[#E4B643]/30 focus:border-[#E4B643]/40 outline-none transition-all cursor-pointer"
              aria-label={t('map.filters.language', 'Language')}
            >
              <option value="">
                {t('map.filters.allLanguages', 'All languages')}
              </option>
              {LANGUAGE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </CollapsibleSection>

          <CollapsibleSection
            title={t('map.filters.condition', 'Condition')}
            icon={<span className="text-[10px]">✨</span>}
          >
            <div className="flex flex-wrap gap-1.5">
              {CONDITION_OPTIONS.map(({ value, label }) => {
                const active = conditions.includes(value);
                return (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={active}
                    onClick={() => onConditionToggle(value)}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${
                      active
                        ? 'bg-[#E4B643] text-[#0f1a14] font-bold'
                        : 'bg-[#0f1a14] text-[#8C9C92] hover:text-white hover:bg-[#1A251D]'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </CollapsibleSection>
        </div>
      )}

      {/* Divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-[#28382D] to-transparent shrink-0" />

      {/* Book list */}
      <div ref={listRef} className="overflow-y-auto flex-1 min-h-0">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-6 h-6 text-[#E4B643] animate-spin" />
            <p className="text-[#3d5c47] text-xs">
              {t('map.panel.loading', 'Loading...')}
            </p>
          </div>
        ) : books.length === 0 ? (
          <div className="p-10 text-center">
            <div className="w-14 h-14 rounded-2xl bg-[#152018] border border-[#1e3026] flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-6 h-6 text-[#28382D]" />
            </div>
            <p className="text-[#8C9C92] text-sm font-medium mb-1">
              {t('map.panel.noResultsTitle', 'No books found')}
            </p>
            <p className="text-[#3d5c47] text-xs leading-relaxed">
              {hasActiveFilters
                ? t(
                    'map.panel.noFiltered',
                    'Try adjusting your search or filters.',
                  )
                : t('map.panel.noBooks', 'No books found in this area yet.')}
            </p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={onClearAll}
                className="mt-4 px-4 py-2 text-xs font-medium text-[#E4B643] bg-[#E4B643]/10 hover:bg-[#E4B643]/20 rounded-full transition-colors"
              >
                {t('map.filters.clearAll', 'Clear all filters')}
              </button>
            )}
          </div>
        ) : (
          <div className="py-1">
            {sortedBooks.map((book) => {
              const isSelected = book.id === selectedBookId;
              return (
                <button
                  key={book.id}
                  type="button"
                  onClick={() => onSelectBook(book)}
                  className={`w-full flex gap-3.5 px-5 py-3.5 transition-all text-left group ${
                    isSelected ? 'bg-[#E4B643]/8' : 'hover:bg-[#152018]/80'
                  }`}
                >
                  <div
                    className={`w-0.5 self-stretch rounded-full shrink-0 transition-colors ${
                      isSelected
                        ? 'bg-[#E4B643]'
                        : 'bg-transparent group-hover:bg-[#28382D]'
                    }`}
                  />
                  <div
                    className={`w-12 h-16 shrink-0 rounded-lg overflow-hidden border transition-colors ${
                      isSelected
                        ? 'border-[#E4B643]/30'
                        : 'border-[#1e3026] group-hover:border-[#28382D]'
                    }`}
                  >
                    {(book.primary_photo ?? book.cover_url) ? (
                      <img
                        src={book.primary_photo ?? book.cover_url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-[#152018] flex items-center justify-center text-[#28382D]">
                        <BookOpen className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 py-0.5">
                    <p
                      className={`text-[13px] font-semibold truncate leading-tight transition-colors ${
                        isSelected
                          ? 'text-[#E4B643]'
                          : 'text-white group-hover:text-white'
                      }`}
                    >
                      {book.title}
                    </p>
                    <p className="text-xs text-[#5A6A60] truncate mt-0.5">
                      {book.author}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[10px] font-medium text-[#8C9C92] bg-[#152018] px-2 py-0.5 rounded capitalize">
                        {book.condition.replace('_', ' ')}
                      </span>
                      {book.distance != null && (
                        <span className="text-[10px] font-medium text-[#E4B643]/70">
                          {book.distance < 1
                            ? '< 1 km'
                            : `${book.distance} km`}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
      </div>

      {/* Collapse / expand tab — always visible on the right edge */}
      <button
        type="button"
        onClick={isOpen ? onClose : onOpen}
        className="absolute top-1/2 -translate-y-1/2 -right-0 translate-x-full flex items-center justify-center w-6 h-14 bg-[#0f1a14] border border-l-0 border-[#28382D]/50 rounded-r-lg text-[#8C9C92] hover:text-[#E4B643] transition-colors"
        aria-label={
          isOpen
            ? t('map.panel.collapse', 'Collapse panel')
            : t('map.panel.expand', 'Expand panel')
        }
      >
        {isOpen ? (
          <ChevronsLeft className="w-3.5 h-3.5" />
        ) : (
          <ChevronsRight className="w-3.5 h-3.5" />
        )}
      </button>
    </div>
  );
}
