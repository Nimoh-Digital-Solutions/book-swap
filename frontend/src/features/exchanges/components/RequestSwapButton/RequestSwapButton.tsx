import { type ReactElement, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { useAppStore } from '@data/useAppStore';
import { useMyShelf } from '@features/books/hooks/useMyShelf';
import { ArrowRightLeft } from 'lucide-react';

import { useCreateExchange } from '../../hooks/useExchangeMutations';

interface RequestSwapButtonProps {
  bookId: string;
  bookOwnerId: string;
  currentUserId: string | undefined;
}

export function RequestSwapButton({ bookId, bookOwnerId, currentUserId }: RequestSwapButtonProps): ReactElement | null {
  const { t } = useTranslation('exchanges');
  const navigate = useNavigate();
  const addNotification = useAppStore(s => s.addNotification);
  const createMutation = useCreateExchange();
  const { data: shelf } = useMyShelf();
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const [showPicker, setShowPicker] = useState(false);

  // Don't render on own books or when not authenticated
  if (!currentUserId || bookOwnerId === currentUserId) return null;

  const myBooks = shelf?.results?.filter(b => b.status === 'available') ?? [];

  const handleSendRequest = () => {
    if (!selectedBookId) return;
    createMutation.mutate(
      { requested_book_id: bookId, offered_book_id: selectedBookId },
      {
        onSuccess: (data) => {
          addNotification(t('request.sent', 'Request sent!'), { variant: 'success' });
          setShowPicker(false);
          void navigate(`/exchanges/${data.id}`);
        },
        onError: () => addNotification(t('error.create', 'Failed to send request.'), { variant: 'error' }),
      },
    );
  };

  if (!showPicker) {
    return (
      <button
        type="button"
        onClick={() => {
          if (myBooks.length === 0) {
            addNotification(t('request.noBooks', 'List a book first to start swapping!'), { variant: 'warning' });
            return;
          }
          setShowPicker(true);
        }}
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#E4B643] hover:bg-[#d9b93e] text-[#152018] font-bold text-sm rounded-full transition-colors"
      >
        <ArrowRightLeft className="w-4 h-4" aria-hidden="true" />
        {t('request.swap', 'Request Swap')}
      </button>
    );
  }

  return (
    <div className="bg-[#1A251D] rounded-xl border border-[#28382D] p-4 space-y-3">
      <p className="text-sm font-medium text-white">{t('request.selectBook', 'Select a book to offer')}</p>
      <div className="max-h-48 overflow-y-auto space-y-2">
        {myBooks.map(book => (
          <button
            key={book.id}
            type="button"
            onClick={() => setSelectedBookId(book.id)}
            className={`w-full flex items-center gap-3 p-2 rounded-lg text-left transition-colors ${
              selectedBookId === book.id
                ? 'bg-[#E4B643]/20 border border-[#E4B643]'
                : 'bg-[#152018] border border-transparent hover:border-[#28382D]'
            }`}
          >
            {book.primary_photo ? (
              <img src={book.primary_photo} alt="" className="w-8 h-10 rounded object-cover" />
            ) : (
              <div className="w-8 h-10 rounded bg-[#28382D]" />
            )}
            <div className="min-w-0">
              <p className="text-sm text-white truncate">{book.title}</p>
              <p className="text-xs text-[#8C9C92] truncate">{book.author}</p>
            </div>
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleSendRequest}
          disabled={!selectedBookId || createMutation.isPending}
          className="flex-1 px-4 py-2 bg-[#E4B643] hover:bg-[#d9b93e] text-[#152018] font-bold text-sm rounded-full transition-colors disabled:opacity-50"
        >
          {t('request.send', 'Send Request')}
        </button>
        <button
          type="button"
          onClick={() => { setShowPicker(false); setSelectedBookId(null); }}
          className="px-4 py-2 bg-[#28382D] hover:bg-[#344a3a] text-white text-sm rounded-full transition-colors"
        >
          {t('common.cancel', 'Cancel')}
        </button>
      </div>
    </div>
  );
}
