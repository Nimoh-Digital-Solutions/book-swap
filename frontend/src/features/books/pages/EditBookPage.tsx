import { type ReactElement, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';

import { useAppStore } from '@data/useAppStore';
import { useDocumentTitle } from '@hooks';
import { PATHS, routeMetadata } from '@routes/config/paths';
import { ArrowLeft, Loader2, Trash2 } from 'lucide-react';

import { BookForm } from '../components/BookForm/BookForm';
import { PhotoUploader } from '../components/PhotoUploader/PhotoUploader';
import { useBook } from '../hooks/useBook';
import { useDeleteBook } from '../hooks/useDeleteBook';
import { useDeleteBookPhoto } from '../hooks/useDeleteBookPhoto';
import { useUpdateBook } from '../hooks/useUpdateBook';
import { useUploadBookPhoto } from '../hooks/useUploadBookPhoto';
import type { CreateBookPayload } from '../types/book.types';

export function EditBookPage(): ReactElement {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const addNotification = useAppStore(s => s.addNotification);

  useDocumentTitle(routeMetadata[PATHS.EDIT_BOOK].title);

  const { data: book, isLoading, isError } = useBook(id!);
  const updateBook = useUpdateBook(id!);
  const deleteBook = useDeleteBook();
  const uploadPhoto = useUploadBookPhoto(id!);
  const deletePhoto = useDeleteBookPhoto(id!);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleSubmit = useCallback(
    (values: CreateBookPayload) => {
      updateBook.mutate(values, {
        onSuccess: () => {
          addNotification(t('books.editBook.success', 'Book updated successfully!'), { variant: 'success' });
          navigate(`/books/${id}`);
        },
        onError: () => {
          addNotification(t('books.editBook.error', 'Failed to update book. Please try again.'), { variant: 'error' });
        },
      });
    },
    [updateBook, addNotification, t, navigate, id],
  );

  const handleDelete = useCallback(() => {
    deleteBook.mutate(id!, {
      onSuccess: () => {
        addNotification(t('books.editBook.deleteSuccess', 'Book deleted.'), { variant: 'success' });
        navigate(PATHS.MY_SHELF);
      },
      onError: () => {
        addNotification(t('books.editBook.deleteError', 'Failed to delete book.'), { variant: 'error' });
      },
    });
  }, [deleteBook, id, addNotification, t, navigate]);

  const handlePhotoUpload = useCallback(
    (file: File) => {
      uploadPhoto.mutate(file, {
        onSuccess: () => addNotification(t('books.photo.uploadSuccess', 'Photo uploaded.'), { variant: 'success' }),
        onError: () => addNotification(t('books.photo.uploadError', 'Failed to upload photo.'), { variant: 'error' }),
      });
    },
    [uploadPhoto, addNotification, t],
  );

  const handlePhotoDelete = useCallback(
    (photoId: string) => {
      deletePhoto.mutate(photoId, {
        onSuccess: () => addNotification(t('books.photo.deleteSuccess', 'Photo removed.'), { variant: 'success' }),
        onError: () => addNotification(t('books.photo.deleteError', 'Failed to remove photo.'), { variant: 'error' }),
      });
    },
    [deletePhoto, addNotification, t],
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-pulse text-[#8C9C92]">{t('common.loading', 'Loading…')}</div>
      </div>
    );
  }

  if (isError || !book) {
    return (
      <div className="text-center py-16">
        <p className="text-red-400">{t('books.detail.notFound', 'Book not found.')}</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Back link */}
      <button
        type="button"
        onClick={() => navigate(`/books/${id}`)}
        className="inline-flex items-center gap-1 text-sm text-[#8C9C92] hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" aria-hidden="true" />
        {t('books.editBook.backToBook', 'Back to Book')}
      </button>

      <div className="space-y-8">
        {/* Book details form */}
        <div className="bg-[#1A251D] rounded-2xl border border-[#28382D] p-8">
          <h1 className="text-2xl font-bold text-white mb-6">
            {t('books.editBook.title', 'Edit Book')}
          </h1>
          <BookForm
            defaultValues={{
              isbn: book.isbn ?? '',
              title: book.title,
              author: book.author,
              description: book.description ?? '',
              condition: book.condition,
              language: book.language,
              genres: book.genres ?? [],
              notes: book.notes ?? '',
              cover_url: book.cover_url ?? '',
              page_count: book.page_count ?? null,
              publish_year: book.publish_year ?? null,
            }}
            onSubmit={handleSubmit}
            isSubmitting={updateBook.isPending}
            submitLabel={t('books.editBook.save', 'Save Changes')}
            submittingLabel={t('books.editBook.saving', 'Saving…')}
          />
        </div>

        {/* Photo management */}
        <div className="bg-[#1A251D] rounded-2xl border border-[#28382D] p-8">
          <h2 className="text-lg font-semibold text-white mb-4">
            {t('books.detail.photos', 'Photos')}
          </h2>
          <PhotoUploader
            photos={book.photos ?? []}
            onUpload={handlePhotoUpload}
            onDelete={handlePhotoDelete}
            isUploading={uploadPhoto.isPending}
          />
        </div>

        {/* Danger zone */}
        <div className="bg-[#1A251D] rounded-2xl border border-red-900/50 p-8">
          <h2 className="text-lg font-semibold text-red-400 mb-2">
            {t('books.editBook.deleteTitle', 'Delete Book')}
          </h2>
          <p className="text-[#8C9C92] text-sm mb-4">
            {t('books.editBook.deleteWarning', 'This will permanently remove this book from your shelf. This cannot be undone.')}
          </p>
          {!showDeleteConfirm ? (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="inline-flex items-center gap-2 px-4 py-2 border border-red-800 text-red-400 text-sm font-medium rounded-xl hover:bg-red-900/20 transition-colors"
            >
              <Trash2 className="w-4 h-4" aria-hidden="true" />
              {t('books.editBook.deleteConfirm', 'Delete Book')}
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleteBook.isPending}
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50"
              >
                {deleteBook.isPending && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
                {t('common.confirm', 'Confirm')}
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-[#8C9C92] text-sm font-medium hover:text-white transition-colors"
              >
                {t('common.cancel', 'Cancel')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
