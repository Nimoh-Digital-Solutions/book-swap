import { type ReactElement, useState } from "react";
import { useTranslation } from "react-i18next";

import { SEOHead } from "@components";
import { LocaleLink } from "@components/common/LocaleLink/LocaleLink";
import { useAuth } from "@features/auth";
import { PATHS, routeMetadata } from "@routes/config/paths";
import {
  ArrowLeftRight,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  MapPin,
  MessageCircle,
  Search,
  Shield,
  Star,
  Users,
} from "lucide-react";

const STEPS = [
  {
    icon: BookOpen,
    titleKey: "list",
    titleDefault: "List Your Books",
    descDefault:
      "Scan your book's barcode or type the title — we'll automatically fetch the details, cover art, and ISBN. Add a quick condition note and a photo, and your book is live in seconds.",
    detailDefault:
      "Your listing is instantly visible to readers nearby. You can list as many books as you like, and update or remove them any time from your shelf.",
  },
  {
    icon: Search,
    titleKey: "find",
    titleDefault: "Find & Request",
    descDefault:
      "Browse the interactive map or search by title, author, genre, or ISBN. When you spot something you love, send a swap request with a single tap.",
    detailDefault:
      "Filter by distance, condition, and genre to find exactly what you want. Add books to your wishlist and get notified when they become available near you.",
  },
  {
    icon: ArrowLeftRight,
    titleKey: "swap",
    titleDefault: "Swap Locally",
    descDefault:
      "Agree on a time and place through in-app messaging. Meet at a safe, public location and exchange books in person.",
    detailDefault:
      "After the swap, both of you leave a rating. Your reading history grows, your shelf refreshes, and the cycle continues.",
  },
] as const;

const SAFETY_TIPS = [
  {
    icon: MapPin,
    textDefault:
      "Always meet in a public, well-lit location such as a library, café, or bookshop.",
  },
  {
    icon: Users,
    textDefault:
      "Let someone know where you're going, especially for a first-time swap.",
  },
  {
    icon: BookOpen,
    textDefault:
      "Inspect the book at the time of exchange. Raise any condition concerns immediately.",
  },
  {
    icon: MessageCircle,
    textDefault:
      "Use BookSwap messaging to coordinate — avoid sharing personal contact details until you're comfortable.",
  },
  {
    icon: Star,
    textDefault:
      "Leave an honest rating after every exchange to help build community trust.",
  },
  {
    icon: Shield,
    textDefault:
      "Report any suspicious behaviour through the in-app report feature. We review all reports within 48 hours.",
  },
] as const;

const GETTING_STARTED = [
  { textDefault: "Create your free BookSwap account." },
  { textDefault: "Set your location so we can show you books nearby." },
  { textDefault: "List your first book — scan the barcode or type the title." },
  { textDefault: "Browse the catalogue and request a swap." },
  { textDefault: "Meet up, exchange books, and leave a rating!" },
] as const;

const FAQ_ITEMS = [
  {
    q: "Is BookSwap really free?",
    a: "Yes, BookSwap is completely free to use. There are no fees for listing books, requesting swaps, or messaging other users.",
  },
  {
    q: "How do I know the book is in good condition?",
    a: "Sellers describe the condition when listing (New, Like New, Good, Fair). Photos are also included. You can always ask the owner for more details via messaging before requesting a swap.",
  },
  {
    q: "What if the other person doesn't show up?",
    a: "If someone doesn't show up or cancels repeatedly, you can report them through the in-app reporting feature. No-shows affect their community rating.",
  },
  {
    q: "Can I swap more than one book at a time?",
    a: "Absolutely! You can arrange multi-book swaps through messaging. Each swap request is for one book, but you can coordinate multiple swaps with the same person.",
  },
  {
    q: "Do I have to swap one-for-one?",
    a: "The standard model is one book for one book, but you and your swap partner can agree on any arrangement that works for both of you.",
  },
  {
    q: "What areas does BookSwap cover?",
    a: "BookSwap is available in the Netherlands, Belgium, and France. We're expanding to more countries soon. The platform works best in urban areas with an active community.",
  },
  {
    q: "How do ratings work?",
    a: "After each completed exchange, both parties can leave a 1–5 star rating and an optional review. Ratings are public and help the community identify trustworthy swappers.",
  },
  {
    q: "Can I delete my account and data?",
    a: "Yes. Go to Settings → Delete Account. All your personal data is permanently removed within 30 days. See our Privacy Policy for details.",
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

export default function HowItWorksPage(): ReactElement {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-[100dvh] bg-[#152018] text-[#8C9C92]">
      <SEOHead
        title={routeMetadata[PATHS.HOW_IT_WORKS].title}
        description={routeMetadata[PATHS.HOW_IT_WORKS].description}
        path={PATHS.HOW_IT_WORKS}
      />
      {/* Hero */}
      <section className="relative overflow-hidden pb-8">
        <div
          className="absolute inset-0 pointer-events-none"
          aria-hidden="true"
        >
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[90vw] h-[40vh] md:w-[900px] md:h-[500px] bg-[#E4B643]/6 blur-[140px] rounded-full" />
          <div className="absolute top-1/3 -left-32 w-[60vw] h-[40vh] md:w-[400px] md:h-[400px] bg-[#E4B643]/4 blur-[120px] rounded-full" />
          <div className="absolute top-1/4 -right-32 w-[50vw] h-[30vh] md:w-[300px] md:h-[300px] bg-[#4ADE80]/3 blur-[100px] rounded-full" />
        </div>
        <div
          className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 text-center"
          style={{ marginInline: "auto" }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#1A251D] border border-[#28382D] text-[#E4B643] text-xs font-semibold mb-8">
            <BookOpen className="w-3.5 h-3.5" aria-hidden="true" />
            {t("howItWorks.hero.badge", "3 steps to your first swap")}
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold text-white tracking-tight mb-6 leading-[1.08]">
            {t("howItWorks.hero.titleLine1", "Your complete guide to")}{" "}
            <span className="text-[#E4B643]">
              {t("howItWorks.hero.titleLine2", "book swapping.")}
            </span>
          </h1>
          <p className="text-lg md:text-xl text-[#8C9C92] max-w-2xl mx-auto">
            {t(
              "howItWorks.hero.subtitle",
              "From listing your first book to completing a swap — everything you need to know in three simple steps.",
            )}
          </p>
        </div>
      </section>

      {/* Steps */}
      <section
        className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16"
        style={{ marginInline: "auto" }}
      >
        <div className="relative">
          <div
            className="absolute left-6 top-12 bottom-12 w-px bg-[#28382D] hidden md:block"
            aria-hidden="true"
          />

          <div className="space-y-12">
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.titleKey}
                  className="flex gap-6 md:gap-8 relative"
                >
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[#152018] border-2 border-[#E4B643] text-[#E4B643] flex items-center justify-center font-bold text-lg z-10">
                    {i + 1}
                  </div>
                  <div className="bg-[#1A251D] border border-[#28382D] rounded-2xl p-6 md:p-8 flex-1">
                    <h3 className="text-xl font-bold text-white mb-3 flex items-center gap-3">
                      <Icon
                        className="w-6 h-6 text-[#E4B643]"
                        aria-hidden="true"
                      />
                      {t(
                        `howItWorks.steps.${step.titleKey}.title`,
                        step.titleDefault,
                      )}
                    </h3>
                    <p className="text-[#8C9C92] leading-relaxed mb-3">
                      {t(
                        `howItWorks.steps.${step.titleKey}.description`,
                        step.descDefault,
                      )}
                    </p>
                    <p className="text-[#5A6A60] text-sm leading-relaxed">
                      {t(
                        `howItWorks.steps.${step.titleKey}.detail`,
                        step.detailDefault,
                      )}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Safety Tips */}
      <section
        className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16"
        style={{ marginInline: "auto" }}
      >
        <div className="text-center mb-12">
          <Shield
            className="w-10 h-10 text-[#E4B643] mx-auto mb-4"
            aria-hidden="true"
          />
          <h2 className="text-3xl font-extrabold text-white mb-3">
            {t("howItWorks.safety.title", "Safety Tips")}
          </h2>
          <p className="text-[#8C9C92] max-w-xl mx-auto">
            {t(
              "howItWorks.safety.subtitle",
              "BookSwap is built on trust. Follow these tips to keep every exchange safe and positive.",
            )}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {SAFETY_TIPS.map((tip, i) => {
            const Icon = tip.icon;
            return (
              <div
                key={i}
                className="bg-[#1A251D] border border-[#28382D] rounded-xl p-5 flex gap-4"
              >
                <Icon
                  className="w-5 h-5 text-[#E4B643] flex-shrink-0 mt-0.5"
                  aria-hidden="true"
                />
                <p className="text-sm text-[#C5CEC8] leading-relaxed">
                  {t(`howItWorks.safety.tips.${i}`, tip.textDefault)}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Getting Started */}
      <section
        className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16"
        style={{ marginInline: "auto" }}
      >
        <div className="bg-[#1A251D] border border-[#28382D] rounded-3xl p-8 md:p-12">
          <h2 className="text-2xl font-extrabold text-white mb-2">
            {t("howItWorks.gettingStarted.title", "Getting Started Checklist")}
          </h2>
          <p className="text-[#8C9C92] mb-8">
            {t(
              "howItWorks.gettingStarted.subtitle",
              "Five steps from sign-up to your first swap.",
            )}
          </p>

          <ol className="space-y-4">
            {GETTING_STARTED.map((step, i) => (
              <li key={i} className="flex items-start gap-4">
                <CheckCircle2
                  className="w-5 h-5 text-[#E4B643] flex-shrink-0 mt-0.5"
                  aria-hidden="true"
                />
                <span className="text-[#C5CEC8] text-sm leading-relaxed">
                  {t(`howItWorks.gettingStarted.steps.${i}`, step.textDefault)}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* FAQ */}
      <section
        className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16"
        style={{ marginInline: "auto" }}
      >
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold text-white mb-3">
            {t("howItWorks.faq.title", "Frequently Asked Questions")}
          </h2>
          <p className="text-[#8C9C92]">
            {t("howItWorks.faq.subtitle", "Got questions? We've got answers.")}
          </p>
        </div>

        <div className="space-y-3">
          {FAQ_ITEMS.map((item, i) => (
            <FaqItem
              key={i}
              question={t(`howItWorks.faq.items.${i}.q`, item.q)}
              answer={t(`howItWorks.faq.items.${i}.a`, item.a)}
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
            {t("howItWorks.cta.title", "Ready to start?")}
          </h2>
          <p className="text-[#152018]/80 text-lg font-medium mb-8 max-w-xl mx-auto">
            {t(
              "howItWorks.cta.subtitle",
              "Create your account and list your first book in under a minute.",
            )}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {isAuthenticated ? (
              <>
                <LocaleLink
                  to={PATHS.CATALOGUE}
                  className="bg-[#152018] hover:bg-black text-white px-8 py-4 rounded-full font-bold transition-colors no-underline"
                >
                  {t("howItWorks.cta.browse", "Browse Books")}
                </LocaleLink>
                <LocaleLink
                  to={PATHS.ADD_BOOK}
                  className="bg-transparent border border-[#152018]/30 text-[#152018] hover:bg-[#152018]/10 px-8 py-4 rounded-full font-bold transition-colors no-underline"
                >
                  {t("howItWorks.cta.addBook", "List a Book")}
                </LocaleLink>
              </>
            ) : (
              <>
                <LocaleLink
                  to={PATHS.REGISTER}
                  className="bg-[#152018] hover:bg-black text-white px-8 py-4 rounded-2xl font-bold transition-colors no-underline"
                >
                  {t("howItWorks.cta.register", "Create Free Account")}
                </LocaleLink>
                <LocaleLink
                  to={PATHS.BROWSE}
                  className="bg-transparent border border-[#152018]/30 text-[#152018] hover:bg-[#152018]/10 px-8 py-4 rounded-2xl font-bold transition-colors no-underline"
                >
                  {t("howItWorks.cta.browseCta", "Browse Books First")}
                </LocaleLink>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
