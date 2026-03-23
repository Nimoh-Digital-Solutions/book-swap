import type { ReactElement } from 'react';

import { Star } from 'lucide-react';

interface StarDisplayProps {
  score: number;
  max?: number;
  size?: 'sm' | 'md';
}

const SIZE_MAP = {
  sm: 'w-3.5 h-3.5',
  md: 'w-5 h-5',
} as const;

export function StarDisplay({ score, max = 5, size = 'sm' }: StarDisplayProps): ReactElement {
  const cls = SIZE_MAP[size];

  return (
    <div className="inline-flex gap-0.5" aria-label={`${score} out of ${max} stars`}>
      {Array.from({ length: max }, (_, i) => (
        <Star
          key={i}
          className={`${cls} ${i < score ? 'fill-[#E4B643] text-[#E4B643]' : 'text-[#28382D]'}`}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}
