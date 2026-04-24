import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";

import { LocaleLink } from "@components/common/LocaleLink/LocaleLink";
import { PATHS } from "@routes/config/paths";

interface CommunityCtaProps {
  isAuthenticated: boolean;
}

/** Final marketing CTA — variant changes for authed vs anon users. */
export function CommunityCta({ isAuthenticated }: CommunityCtaProps): ReactElement {
  const { t } = useTranslation();

  return (
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
  );
}
