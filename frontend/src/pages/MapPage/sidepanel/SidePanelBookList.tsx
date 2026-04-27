import { forwardRef } from "react";
import { useTranslation } from "react-i18next";

import type { BrowseBook } from "@features/discovery/types/discovery.types";
import { BookOpen, Loader2 } from "lucide-react";

interface SidePanelBookListProps {
  books: BrowseBook[];
  isLoading: boolean;
  selectedBookId: string | null;
  onSelectBook: (book: BrowseBook) => void;
  hasActiveFilters: boolean;
  onClearAll: () => void;
}

/**
 * Scrollable list of books shown in the map side panel — handles loading
 * spinner, empty state and per-row selection styling.
 */
export const SidePanelBookList = forwardRef<
  HTMLDivElement,
  SidePanelBookListProps
>(function SidePanelBookList(
  {
    books,
    isLoading,
    selectedBookId,
    onSelectBook,
    hasActiveFilters,
    onClearAll,
  },
  ref,
) {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div ref={ref} className="overflow-y-auto flex-1 min-h-0">
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="w-6 h-6 text-[#E4B643] animate-spin" />
          <p className="text-[#3d5c47] text-xs">
            {t("map.panel.loading", "Loading...")}
          </p>
        </div>
      </div>
    );
  }

  if (books.length === 0) {
    return (
      <div ref={ref} className="overflow-y-auto flex-1 min-h-0">
        <div className="p-10 text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#152018] border border-[#1e3026] flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-6 h-6 text-[#28382D]" />
          </div>
          <p className="text-[#8C9C92] text-sm font-medium mb-1">
            {t("map.panel.noResultsTitle", "No books found")}
          </p>
          <p className="text-[#3d5c47] text-xs leading-relaxed">
            {hasActiveFilters
              ? t(
                  "map.panel.noFiltered",
                  "Try adjusting your search or filters.",
                )
              : t("map.panel.noBooks", "No books found in this area yet.")}
          </p>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={onClearAll}
              className="mt-4 px-4 py-2 text-xs font-medium text-[#E4B643] bg-[#E4B643]/10 hover:bg-[#E4B643]/20 rounded-full transition-colors"
            >
              {t("map.filters.clearAll", "Clear all filters")}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div ref={ref} className="overflow-y-auto flex-1 min-h-0">
      <div className="py-1">
        {books.map((book) => {
          const isSelected = book.id === selectedBookId;
          return (
            <button
              key={book.id}
              type="button"
              onClick={() => onSelectBook(book)}
              className={`w-full flex gap-3.5 px-5 py-3.5 transition-all text-left group ${
                isSelected ? "bg-[#E4B643]/8" : "hover:bg-[#152018]/80"
              }`}
            >
              <div
                className={`w-0.5 self-stretch rounded-full shrink-0 transition-colors ${
                  isSelected
                    ? "bg-[#E4B643]"
                    : "bg-transparent group-hover:bg-[#28382D]"
                }`}
              />
              <div
                className={`w-12 h-16 shrink-0 rounded-xs overflow-hidden border transition-colors ${
                  isSelected
                    ? "border-[#E4B643]/30"
                    : "border-[#1e3026] group-hover:border-[#28382D]"
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
                      ? "text-[#E4B643]"
                      : "text-white group-hover:text-white"
                  }`}
                >
                  {book.title}
                </p>
                <p className="text-xs text-[#5A6A60] truncate mt-0.5">
                  {book.author}
                </p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-[10px] font-medium text-[#8C9C92] bg-[#152018] px-2 py-0.5 rounded capitalize">
                    {book.condition.replace("_", " ")}
                  </span>
                  {book.distance != null && (
                    <span className="text-[10px] font-medium text-[#E4B643]/70">
                      {book.distance < 1
                        ? "< 1 km"
                        : `${book.distance} km`}
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
});
