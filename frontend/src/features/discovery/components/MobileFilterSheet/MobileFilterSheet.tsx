/**
 * MobileFilterSheet — bottom sheet overlay for mobile filter panel.
 *
 * Triggered by a "Filters" button, slides up from the bottom.
 * Contains the FilterPanel and an "Apply" button.
 */
import { type ReactElement, useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { X } from 'lucide-react';

interface MobileFilterSheetProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export function MobileFilterSheet({
  open,
  onClose,
  children,
}: MobileFilterSheetProps): ReactElement | null {
  const { t } = useTranslation();
  const sheetRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, handleKeyDown]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label={t('discovery.filters.title', 'Filters')}
        className="relative w-full max-w-none sm:max-w-lg max-h-[85dvh] bg-[#1A251D] border-t border-[#28382D] rounded-t-2xl overflow-y-auto px-6 pt-6 pb-safe animate-slide-up"
        style={{
          // Adds the iOS home-indicator inset to the existing 1.5rem
          // bottom padding (RESP-006). See tailwind.css `*-safe` utilities.
          ['--pb' as string]: '1.5rem',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white">
            {t('discovery.filters.title', 'Filters')}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center min-w-[44px] min-h-[44px] -mr-2 rounded-full text-[#8C9C92] hover:text-white"
            aria-label={t('common.cancel', 'Close')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter content */}
        {children}

        {/* Apply button */}
        <div className="mt-6 pt-4 border-t border-[#28382D]">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 bg-[#E4B643] text-[#152018] rounded-xl font-medium text-sm hover:bg-[#E4B643]/90 transition-colors"
          >
            {t('discovery.filters.apply', 'Apply Filters')}
          </button>
        </div>
      </div>
    </div>
  );
}
