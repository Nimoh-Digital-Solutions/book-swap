/**
 * SetLocationPrompt — shown when the user hasn't set their location.
 */
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { MapPin } from 'lucide-react';

export function SetLocationPrompt(): ReactElement {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <MapPin className="w-16 h-16 text-[#E4B643] mb-4" aria-hidden="true" />
      <p className="text-white text-lg font-medium mb-2">
        {t(
          'discovery.location.required',
          'Set your location to discover nearby books',
        )}
      </p>
      <Link
        to="/profile/edit"
        className="inline-flex items-center gap-2 mt-4 px-6 py-2.5 bg-[#E4B643] text-[#152018] rounded-xl font-medium text-sm hover:bg-[#E4B643]/90 transition-colors"
      >
        {t('discovery.location.setButton', 'Set Location')}
      </Link>
    </div>
  );
}
