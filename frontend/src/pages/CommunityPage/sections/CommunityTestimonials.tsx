import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";

import { Star } from "lucide-react";

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

/** Testimonial cards from real swappers. */
export function CommunityTestimonials(): ReactElement {
  const { t } = useTranslation();

  return (
    <section
      className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16"
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
        {TESTIMONIALS.map((entry) => (
          <div
            key={entry.name}
            className="bg-[#1A251D] border border-[#28382D] rounded-2xl p-6"
          >
            <div className="flex items-center gap-1 mb-3">
              {Array.from({ length: entry.rating }).map((_, i) => (
                <Star
                  key={i}
                  className="w-4 h-4 text-[#E4B643] fill-[#E4B643]"
                  aria-hidden="true"
                />
              ))}
            </div>
            <blockquote className="text-[#C5CEC8] text-sm leading-relaxed mb-4 italic">
              &ldquo;{entry.quote}&rdquo;
            </blockquote>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#28382D] flex items-center justify-center text-[#E4B643] font-bold text-xs">
                {entry.name[0]}
              </div>
              <div>
                <p className="text-white text-sm font-semibold">{entry.name}</p>
                <p className="text-[#5A6A60] text-xs">{entry.city}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
