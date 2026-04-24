import { type ReactElement, useState } from "react";
import { useTranslation } from "react-i18next";

import { ChevronDown } from "lucide-react";

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

/** FAQ accordion section. */
export function CommunityFaq(): ReactElement {
  const { t } = useTranslation();

  return (
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
  );
}

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
