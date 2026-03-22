/**
 * FilterGroup — reusable multi-select toggle group for browse filters.
 */
import type { ReactElement } from 'react';

interface FilterGroupProps {
  label: string;
  options: readonly { value: string; label: string }[];
  selected: string[];
  onChange: (selected: string[]) => void;
}

export function FilterGroup({
  label,
  options,
  selected,
  onChange,
}: FilterGroupProps): ReactElement {
  const toggle = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter(v => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  return (
    <fieldset>
      <legend className="block text-sm font-medium text-[#8C9C92] mb-2">
        {label}
      </legend>
      <div className="flex flex-wrap gap-2">
        {options.map(opt => {
          const isSelected = selected.includes(opt.value);
          return (
            <button
              key={opt.value}
              type="button"
              role="checkbox"
              aria-checked={isSelected}
              onClick={() => toggle(opt.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                isSelected
                  ? 'bg-[#E4B643] text-[#152018]'
                  : 'bg-[#28382D] text-[#8C9C92] hover:text-white'
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
