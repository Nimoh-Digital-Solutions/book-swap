import { useCallback, useState, type ReactElement } from 'react';

import { Star } from 'lucide-react';

interface StarRatingProps {
  value: number;
  onChange: (value: number) => void;
  max?: number;
  disabled?: boolean;
}

export function StarRating({ value, onChange, max = 5, disabled = false }: StarRatingProps): ReactElement {
  const [hover, setHover] = useState(0);

  const handleClick = useCallback(
    (star: number) => {
      if (!disabled) onChange(star);
    },
    [disabled, onChange],
  );

  return (
    <div className="inline-flex gap-1" role="radiogroup" aria-label="Rating">
      {Array.from({ length: max }, (_, i) => {
        const star = i + 1;
        const filled = star <= (hover || value);
        return (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={star === value}
            aria-label={`${star} star${star > 1 ? 's' : ''}`}
            disabled={disabled}
            className={`p-0.5 transition-transform ${
              disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:scale-110'
            }`}
            onClick={() => handleClick(star)}
            onMouseEnter={() => !disabled && setHover(star)}
            onMouseLeave={() => !disabled && setHover(0)}
          >
            <Star
              className={`w-8 h-8 ${filled ? 'fill-[#E4B643] text-[#E4B643]' : 'text-[#28382D]'}`}
              aria-hidden="true"
            />
          </button>
        );
      })}
    </div>
  );
}
