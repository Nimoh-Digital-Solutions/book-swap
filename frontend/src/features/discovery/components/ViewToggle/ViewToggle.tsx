import { type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import { List, Map } from 'lucide-react';

export type ViewMode = 'list' | 'map';

interface ViewToggleProps {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
}

export function ViewToggle({ value, onChange }: ViewToggleProps): ReactElement {
  const { t } = useTranslation();

  return (
    <div
      className="inline-flex rounded-xl border border-[#28382D] bg-[#1A251D] p-1"
      role="radiogroup"
      aria-label={t('discovery.viewToggle.label', 'View mode')}
    >
      <button
        type="button"
        role="radio"
        aria-checked={value === 'list'}
        onClick={() => onChange('list')}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
          value === 'list'
            ? 'bg-[#E4B643] text-[#152018]'
            : 'text-[#8C9C92] hover:text-white'
        }`}
      >
        <List className="w-3.5 h-3.5" />
        {t('discovery.viewToggle.list', 'List')}
      </button>
      <button
        type="button"
        role="radio"
        aria-checked={value === 'map'}
        onClick={() => onChange('map')}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
          value === 'map'
            ? 'bg-[#E4B643] text-[#152018]'
            : 'text-[#8C9C92] hover:text-white'
        }`}
      >
        <Map className="w-3.5 h-3.5" />
        {t('discovery.viewToggle.map', 'Map')}
      </button>
    </div>
  );
}
