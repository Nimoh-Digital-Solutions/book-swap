import {
  type ReactElement,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import { logoMark } from "@assets";
import { Drawer } from "@components/common/Drawer";
import { LocaleLink } from "@components/common/LocaleLink/LocaleLink";
import { useAuthStore } from "@features/auth/stores/authStore";
import { NotificationBell } from "@features/notifications";
import { PATHS } from "@routes/config/paths";
import { Globe, Menu, X } from "lucide-react";

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
    void navigate(`/${nextLang}${rest}${location.search}${location.hash}`, {
      replace: true,
    });
  };

  return (
    <button
      onClick={cycleLanguage}
      className="inline-flex items-center justify-center gap-1.5 min-w-[44px] min-h-[44px] px-2 text-[#8C9C92] hover:text-white transition-colors rounded-lg"
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

/**
 * Mobile slide-in navigation drawer.
 *
 * Refactored in Sprint C to use the shared `Drawer` primitive — the
 * focus-trap, body-scroll-lock, Esc handling and exit animation now live
 * in one place (`components/common/Drawer`). This component is just the
 * mobile nav *content*: header bar, link list, and a footer Sign-In CTA
 * + LanguageToggle.
 *
 * Trigger + panel are wired together via `aria-controls` / `aria-expanded`
 * on the hamburger button (see `Header` below).
 */
function MobileNavDrawer({
  open,
  onClose,
  isAuthenticated,
  panelId,
}: {
  open: boolean;
  onClose: () => void;
  isAuthenticated: boolean;
  panelId: string;
}): ReactElement {
  const { t } = useTranslation();
  return (
    <Drawer
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      side="right"
      ariaLabel={t("home.nav.menuLabel", "Main menu")}
      id={panelId}
      panelClassName="w-[min(85vw,320px)] bg-[#1A251D] border-l border-[#28382D] shadow-2xl flex flex-col"
    >
      <div
        className="flex flex-col h-full"
        style={{
          ["--pt" as string]: "1.25rem",
          ["--pb" as string]: "1.25rem",
        }}
      >
        <div className="flex items-center justify-between px-5 pb-4 border-b border-[#28382D]">
          <span className="text-base font-bold text-white">
            {t("home.nav.menuLabel", "Main menu")}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="text-[#8C9C92] hover:text-white p-2 -mr-2 rounded-full min-w-[44px] min-h-[44px] inline-flex items-center justify-center"
            aria-label={t("common.close", "Close")}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav
          className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-1 text-base"
          aria-label={t("home.nav.menuLabel", "Main menu")}
        >
          <LocaleLink
            to={PATHS.BROWSE}
            onClick={onClose}
            className="py-3 px-3 -mx-3 rounded-xl text-[#E0E0E0] hover:text-white hover:bg-[#28382D]/40 transition-colors"
          >
            {t("home.nav.browse", "Browse")}
          </LocaleLink>
          <LocaleLink
            to={PATHS.HOW_IT_WORKS}
            onClick={onClose}
            className="py-3 px-3 -mx-3 rounded-xl text-[#E0E0E0] hover:text-white hover:bg-[#28382D]/40 transition-colors"
          >
            {t("home.nav.howItWorks", "How it Works")}
          </LocaleLink>
          <LocaleLink
            to={PATHS.COMMUNITY}
            onClick={onClose}
            className="py-3 px-3 -mx-3 rounded-xl text-[#E0E0E0] hover:text-white hover:bg-[#28382D]/40 transition-colors"
          >
            {t("home.nav.community", "Community")}
          </LocaleLink>
        </nav>

        <div className="px-5 pt-4 border-t border-[#28382D] flex flex-col gap-3">
          {!isAuthenticated && (
            <LocaleLink
              to={PATHS.LOGIN}
              onClick={onClose}
              className="bg-[#E4B643] hover:bg-[#D4A633] text-[#152018] px-5 py-3 rounded-full font-bold text-sm text-center transition-colors no-underline"
            >
              {t("home.nav.signIn", "Sign In")}
            </LocaleLink>
          )}
          <div className="flex justify-center">
            <LanguageToggle />
          </div>
        </div>
      </div>
    </Drawer>
  );
}

export const Header = ({ className }: { className?: string }): ReactElement => {
  const { t } = useTranslation();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const headerRef = useRef<HTMLElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const panelId = useId();
  const { pathname } = useLocation();

  // Publish the live header height as --header-h on :root so fill-parent
  // layouts (e.g. MapPage) can compute calc(100dvh - var(--header-h))
  // without hard-coding a magic number (RESP-004).
  useLayoutEffect(() => {
    const el = headerRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const update = () => {
      document.documentElement.style.setProperty(
        "--header-h",
        `${el.offsetHeight}px`,
      );
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      ro.disconnect();
    };
  }, []);

  // Close the mobile drawer whenever the route changes (covers programmatic
  // navigation that doesn't go through the in-drawer LocaleLink onClick).
  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  const closeMobileNav = useCallback(() => {
    setMobileNavOpen(false);
    // Restore focus to the trigger so keyboard users keep their place.
    triggerRef.current?.focus();
  }, []);

  return (
    <header
      ref={headerRef}
      className={`sticky top-0 z-40 bg-[#152018] backdrop-blur-[16px] border-b border-[#28382D]/50 ${className ?? ""}`}
    >
      <nav
        className="flex items-center justify-between px-6 py-5 max-w-7xl mx-auto"
        aria-label="Main navigation"
      >
        <div className="flex items-center gap-8">
          <LocaleLink to={PATHS.HOME} className="flex items-center gap-3">
            <img src={logoMark} alt="" width={32} height={32} />
            {/* Wordmark visually hidden below `sm` (RESP-014) — at 320 px the
              * right cluster (NotificationBell + ProfileDropdown + hamburger)
              * plus a language pill would push the layout off-screen. We keep
              * the text in the accessibility tree via `sr-only` so the link
              * still has an accessible name on mobile (the icon mark uses
              * empty `alt=""` to avoid duplicate alt + text axe violation). */}
            <span className="sr-only sm:not-sr-only text-xl font-bold tracking-tight text-white">
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
        <div className="flex items-center gap-2 sm:gap-3">
          {isAuthenticated && <NotificationBell enabled={isAuthenticated} />}
          {isAuthenticated ? (
            <ProfileDropdown />
          ) : (
            <LocaleLink
              to={PATHS.LOGIN}
              className="hidden sm:inline-block bg-[#E4B643] hover:bg-[#D4A633] text-[#152018] px-6 py-2 rounded-full font-bold text-sm transition-colors"
            >
              {t("home.nav.signIn", "Sign In")}
            </LocaleLink>
          )}
          <div className="hidden md:block">
            <LanguageToggle />
          </div>
          <button
            ref={triggerRef}
            type="button"
            onClick={() => setMobileNavOpen(true)}
            aria-controls={panelId}
            aria-expanded={mobileNavOpen}
            aria-label={t("home.nav.openMenu", "Open menu")}
            className="md:hidden inline-flex items-center justify-center w-11 h-11 -mr-2 rounded-full text-[#8C9C92] hover:text-white hover:bg-[#28382D]/40 transition-colors"
          >
            <Menu className="w-6 h-6" aria-hidden="true" />
          </button>
        </div>
      </nav>
      <MobileNavDrawer
        open={mobileNavOpen}
        onClose={closeMobileNav}
        isAuthenticated={isAuthenticated}
        panelId={panelId}
      />
    </header>
  );
};
