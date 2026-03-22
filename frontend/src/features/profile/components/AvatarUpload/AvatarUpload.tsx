import { type ChangeEvent, type ReactElement, useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Camera, X } from 'lucide-react';

const ACCEPTED_TYPES = ['image/jpeg', 'image/png'];
const MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB
const OUTPUT_SIZE = 200;

export interface AvatarUploadProps {
  currentAvatar?: string | null;
  displayName: string;
  onFile: (file: File | null) => void;
  error?: string;
}

function resizeImage(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      const canvas = document.createElement('canvas');
      canvas.width = OUTPUT_SIZE;
      canvas.height = OUTPUT_SIZE;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas not supported'));
        return;
      }

      // Square crop: take the smallest dimension centred
      const size = Math.min(img.width, img.height);
      const sx = (img.width - size) / 2;
      const sy = (img.height - size) / 2;

      ctx.drawImage(img, sx, sy, size, size, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);

      canvas.toBlob(
        blob => {
          if (!blob) {
            reject(new Error('Failed to create blob'));
            return;
          }
          resolve(new File([blob], file.name, { type: file.type }));
        },
        file.type,
        0.9,
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}

export function AvatarUpload({
  currentAvatar,
  displayName,
  onFile,
  error,
}: AvatarUploadProps): ReactElement {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleChange = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Validate type
      if (!ACCEPTED_TYPES.includes(file.type)) {
        setLocalError(t('profile.edit.avatarTypeError', 'Only JPEG and PNG images are allowed.'));
        onFile(null);
        return;
      }

      // Validate size
      if (file.size > MAX_SIZE_BYTES) {
        setLocalError(t('profile.edit.avatarSizeError', 'Image must be smaller than 2 MB.'));
        onFile(null);
        return;
      }

      setLocalError(null);

      try {
        const resized = await resizeImage(file);
        const url = URL.createObjectURL(resized);
        setPreview(url);
        onFile(resized);
      } catch {
        setLocalError(t('profile.edit.avatarProcessError', 'Failed to process image.'));
        onFile(null);
      }
    },
    [onFile, t],
  );

  const handleRemove = useCallback(() => {
    setPreview(null);
    setLocalError(null);
    onFile(null);
    if (inputRef.current) inputRef.current.value = '';
  }, [onFile]);

  const displayError = localError ?? error;
  const avatarSrc = preview ?? currentAvatar;

  return (
    <div>
      <label className="block text-sm font-medium text-[#8C9C92] mb-2">
        {t('profile.edit.avatarLabel', 'Profile Photo')}
      </label>
      <div className="flex items-center gap-4">
        {/* Avatar preview */}
        <div className="relative flex-shrink-0">
          {avatarSrc ? (
            <img
              src={avatarSrc}
              alt={displayName}
              className="w-20 h-20 rounded-2xl object-cover border-2 border-[#28382D]"
            />
          ) : (
            <div className="w-20 h-20 rounded-2xl bg-[#152018] border border-[#28382D] flex items-center justify-center text-2xl font-bold text-[#E4B643]">
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
          {avatarSrc && (
            <button
              type="button"
              onClick={handleRemove}
              className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
              aria-label={t('profile.edit.removeAvatar', 'Remove photo')}
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Upload trigger */}
        <div>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="inline-flex items-center gap-2 px-4 py-2 border border-[#28382D] rounded-xl text-sm font-medium text-[#8C9C92] hover:border-[#E4B643] hover:text-white transition-colors"
          >
            <Camera className="w-4 h-4" aria-hidden="true" />
            {t('profile.edit.uploadPhoto', 'Upload Photo')}
          </button>
          <p className="mt-1 text-xs text-[#5A6A60]">
            {t('profile.edit.avatarHint', 'JPEG or PNG, max 2 MB. Auto-cropped to square.')}
          </p>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png"
          onChange={handleChange}
          className="hidden"
          aria-label={t('profile.edit.avatarLabel', 'Profile Photo')}
        />
      </div>
      {displayError && (
        <p className="mt-1 text-sm text-red-400" role="alert">{displayError}</p>
      )}
    </div>
  );
}
