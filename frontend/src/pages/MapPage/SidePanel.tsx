/**
 * SidePanel — orchestrator for the MapPage left-hand panel.
 *
 * Composed of small focused subcomponents (header / filters / book list /
 * collapse toggle) so it stays understandable. AUD-W-404.
 */
import { useEffect, useRef } from "react";

import type { BrowseBook } from "@features/discovery/types/discovery.types";

import { SidePanelBookList } from "./sidepanel/SidePanelBookList";
import { SidePanelFilters } from "./sidepanel/SidePanelFilters";
import { SidePanelHeader } from "./sidepanel/SidePanelHeader";
import { SidePanelToggle } from "./sidepanel/SidePanelToggle";

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
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedBookId) {
      listRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [selectedBookId]);

  // Responsive widths (RESP-003 / Sprint A):
  //  - <sm  : full-screen sheet (covers the map entirely)
  //  - sm   : 360px sidebar
  //  - md+  : 420px sidebar
  // Both the outer transition wrapper and the inner panel share the same
  // width tokens so the slide-in transform lines up exactly with the
  // collapse-to-zero of the wrapper.
  const widthClass = "w-full sm:w-[360px] md:w-[420px]";

  return (
    <div
      className={`absolute top-0 left-0 h-full z-10 transition-[width] duration-300 ease-in-out flex ${
        isOpen ? widthClass : "w-0"
      }`}
    >
      <div
        className={`h-full ${widthClass} shrink-0 bg-[#0f1a14] border-r border-[#28382D]/50 flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <SidePanelHeader
          bookCount={books.length}
          isLoading={isLoading}
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
          onClose={onClose}
        />

        <SidePanelFilters
          searchQuery={searchQuery}
          radius={radius}
          onRadiusChange={onRadiusChange}
          radiusCounts={radiusCounts}
          genres={genres}
          onGenreToggle={onGenreToggle}
          languages={languages}
          onLanguageChange={onLanguageChange}
          conditions={conditions}
          onConditionToggle={onConditionToggle}
          onClearAll={onClearAll}
          hasActiveFilters={hasActiveFilters}
        />

        <div className="h-px bg-gradient-to-r from-transparent via-[#28382D] to-transparent shrink-0" />

        <SidePanelBookList
          ref={listRef}
          books={books}
          isLoading={isLoading}
          selectedBookId={selectedBookId}
          onSelectBook={onSelectBook}
          hasActiveFilters={hasActiveFilters}
          onClearAll={onClearAll}
        />
      </div>

      <SidePanelToggle isOpen={isOpen} onToggle={isOpen ? onClose : onOpen} />
    </div>
  );
}
