import { useState } from "react";
import { useTranslation } from "react-i18next";

import {
  CONDITION_OPTIONS,
  GENRE_OPTIONS,
  LANGUAGE_OPTIONS,
} from "@constants/bookOptions";
import {
  BookOpen,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  SlidersHorizontal,
} from "lucide-react";

import { RADIUS_OPTIONS } from "../map.constants";
import { CollapsibleSection } from "./CollapsibleSection";
import { FilterChip } from "./FilterChip";

interface SidePanelFiltersProps {
  searchQuery: string;
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

/**
 * Filter UI block: distance pills, "Filters" toggle with active count,
 * active-filter chips and the expandable genre / language / condition
 * panels.
 */
export function SidePanelFilters({
  searchQuery,
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
}: SidePanelFiltersProps) {
  const { t } = useTranslation();
  const [filtersExpanded, setFiltersExpanded] = useState(false);

  const activeFilterCount =
    genres.length +
    languages.length +
    conditions.length +
    (searchQuery ? 1 : 0);

  return (
    <>
      <div className="px-5 pb-3 shrink-0">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-[#3d5c47] mb-2">
          {t("map.radius.label", "Distance")}
        </p>
        <div
          className="flex flex-wrap gap-1.5"
          role="radiogroup"
          aria-label={t("map.radius.label", "Distance")}
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
                    ? "bg-[#E4B643] text-[#0f1a14] font-bold shadow-[0_0_12px_rgba(228,182,67,0.25)]"
                    : "bg-[#152018] text-[#8C9C92] hover:text-white hover:bg-[#1A251D]"
                }`}
              >
                {opt.label}
                {count != null && (
                  <span
                    className={`ml-1 ${isActive ? "opacity-60" : "text-[#3d5c47]"}`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-5 pb-3 shrink-0">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setFiltersExpanded((v) => !v)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              filtersExpanded || activeFilterCount > 0
                ? "bg-[#1A251D] text-white"
                : "text-[#5A6A60] hover:text-[#8C9C92]"
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            {t("map.filters.toggle", "Filters")}
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
              {t("map.filters.clearAll", "Clear all")}
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
                label={c.replace("_", " ")}
                onRemove={() => onConditionToggle(c)}
              />
            ))}
          </div>
        )}
      </div>

      {filtersExpanded && (
        <div className="shrink-0 overflow-y-auto max-h-[40vh] mx-5 mb-3 rounded-xl bg-[#152018] border border-[#1e3026]">
          <CollapsibleSection
            title={t("map.filters.genre", "Genre")}
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
                        ? "bg-[#E4B643] text-[#0f1a14] font-bold"
                        : "bg-[#0f1a14] text-[#8C9C92] hover:text-white hover:bg-[#1A251D]"
                    }`}
                  >
                    {genre}
                  </button>
                );
              })}
            </div>
          </CollapsibleSection>

          <CollapsibleSection
            title={t("map.filters.language", "Language")}
            icon={<span className="text-[10px]">🌐</span>}
          >
            <select
              value={languages[0] ?? ""}
              onChange={(e) =>
                onLanguageChange(e.target.value ? [e.target.value] : [])
              }
              className="w-full appearance-none bg-[#0f1a14] border border-[#1e3026] rounded-lg py-2 pl-3 pr-8 text-sm text-white focus:ring-1 focus:ring-[#E4B643]/30 focus:border-[#E4B643]/40 outline-none transition-all cursor-pointer"
              aria-label={t("map.filters.language", "Language")}
            >
              <option value="">
                {t("map.filters.allLanguages", "All languages")}
              </option>
              {LANGUAGE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </CollapsibleSection>

          <CollapsibleSection
            title={t("map.filters.condition", "Condition")}
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
                        ? "bg-[#E4B643] text-[#0f1a14] font-bold"
                        : "bg-[#0f1a14] text-[#8C9C92] hover:text-white hover:bg-[#1A251D]"
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
    </>
  );
}
