import type { ReactNode } from 'react';

import { logoMark } from '@assets';
import { LocaleLink } from '@components/common/LocaleLink/LocaleLink';
import { PATHS } from '@routes/config/paths';
import { Star } from 'lucide-react';

export type AuthView = 'login' | 'register' | 'forgot';

export interface AuthSplitPanelProps {
  view: AuthView;
  formContent: ReactNode;
  /** Headline for the branding panel */
  brandingTitle: ReactNode;
  /** Subtitle text for the branding panel */
  brandingSubtitle: string;
  /** Testimonial quote (optional — omit to hide testimonial card) */
  quote?: string;
  /** Testimonial author name */
  authorName?: string;
  /** Testimonial author detail line */
  authorDetails?: string;
  /** Progress bar 0–100. Default 100. */
  progress?: number;
}

/**
 * AuthSplitPanel
 *
 * Full-viewport two-panel layout for authentication screens.
 * Left (5/12): dark branding panel with logo, headline, testimonial.
 * Right (7/12): form content with progress bar.
 *
 * Uses Tailwind classes matching "The Archival Naturalist" design system.
 */
export function AuthSplitPanel({
  formContent,
  brandingTitle,
  brandingSubtitle,
  quote,
  authorName,
  authorDetails,
  progress = 100,
}: AuthSplitPanelProps) {
  return (
    <main className="min-h-[100dvh] bg-background-dark flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-7xl bg-surface-dark shadow-2xl rounded-2xl overflow-hidden flex flex-col md:flex-row min-h-[700px] border border-border-dark">
        {/* ── Branding panel (left) ────────────────────────────── */}
        <div className="md:w-6/12 bg-background-dark text-white p-8 md:p-12 flex-col justify-between relative overflow-hidden border-r border-border-dark hidden md:flex">
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-background-dark/80 via-transparent to-background-dark/90 z-0" aria-hidden="true" />

          <div className="relative z-10">
            <LocaleLink to={PATHS.HOME} className="inline-flex items-center gap-3 mb-8">
              <img src={logoMark} alt="" width={32} height={32} />
              <span className="text-xl font-bold tracking-tight text-white">BookSwap</span>
            </LocaleLink>
            <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-6 mt-6">
              {brandingTitle}
            </h1>
            <p className="text-text-secondary text-lg leading-relaxed mt-12">
              {brandingSubtitle}
            </p>
          </div>

          {quote && (
            <div className="relative z-10 mt-12 md:mt-0">
              <div className="bg-surface-dark/80 backdrop-blur-sm p-6 rounded-xl border border-border-dark">
                <div className="flex text-[#E4B643] mb-3 gap-1" aria-label="5 stars">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" aria-hidden="true" />
                  ))}
                </div>
                <p className="italic text-gray-200 mb-4">&ldquo;{quote}&rdquo;</p>
                {authorName && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#E4B643] to-[#d9b93e] flex items-center justify-center text-[#152018] text-sm font-bold border-2 border-[#E4B643]">
                      {authorName.charAt(0) + (authorName.split(' ').slice(-1)[0]?.charAt(0) ?? '')}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-white">{authorName}</p>
                      {authorDetails && (
                        <p className="text-xs text-text-secondary">{authorDetails}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── Form panel (right) ──────────────────────────────── */}
        <div className="md:w-6/12 bg-surface-dark p-8 md:p-12 lg:p-16 flex flex-col justify-center relative">
          {/* Progress bar */}
          <div className="absolute top-0 left-0 w-full h-1 bg-[#28382D]" aria-hidden="true">
            <div
              className="h-full bg-[#E4B643] transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Mobile logo (hidden on desktop) */}
          <div className="md:hidden mb-8">
            <LocaleLink to={PATHS.HOME} className="inline-flex items-center gap-3">
              <img src={logoMark} alt="" width={32} height={32} />
              <span className="text-xl font-bold tracking-tight text-white">BookSwap</span>
            </LocaleLink>
          </div>

          <div className="max-w-md mx-auto w-full relative z-10">
            {formContent}
          </div>
        </div>
      </div>
    </main>
  );
}
