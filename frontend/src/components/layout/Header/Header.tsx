import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import { logoMark } from "@assets";
import { LocaleLink } from "@components/common/LocaleLink/LocaleLink";
import { useAuthStore } from "@features/auth/stores/authStore";
import { NotificationBell } from "@features/notifications";
import { PATHS } from "@routes/config/paths";
import { Globe } from "lucide-react";

import { SUPPORTED_LANGUAGES, type SupportedLanguage } from "../../../i18n";
import { ProfileDropdown } from "./ProfileDropdown";

const LANGUAGE_LABELS: Record<SupportedLanguage, string> = {
  en: "EN",
  nl: "NL",
  fr: "FR",
};

function LanguageToggle(): ReactElement {
  const { lng } = useParams<{ lng: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const currentLang = (lng ?? "en") as SupportedLanguage;

  const currentIdx = SUPPORTED_LANGUAGES.indexOf(currentLang);
  const nextLang =
    SUPPORTED_LANGUAGES[(currentIdx + 1) % SUPPORTED_LANGUAGES.length] ?? SUPPORTED_LANGUAGES[0]!;

  const cycleLanguage = () => {
    const rest =
      location.pathname.replace(new RegExp(`^/${currentLang}`), "") || "/";
    navigate(`/${nextLang}${rest}${location.search}${location.hash}`, {
      replace: true,
    });
  };

  return (
    <button
      onClick={cycleLanguage}
      className="flex items-center gap-1.5 text-[#8C9C92] hover:text-white transition-colors"
      aria-label={`Language: ${LANGUAGE_LABELS[currentLang]}. Switch to ${LANGUAGE_LABELS[nextLang]}`}
      title={`Switch to ${LANGUAGE_LABELS[nextLang]}`}
    >
      <Globe className="w-4 h-4" />
      <span className="text-xs font-semibold">
        {LANGUAGE_LABELS[currentLang]}
      </span>
    </button>
  );
}

function NavLink({ to, children }: { to: string; children: React.ReactNode }) {
  const { lng = "en" } = useParams<{ lng: string }>();
  const { pathname } = useLocation();
  const isActive = pathname === `/${lng}${to}`;

  return (
    <LocaleLink
      to={to}
      className={`transition-colors ${isActive ? "text-[#E4B643]" : "text-[#8C9C92] hover:text-white"}`}
    >
      {children}
    </LocaleLink>
  );
}

export const Header = ({ className }: { className?: string }): ReactElement => {
  const { t } = useTranslation();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return (
    <header
      className={`sticky top-0 z-40 bg-[#152018] backdrop-blur-[16px] border-b border-[#28382D]/50 ${className ?? ""}`}
    >
      <nav
        className="flex items-center justify-between px-6 py-5 max-w-7xl mx-auto"
        aria-label="Main navigation"
        style={{ marginInline: "auto" }}
      >
        <div className="flex items-center gap-8">
          <LocaleLink to={PATHS.HOME} className="flex items-center gap-3">
            <img src={logoMark} alt="" width={32} height={32} />
            <span className="text-xl font-bold tracking-tight text-white">
              BookSwap
            </span>
          </LocaleLink>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium">
            <NavLink to={PATHS.BROWSE}>
              {t("home.nav.browse", "Browse")}
            </NavLink>
            <NavLink to={PATHS.HOW_IT_WORKS}>
              {t("home.nav.howItWorks", "How it Works")}
            </NavLink>
            <NavLink to={PATHS.COMMUNITY}>
              {t("home.nav.community", "Community")}
            </NavLink>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isAuthenticated && <NotificationBell enabled={isAuthenticated} />}
          {isAuthenticated ? (
            <ProfileDropdown />
          ) : (
            <LocaleLink
              to={PATHS.LOGIN}
              className="bg-[#E4B643] hover:bg-[#D4A633] text-[#152018] px-6 py-2 rounded-full font-bold text-sm transition-colors"
            >
              {t("home.nav.signIn", "Sign In")}
            </LocaleLink>
          )}
          <LanguageToggle />
        </div>
      </nav>
    </header>
  );
};
