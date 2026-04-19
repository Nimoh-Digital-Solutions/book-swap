import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import { GENRE_OPTIONS } from '@constants/bookOptions';

const MAX_GENRES = 3;

export interface BookGenrePickerProps {
  value: string[];
  onChange: (genres: string[]) => void;
  error?: string | undefined;
}

export function BookGenrePicker({ value, onChange, error }: BookGenrePickerProps): ReactElement {
  const { t } = useTranslation();

  const toggle = (genre: string) => {
    if (value.includes(genre)) {
      onChange(value.filter(g => g !== genre));
    } else if (value.length < MAX_GENRES) {
      onChange([...value, genre]);
    }
  };

  return (
    <fieldset>
      <legend className="block text-sm font-medium text-[#8C9C92] mb-2">
        {t('books.addBook.genresLabel', 'Genres')}
        <span className="ml-2 text-xs text-[#5A6A60]">
          ({value.length}/{MAX_GENRES})
        </span>
      </legend>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {GENRE_OPTIONS.map(genre => {
          const selected = value.includes(genre);
          const disabled = !selected && value.length >= MAX_GENRES;
          return (
            <button
              key={genre}
              type="button"
              role="checkbox"
              aria-checked={selected}
              disabled={disabled}
              onClick={() => toggle(genre)}
              className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                selected
                  ? 'bg-[#E4B643] text-[#152018] border-[#E4B643]'
                  : disabled
                    ? 'bg-[#152018] text-[#5A6A60] border-[#28382D] cursor-not-allowed opacity-50'
                    : 'bg-[#152018] text-[#8C9C92] border-[#28382D] hover:border-[#E4B643] hover:text-white'
              }`}
            >
              {genre}
            </button>
          );
        })}
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-400" role="alert">{error}</p>
      )}
    </fieldset>
  );
}
