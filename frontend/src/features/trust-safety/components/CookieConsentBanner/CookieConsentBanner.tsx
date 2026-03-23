import { useCallback, useEffect, useState, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import { Cookie } from 'lucide-react';

const CONSENT_KEY = 'bookswap_cookie_consent';

interface ConsentRecord {
  accepted: boolean;
  timestamp: string;
}

export function CookieConsentBanner(): ReactElement | null {
  const { t } = useTranslation('trust-safety');
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(CONSENT_KEY);
      if (!stored) {
        setVisible(true);
      }
    } catch {
      setVisible(true);
    }
  }, []);

  const handleAccept = useCallback(() => {
    const record: ConsentRecord = {
      accepted: true,
      timestamp: new Date().toISOString(),
    };
    try {
      localStorage.setItem(CONSENT_KEY, JSON.stringify(record));
    } catch {
      // Storage full or blocked — still dismiss banner
    }
    setVisible(false);
  }, []);

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 bg-[#1A251D] border-t border-[#28382D] px-4 py-3"
      role="alert"
      aria-live="polite"
    >
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center gap-3">
        <Cookie className="w-5 h-5 text-[#E4B643] shrink-0" aria-hidden="true" />
        <p className="text-sm text-[#8C9C92] flex-1 text-center sm:text-left">
          {t('cookieConsent.message')}
        </p>
        <div className="flex gap-2 shrink-0">
          <button
            type="button"
            onClick={handleAccept}
            className="px-4 py-1.5 text-sm bg-[#E4B643] text-[#0D1A12] rounded-lg hover:bg-[#D4A633] transition-colors font-medium"
          >
            {t('cookieConsent.accept')}
          </button>
        </div>
      </div>
    </div>
  );
}
