import type { ReactElement } from 'react';
import type { FieldValues, Resolver } from 'react-hook-form';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { Loader2, Plus } from 'lucide-react';
import { z } from 'zod';

import { wishlistItemSchema } from '../../schemas/book.schemas';
import type { CreateWishlistPayload } from '../../types/book.types';

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

interface WishlistFormProps {
  onSubmit: (values: CreateWishlistPayload) => void;
  isSubmitting?: boolean;
}

type FormValues = z.infer<typeof wishlistItemSchema>;

export function WishlistForm({ onSubmit, isSubmitting }: WishlistFormProps): ReactElement {
  const { t } = useTranslation();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: makeZodResolver(wishlistItemSchema) as Resolver<FormValues>,
    mode: 'onTouched',
    defaultValues: { isbn: '', title: '', author: '', genre: '', cover_url: '' },
  });

  const inputBase =
    'block w-full px-3 py-2.5 border border-[#28382D] rounded-xl text-base sm:text-sm bg-[#152018] text-white placeholder-[#5A6A60] transition-colors focus:ring-[#E4B643] focus:border-[#E4B643]';

  const handleFormSubmit = (values: FormValues) => {
    onSubmit(values as CreateWishlistPayload);
    reset();
  };

  return (
    <form
      className="bg-[#1A251D] rounded-2xl border border-[#28382D] p-6 space-y-4"
      onSubmit={handleSubmit(handleFormSubmit)}
      noValidate
    >
      <h3 className="text-white font-semibold text-sm">
        {t('books.wishlist.addItem', 'Add to Wishlist')}
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="wl-title" className="block text-xs font-medium text-[#8C9C92] mb-1">
            {t('books.wishlist.titleLabel', 'Title')}
          </label>
          <input id="wl-title" type="text" className={inputBase} {...register('title')} />
        </div>
        <div>
          <label htmlFor="wl-author" className="block text-xs font-medium text-[#8C9C92] mb-1">
            {t('books.wishlist.authorLabel', 'Author')}
          </label>
          <input id="wl-author" type="text" className={inputBase} {...register('author')} />
        </div>
        <div>
          <label htmlFor="wl-isbn" className="block text-xs font-medium text-[#8C9C92] mb-1">
            {t('books.wishlist.isbnLabel', 'ISBN')}
          </label>
          <input id="wl-isbn" type="text" className={inputBase} {...register('isbn')} />
        </div>
        <div>
          <label htmlFor="wl-genre" className="block text-xs font-medium text-[#8C9C92] mb-1">
            {t('books.wishlist.genreLabel', 'Genre')}
          </label>
          <input id="wl-genre" type="text" className={inputBase} {...register('genre')} />
        </div>
      </div>

      {errors.title && (
        <p className="text-sm text-red-400" role="alert">
          {t('books.wishlist.atLeastOne', 'Fill in at least one of ISBN, title, or genre.')}
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex items-center gap-2 px-4 py-2 bg-[#E4B643] hover:bg-[#d9b93e] text-[#152018] font-bold text-sm rounded-xl transition-colors disabled:opacity-50"
      >
        {isSubmitting ? (
          <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
        ) : (
          <Plus className="w-4 h-4" aria-hidden="true" />
        )}
        {t('books.wishlist.addItem', 'Add to Wishlist')}
      </button>
    </form>
  );
}
