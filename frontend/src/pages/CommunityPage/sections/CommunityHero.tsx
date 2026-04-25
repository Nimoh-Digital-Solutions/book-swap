import type { ReactElement, ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { ArrowLeftRight, BookOpen, Star, Users } from "lucide-react";

interface CommunityHeroProps {
  city: string | null;
  bookCount: number | undefined;
  userCount: number | undefined;
  swapsThisWeek: number | undefined;
}

/** Hero header + 4-up stats grid. */
export function CommunityHero({
  city,
  bookCount,
  userCount,
  swapsThisWeek,
}: CommunityHeroProps): ReactElement {
  const { t } = useTranslation();

  return (
    <section className="relative overflow-hidden pb-8">
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[90vw] h-[40vh] md:w-[900px] md:h-[500px] bg-[#E4B643]/6 blur-[140px] rounded-full" />
        <div className="absolute top-1/3 -left-32 w-[60vw] h-[40vh] md:w-[400px] md:h-[400px] bg-[#E4B643]/4 blur-[120px] rounded-full" />
        <div className="absolute top-1/4 -right-32 w-[50vw] h-[30vh] md:w-[300px] md:h-[300px] bg-[#4ADE80]/3 blur-[100px] rounded-full" />
      </div>

      <div
        className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 text-center"
      >
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#1A251D] border border-[#28382D] text-[#E4B643] text-xs font-semibold mb-8">
          <span className="w-2 h-2 rounded-full bg-[#E4B643] animate-pulse" />
          {userCount != null
            ? t(
                "community.hero.badge",
                "{{count}} readers swapping near you",
                { count: userCount },
              )
            : t(
                "community.hero.badgeLoading",
                "Finding your local community...",
              )}
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold text-white tracking-tight mb-6 leading-[1.08]">
          {t("community.hero.titleLine1", "Where readers")}{" "}
          <span className="text-[#E4B643]">
            {t("community.hero.titleLine2", "become neighbours.")}
          </span>
        </h1>

        <p className="text-lg md:text-xl text-[#8C9C92] max-w-2xl mx-auto mb-14">
          {t(
            "community.hero.subtitle",
            "Thousands of readers swapping books, sharing stories, and building connections in their neighbourhoods.",
          )}
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
          <StatCard
            icon={<BookOpen className="w-5 h-5" aria-hidden="true" />}
            value={bookCount?.toLocaleString() ?? "—"}
            label={t("community.stats.booksAvailable", "Books Available")}
          />
          <StatCard
            icon={<Users className="w-5 h-5" aria-hidden="true" />}
            value={userCount?.toLocaleString() ?? "—"}
            label={t("community.stats.activeSwappers", "Active Swappers")}
          />
          <StatCard
            icon={<ArrowLeftRight className="w-5 h-5" aria-hidden="true" />}
            value={swapsThisWeek?.toLocaleString() ?? "—"}
            label={t("community.stats.swapsThisWeek", "Swaps This Week")}
          />
          <StatCard
            icon={<Star className="w-5 h-5" aria-hidden="true" />}
            value={city ?? "—"}
            label={t("community.stats.yourCity", "Your City")}
          />
        </div>
      </div>
    </section>
  );
}

function StatCard({
  icon,
  value,
  label,
}: {
  icon: ReactNode;
  value: string;
  label: string;
}) {
  return (
    <div className="bg-[#1A251D]/80 backdrop-blur-sm border border-[#28382D] rounded-2xl p-5 text-center">
      <div className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-[#E4B643]/10 text-[#E4B643] mb-3">
        {icon}
      </div>
      <div className="text-2xl md:text-3xl font-bold text-white mb-1">
        {value}
      </div>
      <div className="text-[10px] font-bold text-[#5A6A60] uppercase tracking-wider">
        {label}
      </div>
    </div>
  );
}
