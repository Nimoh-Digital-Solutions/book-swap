import { type ChangeEvent, type ReactElement, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { useAppStore } from '@data/useAppStore';
import { Camera, Trash2, X } from 'lucide-react';

import type { BookPhoto } from '../../types/book.types';

const MAX_PHOTOS = 5;
const MAX_SIZE_BYTES = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png'];

interface PhotoUploaderProps {
  photos: BookPhoto[];
  onUpload: (file: File) => void;
  onDelete: (photoId: string) => void;
  isUploading?: boolean;
}

export function PhotoUploader({ photos, onUpload, onDelete, isUploading }: PhotoUploaderProps): ReactElement {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const addNotification = useAppStore(s => s.addNotification);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input so the same file can be selected again
    e.target.value = '';

    if (!ACCEPTED_TYPES.includes(file.type)) {
      addNotification(t('books.photo.typeError', 'Only JPEG and PNG images are allowed.'), { variant: 'error' });
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      addNotification(t('books.photo.sizeError', 'Image must be smaller than 5 MB.'), { variant: 'error' });
      return;
    }
    if (photos.length >= MAX_PHOTOS) {
      addNotification(t('books.photo.maxReached', 'Maximum 5 photos reached.'), { variant: 'error' });
      return;
    }

    onUpload(file);
  };

  return (
    <div>
      <p className="text-sm text-[#8C9C92] mb-3">
        {t('books.addBook.photosHint', 'Add up to 5 photos of your book. First photo is the cover.')}
      </p>

      <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
        {photos.map((photo, idx) => (
          <div key={photo.id} className="relative aspect-square rounded-xl overflow-hidden border border-[#28382D] group">
            <img
              src={photo.image}
              alt={`Photo ${idx + 1}`}
              className="w-full h-full object-cover"
            />
            {idx === 0 && (
              <span className="absolute top-1 left-1 bg-[#E4B643] text-[#152018] text-[10px] font-bold px-1.5 py-0.5 rounded">
                Cover
              </span>
            )}
            <button
              type="button"
              onClick={() => onDelete(photo.id)}
              className="absolute top-1 right-1 bg-red-600/80 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label={`Remove photo ${idx + 1}`}
            >
              <X className="w-3 h-3" aria-hidden="true" />
            </button>
          </div>
        ))}

        {photos.length < MAX_PHOTOS && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={isUploading}
            className="aspect-square rounded-xl border-2 border-dashed border-[#28382D] hover:border-[#E4B643] flex flex-col items-center justify-center gap-1 text-[#5A6A60] hover:text-[#E4B643] transition-colors disabled:opacity-50"
          >
            <Camera className="w-5 h-5" aria-hidden="true" />
            <span className="text-xs">{t('books.addBook.addPhoto', 'Add Photo')}</span>
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png"
        className="hidden"
        onChange={handleChange}
        aria-label={t('books.addBook.addPhoto', 'Add Photo')}
      />
    </div>
  );
}
