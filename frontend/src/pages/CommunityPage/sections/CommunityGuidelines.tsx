import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";

import {
  BookOpen,
  Heart,
  MessageCircle,
  Shield,
  Star,
  ThumbsUp,
  Users,
} from "lucide-react";

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

/** Six community-guideline cards. */
export function CommunityGuidelines(): ReactElement {
  const { t } = useTranslation();

  return (
    <section
      className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16"
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
  );
}
