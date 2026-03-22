import type { ReactElement } from 'react';
import type { FieldValues, Resolver } from 'react-hook-form';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { Loader2 } from 'lucide-react';
import { z } from 'zod';

import { createBookSchema } from '../../schemas/book.schemas';
import type { BookCondition, BookLanguage, CreateBookPayload } from '../../types/book.types';
import { BookGenrePicker } from '../BookGenrePicker/BookGenrePicker';

// ---------------------------------------------------------------------------
// Zod resolver
// ---------------------------------------------------------------------------
function makeZodResolver<T extends FieldValues>(schema: z.ZodType<T>): Resolver<T> {
  return async values => {
    const result = schema.safeParse(values);
    if (result.success) return { values: result.data, errors: {} };

    const errors: Record<string, { type: string; message: string }> = {};
    for (const issue of result.error.issues) {
      const key = String(issue.path[0] ?? issue.path.join('.'));
      if (!errors[key]) errors[key] = { type: issue.code, message: issue.message };
    }
    return { errors: errors as never, values: {} as never };
  };
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
export interface BookFormProps {
  defaultValues?: Partial<CreateBookPayload>;
  onSubmit: (values: CreateBookPayload) => void;
  isSubmitting?: boolean;
  submitLabel?: string;
  submittingLabel?: string;
}

type FormValues = z.infer<typeof createBookSchema>;

const CONDITIONS: BookCondition[] = ['new', 'like_new', 'good', 'acceptable'];
const LANGUAGES: BookLanguage[] = ['en', 'nl', 'de', 'fr', 'es', 'other'];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function BookForm({
  defaultValues,
  onSubmit,
  isSubmitting = false,
  submitLabel,
  submittingLabel,
}: BookFormProps): ReactElement {
  const { t } = useTranslation();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: makeZodResolver(createBookSchema),
    mode: 'onTouched',
    defaultValues: {
      isbn: defaultValues?.isbn ?? '',
      title: defaultValues?.title ?? '',
      author: defaultValues?.author ?? '',
      description: defaultValues?.description ?? '',
      condition: defaultValues?.condition,
      language: defaultValues?.language,
      genres: defaultValues?.genres ?? [],
      notes: defaultValues?.notes ?? '',
      cover_url: defaultValues?.cover_url ?? '',
      page_count: defaultValues?.page_count ?? undefined,
      publish_year: defaultValues?.publish_year ?? undefined,
    } as FormValues,
  });

  const inputBase =
    'block w-full px-3 py-3 border rounded-xl text-sm bg-[#152018] text-white placeholder-[#5A6A60] transition-colors focus:ring-[#E4B643] focus:border-[#E4B643]';

  const handleFormSubmit = handleSubmit((values: FormValues) => {
    onSubmit(values as CreateBookPayload);
  });

  return (
    <form className="space-y-6" onSubmit={handleFormSubmit} noValidate>
      {/* Title */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-[#8C9C92] mb-1">
          {t('books.addBook.titleLabel', 'Title')}
        </label>
        <input
          id="title"
          type="text"
          placeholder={t('books.addBook.titlePlaceholder', 'e.g. The Great Gatsby')}
          className={`${inputBase} ${errors.title ? 'border-red-500' : 'border-[#28382D]'}`}
          {...register('title')}
        />
        {errors.title && (
          <p className="mt-1 text-sm text-red-400" role="alert">{errors.title.message}</p>
        )}
      </div>

      {/* Author */}
      <div>
        <label htmlFor="author" className="block text-sm font-medium text-[#8C9C92] mb-1">
          {t('books.addBook.authorLabel', 'Author')}
        </label>
        <input
          id="author"
          type="text"
          placeholder={t('books.addBook.authorPlaceholder', 'e.g. F. Scott Fitzgerald')}
          className={`${inputBase} ${errors.author ? 'border-red-500' : 'border-[#28382D]'}`}
          {...register('author')}
        />
        {errors.author && (
          <p className="mt-1 text-sm text-red-400" role="alert">{errors.author.message}</p>
        )}
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-[#8C9C92] mb-1">
          {t('books.addBook.descriptionLabel', 'Description')}
          <span className="ml-1 text-xs text-[#5A6A60]">({t('common.optional', 'optional')})</span>
        </label>
        <textarea
          id="description"
          rows={3}
          placeholder={t('books.addBook.descriptionPlaceholder', 'Brief description of the book…')}
          className={`${inputBase} resize-none ${errors.description ? 'border-red-500' : 'border-[#28382D]'}`}
          {...register('description')}
        />
        {errors.description && (
          <p className="mt-1 text-sm text-red-400" role="alert">{errors.description.message}</p>
        )}
      </div>

      {/* Condition + Language row */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="condition" className="block text-sm font-medium text-[#8C9C92] mb-1">
            {t('books.addBook.conditionLabel', 'Condition')}
          </label>
          <select
            id="condition"
            className={`${inputBase} ${errors.condition ? 'border-red-500' : 'border-[#28382D]'}`}
            {...register('condition')}
          >
            <option value="">—</option>
            {CONDITIONS.map(c => (
              <option key={c} value={c}>
                {t(`books.addBook.conditions.${c}`, c)}
              </option>
            ))}
          </select>
          {errors.condition && (
            <p className="mt-1 text-sm text-red-400" role="alert">{errors.condition.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="language" className="block text-sm font-medium text-[#8C9C92] mb-1">
            {t('books.addBook.languageLabel', 'Language')}
          </label>
          <select
            id="language"
            className={`${inputBase} ${errors.language ? 'border-red-500' : 'border-[#28382D]'}`}
            {...register('language')}
          >
            <option value="">—</option>
            {LANGUAGES.map(l => (
              <option key={l} value={l}>
                {t(`books.addBook.languages.${l}`, l)}
              </option>
            ))}
          </select>
          {errors.language && (
            <p className="mt-1 text-sm text-red-400" role="alert">{errors.language.message}</p>
          )}
        </div>
      </div>

      {/* Genres */}
      <Controller
        name="genres"
        control={control}
        render={({ field }) => (
          <BookGenrePicker
            value={field.value ?? []}
            onChange={field.onChange}
            error={errors.genres?.message}
          />
        )}
      />

      {/* Notes */}
      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-[#8C9C92] mb-1">
          {t('books.addBook.notesLabel', 'Notes')}
          <span className="ml-1 text-xs text-[#5A6A60]">({t('common.optional', 'optional')})</span>
        </label>
        <textarea
          id="notes"
          rows={2}
          placeholder={t('books.addBook.notesPlaceholder', 'Any notes for potential swappers…')}
          className={`${inputBase} resize-none border-[#28382D]`}
          {...register('notes')}
        />
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full flex items-center justify-center gap-2 py-3 px-6 bg-[#E4B643] hover:bg-[#d9b93e] text-[#152018] font-bold rounded-xl transition-colors disabled:opacity-50"
      >
        {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
        {isSubmitting
          ? (submittingLabel ?? t('books.addBook.submitting', 'Listing…'))
          : (submitLabel ?? t('books.addBook.submit', 'List Book'))}
      </button>
    </form>
  );
}
