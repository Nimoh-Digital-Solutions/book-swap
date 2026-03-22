/**
 * RadiusSelector — segmented control for distance filter.
 * Shows book count per option from useRadiusCounts.
 */
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import type { RadiusCounts } from '../../types/discovery.types';

const RADIUS_OPTIONS = [
  { label: '1 km', value: 1000 },
  { label: '3 km', value: 3000 },
  { label: '5 km', value: 5000 },
  { label: '10 km', value: 10000 },
  { label: '25 km', value: 25000 },
];

interface RadiusSelectorProps {
  value: number;
  onChange: (radius: number) => void;
  counts?: RadiusCounts | undefined;
}

export function RadiusSelector({
  value,
  onChange,
  counts,
}: RadiusSelectorProps): ReactElement {
  const { t } = useTranslation();

  return (
    <div role="radiogroup" aria-label={t('discovery.radius.label', 'Distance')}>
      <div className="inline-flex rounded-xl border border-[#28382D] overflow-hidden">
        {RADIUS_OPTIONS.map(opt => {
          const isActive = value === opt.value;
          const count = counts?.counts[String(opt.value)];

          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={isActive}
              onClick={() => onChange(opt.value)}
              className={`px-3 py-2 text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-[#E4B643] text-[#152018]'
                  : 'bg-[#1A251D] text-[#8C9C92] hover:text-white'
              }`}
            >
              {opt.label}
              {count != null && (
                <span className="ml-1 opacity-70">({count})</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
