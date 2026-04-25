import type { ChangeEvent, FormEvent, KeyboardEvent, ReactElement } from 'react';
import { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ImagePlus, Send, X } from 'lucide-react';

const MAX_CHARS = 1000;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png']);

interface MessageInputProps {
  onSend: (content: string, image?: File) => void;
  onTyping: () => void;
  disabled?: boolean;
}

export function MessageInput({ onSend, onTyping, disabled = false }: MessageInputProps): ReactElement {
  const { t } = useTranslation('messaging');
  const [content, setContent] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const canSend = (content.trim().length > 0 || image !== null) && !disabled;

  const handleTextChange = useCallback(
    (e: ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value;
      if (value.length <= MAX_CHARS) {
        setContent(value);
        onTyping();
      }
    },
    [onTyping],
  );

  const handleImageSelect = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ALLOWED_TYPES.has(file.type) || file.size > MAX_IMAGE_SIZE) return;

    setImage(file);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }, []);

  const clearImage = useCallback(() => {
    setImage(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  const handleSubmit = useCallback(
    (e?: FormEvent) => {
      e?.preventDefault();
      if (!canSend) return;

      onSend(content.trim(), image ?? undefined);
      setContent('');
      clearImage();

      // Re-focus textarea
      textareaRef.current?.focus();
    },
    [canSend, content, image, onSend, clearImage],
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit],
  );

  return (
    <form onSubmit={handleSubmit} className="border-t border-[#28382D] p-3">
      {/* Image preview */}
      {imagePreview && (
        <div className="flex items-center gap-2 mb-2">
          <img src={imagePreview} alt="" className="w-16 h-16 rounded-lg object-cover" />
          <button
            type="button"
            onClick={clearImage}
            className="inline-flex items-center justify-center min-w-[44px] min-h-[44px] p-1 rounded-full hover:bg-[#28382D] text-[#8C9C92] transition-colors"
            aria-label={t('chat.removeImage')}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="flex items-end gap-2">
        {/* Image upload */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          className="inline-flex items-center justify-center min-w-[44px] min-h-[44px] flex-shrink-0 p-2 rounded-full hover:bg-[#28382D] text-[#8C9C92] transition-colors disabled:opacity-50"
          aria-label={t('chat.attachImage')}
        >
          <ImagePlus className="w-5 h-5" />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png"
          onChange={handleImageSelect}
          className="hidden"
          aria-hidden="true"
        />

        {/* Textarea */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            placeholder={t('chat.sendPlaceholder')}
            disabled={disabled}
            rows={1}
            className="w-full resize-none rounded-xl bg-[#28382D] text-white text-base sm:text-sm px-4 py-2.5 pr-16 placeholder:text-[#8C9C92] focus:outline-none focus:ring-1 focus:ring-[#E4B643] disabled:opacity-50 max-h-[100px] overflow-y-auto"
          />
          <span className="absolute right-3 bottom-2 text-[10px] text-[#8C9C92]">
            {t('chat.charsRemaining', { count: content.length })}
          </span>
        </div>

        {/* Send */}
        <button
          type="submit"
          disabled={!canSend}
          className="inline-flex items-center justify-center min-w-[44px] min-h-[44px] flex-shrink-0 p-3 rounded-full bg-[#E4B643] text-[#152018] transition-colors hover:bg-[#d9b93e] disabled:opacity-50 disabled:hover:bg-[#E4B643]"
          aria-label={t('chat.send')}
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </form>
  );
}
