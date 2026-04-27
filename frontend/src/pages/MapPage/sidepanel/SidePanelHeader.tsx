import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { ChevronsLeft, Loader2, Search, X } from "lucide-react";

interface SidePanelHeaderProps {
  bookCount: number;
  isLoading: boolean;
  searchQuery: string;
  onSearchChange: (v: string) => void;
  onClose: () => void;
}

/**
 * Header row of the map side panel: title, count, close button and the
 * debounced search input.
 */
export function SidePanelHeader({
  bookCount,
  isLoading,
  searchQuery,
  onSearchChange,
  onClose,
}: SidePanelHeaderProps) {
  const { t } = useTranslation();
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (localSearch.length >= 3 || localSearch.length === 0) {
      debounceRef.current = setTimeout(() => onSearchChange(localSearch), 300);
    }
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [localSearch, onSearchChange]);

  return (
    <div className="px-5 pt-5 pb-4 shrink-0">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-white font-bold text-lg tracking-tight">
            {t("map.panel.title", "Books nearby")}
          </h2>
          <p className="text-[#5A6A60] text-xs mt-1">
            {isLoading ? (
              <span className="inline-flex items-center gap-1.5">
                <Loader2 className="w-3 h-3 animate-spin" />
                {t("map.panel.loading", "Loading...")}
              </span>
            ) : (
              <span>
                <span className="text-[#E4B643] font-semibold">
                  {bookCount}
                </span>{" "}
                {t("map.panel.booksLabel", "books found")}
              </span>
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-2 -mr-1 -mt-1 rounded-xl hover:bg-[#1A251D] text-[#5A6A60] hover:text-white transition-colors"
          aria-label={t("map.panel.close", "Close panel")}
        >
          <ChevronsLeft className="w-4 h-4" />
        </button>
      </div>

      <div className="relative">
        <Search
          className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#3d5c47]"
          aria-hidden="true"
        />
        <input
          type="search"
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          placeholder={t(
            "map.search.placeholder",
            "Search books, authors...",
          )}
          className="w-full bg-[#152018] border border-[#1e3026] rounded-xl pl-10 pr-10 py-2.5 text-base sm:text-sm text-white placeholder-[#3d5c47] focus:border-[#E4B643]/50 focus:ring-1 focus:ring-[#E4B643]/20 focus:outline-none transition-all"
          aria-label={t(
            "map.search.placeholder",
            "Search books, authors...",
          )}
        />
        {localSearch && (
          <button
            type="button"
            onClick={() => {
              setLocalSearch("");
              onSearchChange("");
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5A6A60] hover:text-white transition-colors"
            aria-label={t("map.search.clear", "Clear search")}
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
