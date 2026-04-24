import { type ReactElement, useState } from "react";
import { useTranslation } from "react-i18next";

import { SEOHead } from "@components";
import { LocaleLink } from "@components/common/LocaleLink/LocaleLink";
import { useAuth } from "@features/auth";
import type { ActivityFeedItem } from "@features/discovery";
import { useCommunityStats, useNearbyCount } from "@features/discovery";
import { useUserCity } from "@hooks";
import { PATHS, routeMetadata } from "@routes/config/paths";
import {
  ArrowLeftRight,
  BookOpen,
  ChevronDown,
  Heart,
  MessageCircle,
  Shield,
  Star,
  ThumbsUp,
  Users,
} from "lucide-react";

const DEFAULT_RADIUS = 10_000;

const TESTIMONIALS = [
  {
    name: "Sophie",
    city: "Amsterdam",
    quote:
      "I've swapped over 30 books in 6 months. My shelves are refreshed, I've discovered amazing authors, and I've met wonderful people in my neighbourhood.",
    rating: 5,
  },
  {
    name: "Thierry",
    city: "Brussels",
    quote:
      "BookSwap is exactly what our community needed. I love that it's local — I've even become friends with a few regular swap partners.",
    rating: 5,
  },
  {
    name: "Emma",
    city: "Rotterdam",
    quote:
      "As a student, buying new books was expensive. BookSwap let me read everything on my course list for free. The condition ratings are always accurate.",
    rating: 5,
  },
  {
    name: "Lucas",
    city: "Ghent",
    quote:
      "My kids love picking out new books on the map. We make it a weekend activity — cycle to the meetup spot, swap books, grab a waffle.",
    rating: 5,
  },
] as const;

const GUIDELINES = [
  {
    icon: ThumbsUp,
    titleDefault: "Be Honest",
    descDefault:
      "Accurately describe book conditions and show up when you commit to a swap.",
  },
  {
    icon: MessageCircle,
    titleDefault: "Communicate Clearly",
    descDefault:
      "Respond to messages promptly. If plans change, let your swap partner know.",
  },
  {
    icon: Heart,
    titleDefault: "Be Respectful",
    descDefault:
      "Treat every member with kindness. Harassment or discrimination is never tolerated.",
  },
  {
    icon: Shield,
    titleDefault: "Stay Safe",
    descDefault:
      "Meet in public places during daylight. Trust your instincts and report concerns.",
  },
  {
    icon: Star,
    titleDefault: "Leave Honest Ratings",
    descDefault:
      "Rate every exchange fairly. Ratings help the community identify reliable swappers.",
  },
  {
    icon: BookOpen,
    titleDefault: "Share the Love",
    descDefault:
      "List books you've enjoyed. One person's finished read is another's next adventure.",
  },
] as const;

const FAQ_ITEMS = [
  {
    q: "How do ratings and reviews work?",
    a: "After each completed exchange, both parties can leave a 1–5 star rating and an optional written review. These are public and help the community build trust.",
  },
  {
    q: "What happens if a swap goes wrong?",
    a: "If a book's condition was misrepresented or a user didn't show up, you can report the issue through the in-app report feature. We review all reports within 48 hours and take action where necessary.",
  },
  {
    q: "Can I block or report a user?",
    a: "Yes. Tap the three-dot menu on any user's profile to block or report them. Blocked users can no longer see your profile, books, or send you requests.",
  },
  {
    q: "Is there a limit to how many books I can list?",
    a: "No limit! List as many books as you want. The more books in the community, the better it is for everyone.",
  },
  {
    q: "How can I become a trusted swapper?",
    a: "Complete exchanges, leave honest ratings, and keep your listings accurate. Over time, your rating and swap count will speak for themselves.",
  },
  {
    q: "Can I suggest new features?",
    a: "Absolutely! We love hearing from the community. Send your ideas to admin@nimoh-ict.nl and we'll review every suggestion.",
  },
] as const;

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-[#28382D] rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 text-left bg-[#1A251D] hover:bg-[#1E2B22] transition-colors"
        aria-expanded={open}
      >
        <span className="text-white font-semibold text-sm pr-4">
          {question}
        </span>
        <ChevronDown
          className={`w-5 h-5 text-[#E4B643] flex-shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>
      {open && (
        <div className="px-5 pb-5 bg-[#1A251D] text-[#8C9C92] text-sm leading-relaxed">
          {answer}
        </div>
      )}
    </div>
  );
}

export default function CommunityPage(): ReactElement {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const { city, lat, lng } = useUserCity();
  const { data: nearbyData } = useNearbyCount(lat, lng, DEFAULT_RADIUS);
  const { data: communityData } = useCommunityStats(lat, lng, DEFAULT_RADIUS);

  return (
    <div className="min-h-screen bg-[#152018] text-[#8C9C92]">
      <SEOHead
        title={routeMetadata[PATHS.COMMUNITY].title}
        description={routeMetadata[PATHS.COMMUNITY].description}
        path={PATHS.COMMUNITY}
      />
      {/* Hero + Stats */}
      <section className="relative overflow-hidden pb-8">
        <div
          className="absolute inset-0 pointer-events-none"
          aria-hidden="true"
        >
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-[#E4B643]/6 blur-[140px] rounded-full" />
          <div className="absolute top-1/3 -left-32 w-[400px] h-[400px] bg-[#E4B643]/4 blur-[120px] rounded-full" />
          <div className="absolute top-1/4 -right-32 w-[300px] h-[300px] bg-[#4ADE80]/3 blur-[100px] rounded-full" />
        </div>

        <div
          className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 text-center"
          style={{ marginInline: "auto" }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#1A251D] border border-[#28382D] text-[#E4B643] text-xs font-semibold mb-8">
            <span className="w-2 h-2 rounded-full bg-[#E4B643] animate-pulse" />
            {nearbyData
              ? t(
                  "community.hero.badge",
                  "{{count}} readers swapping near you",
                  {
                    count: nearbyData.user_count,
                  },
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
              value={nearbyData?.count.toLocaleString() ?? "—"}
              label={t("community.stats.booksAvailable", "Books Available")}
            />
            <StatCard
              icon={<Users className="w-5 h-5" aria-hidden="true" />}
              value={nearbyData?.user_count.toLocaleString() ?? "—"}
              label={t("community.stats.activeSwappers", "Active Swappers")}
            />
            <StatCard
              icon={<ArrowLeftRight className="w-5 h-5" aria-hidden="true" />}
              value={communityData?.swaps_this_week.toLocaleString() ?? "—"}
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

      {/* Activity Feed */}
      <section
        className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16"
        style={{ marginInline: "auto" }}
      >
        <h2 className="text-2xl font-bold text-white mb-2">
          {t("community.feed.title", "Recent Activity")}
        </h2>
        <p className="text-[#8C9C92] mb-8">
          {t(
            "community.feed.subtitle",
            "See what's happening in the community right now.",
          )}
        </p>

        <div className="space-y-3">
          {(communityData?.activity_feed ?? []).length === 0 ? (
            <div className="bg-[#1A251D] border border-[#28382D] rounded-xl p-8 text-center text-[#5A6A60]">
              {t(
                "community.feed.empty",
                "No recent activity yet. Be the first to list a book!",
              )}
            </div>
          ) : (
            (communityData?.activity_feed ?? []).map(
              (item: ActivityFeedItem, i: number) => {
                const IconMap = {
                  new_listing: BookOpen,
                  completed_swap: ArrowLeftRight,
                  new_rating: Star,
                };
                const Icon = IconMap[item.type];
                return (
                  <div
                    key={`${item.type}-${item.timestamp}-${i}`}
                    className="flex items-center gap-4 p-4 rounded-xl bg-[#1A251D] border border-[#28382D]"
                  >
                    <div className="w-10 h-10 rounded-full bg-[#28382D] flex items-center justify-center flex-shrink-0">
                      <Icon
                        className="w-5 h-5 text-[#8C9C92]"
                        aria-hidden="true"
                      />
                    </div>
                    <p className="text-sm text-[#8C9C92]">
                      {item.type === "new_listing" && (
                        <>
                          <span className="text-[#E4B643] font-bold">
                            {item.user_name}
                          </span>
                          {" listed "}
                          {item.book_title ? (
                            <em>{item.book_title}</em>
                          ) : (
                            "a book"
                          )}
                          {item.neighbourhood
                            ? ` in ${item.neighbourhood}`
                            : ""}
                          .
                        </>
                      )}
                      {item.type === "completed_swap" && (
                        <>
                          <span className="text-[#E4B643] font-bold">
                            {item.user_name}
                          </span>
                          {" & "}
                          <span className="text-[#E4B643] font-bold">
                            {item.partner_name}
                          </span>
                          {" just swapped books!"}
                        </>
                      )}
                      {item.type === "new_rating" && (
                        <>
                          <span className="text-[#E4B643] font-bold">
                            {item.user_name}
                          </span>
                          {" rated "}
                          <span className="text-[#E4B643] font-bold">
                            {item.partner_name}
                          </span>
                          {item.score ? ` ${"★".repeat(item.score)}` : ""}
                        </>
                      )}
                    </p>
                  </div>
                );
              },
            )
          )}
        </div>
      </section>

      {/* Testimonials */}
      <section
        className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16"
        style={{ marginInline: "auto" }}
      >
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold text-white mb-3">
            {t("community.testimonials.title", "Stories from Swappers")}
          </h2>
          <p className="text-[#8C9C92] max-w-xl mx-auto">
            {t(
              "community.testimonials.subtitle",
              "Hear from readers who are already part of the BookSwap community.",
            )}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {TESTIMONIALS.map((t) => (
            <div
              key={t.name}
              className="bg-[#1A251D] border border-[#28382D] rounded-2xl p-6"
            >
              <div className="flex items-center gap-1 mb-3">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <Star
                    key={i}
                    className="w-4 h-4 text-[#E4B643] fill-[#E4B643]"
                    aria-hidden="true"
                  />
                ))}
              </div>
              <blockquote className="text-[#C5CEC8] text-sm leading-relaxed mb-4 italic">
                &ldquo;{t.quote}&rdquo;
              </blockquote>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#28382D] flex items-center justify-center text-[#E4B643] font-bold text-xs">
                  {t.name[0]}
                </div>
                <div>
                  <p className="text-white text-sm font-semibold">{t.name}</p>
                  <p className="text-[#5A6A60] text-xs">{t.city}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Community Guidelines */}
      <section
        className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16"
        style={{ marginInline: "auto" }}
      >
        <div className="text-center mb-12">
          <Users
            className="w-10 h-10 text-[#E4B643] mx-auto mb-4"
            aria-hidden="true"
          />
          <h2 className="text-3xl font-extrabold text-white mb-3">
            {t("community.guidelines.title", "Community Guidelines")}
          </h2>
          <p className="text-[#8C9C92] max-w-xl mx-auto">
            {t(
              "community.guidelines.subtitle",
              "A few simple rules that keep BookSwap a positive and trustworthy place for everyone.",
            )}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {GUIDELINES.map((g, i) => {
            const Icon = g.icon;
            return (
              <div
                key={i}
                className="bg-[#1A251D] border border-[#28382D] rounded-xl p-5"
              >
                <div className="flex items-center gap-3 mb-3">
                  <Icon className="w-5 h-5 text-[#E4B643]" aria-hidden="true" />
                  <h3 className="text-white font-semibold text-sm">
                    {t(`community.guidelines.items.${i}.title`, g.titleDefault)}
                  </h3>
                </div>
                <p className="text-[#8C9C92] text-sm leading-relaxed">
                  {t(
                    `community.guidelines.items.${i}.description`,
                    g.descDefault,
                  )}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* FAQ */}
      <section
        className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16"
        style={{ marginInline: "auto" }}
      >
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold text-white mb-3">
            {t("community.faq.title", "Community FAQ")}
          </h2>
          <p className="text-[#8C9C92]">
            {t(
              "community.faq.subtitle",
              "Common questions about the BookSwap community.",
            )}
          </p>
        </div>

        <div className="space-y-3">
          {FAQ_ITEMS.map((item, i) => (
            <FaqItem
              key={i}
              question={t(`community.faq.items.${i}.q`, item.q)}
              answer={t(`community.faq.items.${i}.a`, item.a)}
            />
          ))}
        </div>
      </section>

      {/* CTA */}
      <section
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 pt-8"
        style={{ marginInline: "auto" }}
      >
        <div className="bg-[#E4B643] rounded-3xl p-10 md:p-14 text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold text-[#152018] mb-4">
            {isAuthenticated
              ? t("community.cta.titleAuth", "Ready to swap?")
              : t("community.cta.title", "Join the community")}
          </h2>
          <p className="text-[#152018]/80 text-lg font-medium mb-8 max-w-xl mx-auto">
            {isAuthenticated
              ? t(
                  "community.cta.subtitleAuth",
                  "Browse books from readers near you and start your next exchange.",
                )
              : t(
                  "community.cta.subtitle",
                  "Create your free account and start swapping books with readers in your neighbourhood.",
                )}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {isAuthenticated ? (
              <LocaleLink
                to={PATHS.CATALOGUE}
                className="bg-[#152018] hover:bg-black text-white px-8 py-4 rounded-full font-bold transition-colors no-underline"
              >
                {t("community.cta.browse", "Browse Books")}
              </LocaleLink>
            ) : (
              <>
                <LocaleLink
                  to={PATHS.REGISTER}
                  className="bg-[#152018] hover:bg-black text-white px-8 py-4 rounded-2xl font-bold transition-colors no-underline"
                >
                  {t("community.cta.register", "Create Free Account")}
                </LocaleLink>
                <LocaleLink
                  to={PATHS.BROWSE}
                  className="bg-transparent border border-[#152018]/30 text-[#152018] hover:bg-[#152018]/10 px-8 py-4 rounded-2xl font-bold transition-colors no-underline"
                >
                  {t("community.cta.browseCta", "Browse Books First")}
                </LocaleLink>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function StatCard({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
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
