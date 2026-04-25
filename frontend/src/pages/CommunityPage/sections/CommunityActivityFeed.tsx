import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";

import type { ActivityFeedItem } from "@features/discovery";
import { ArrowLeftRight, BookOpen, Star } from "lucide-react";

interface CommunityActivityFeedProps {
  items: ActivityFeedItem[];
}

const ICON_BY_TYPE = {
  new_listing: BookOpen,
  completed_swap: ArrowLeftRight,
  new_rating: Star,
} as const;

/** "Recent Activity" feed of new listings, completed swaps and ratings. */
export function CommunityActivityFeed({
  items,
}: CommunityActivityFeedProps): ReactElement {
  const { t } = useTranslation();

  return (
    <section
      className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16"
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
        {items.length === 0 ? (
          <div className="bg-[#1A251D] border border-[#28382D] rounded-xl p-8 text-center text-[#5A6A60]">
            {t(
              "community.feed.empty",
              "No recent activity yet. Be the first to list a book!",
            )}
          </div>
        ) : (
          items.map((item, i) => {
            const Icon = ICON_BY_TYPE[item.type];
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
                      {item.neighbourhood ? ` in ${item.neighbourhood}` : ""}.
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
          })
        )}
      </div>
    </section>
  );
}
