import { type ReactElement, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { SEOHead } from '@components';
import { useAppStore } from '@data/useAppStore';
import { useLocaleNavigate } from '@hooks/useLocaleNavigate';
import { PATHS, routeMetadata } from '@routes/config/paths';
import { ArrowLeft, Camera, Loader2, Search } from 'lucide-react';

import { BarcodeScanner } from '../components/BarcodeScanner/BarcodeScanner';
import { BookForm } from '../components/BookForm/BookForm';
import { useCreateBook } from '../hooks/useCreateBook';
import { useExternalBookSearch } from '../hooks/useExternalBookSearch';
import { useISBNLookup } from '../hooks/useISBNLookup';
import type { BookMetadata, CreateBookPayload } from '../types/book.types';

export function AddBookPage(): ReactElement {
  const { t } = useTranslation();
  const navigate = useLocaleNavigate();
  const addNotification = useAppStore(s => s.addNotification);
  const createBook = useCreateBook();

  // ISBN lookup state
  const [isbnInput, setIsbnInput] = useState('');
  const [lookupEnabled, setLookupEnabled] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const { data: isbnData, isLoading: isbnLoading, isError: isbnError } = useISBNLookup(
    isbnInput,
    lookupEnabled,
  );

  // Title search state
  const [titleQuery, setTitleQuery] = useState('');
  const [titleSearchEnabled, setTitleSearchEnabled] = useState(false);
  const { data: titleResults, isLoading: titleSearching } = useExternalBookSearch(
    titleQuery,
    titleSearchEnabled,
  );

  // Pre-fill from ISBN lookup
  const [prefilled, setPrefilled] = useState<Partial<CreateBookPayload> | undefined>(undefined);

  const handleLookup = () => {
    if (isbnInput.length >= 10) {
      setLookupEnabled(true);
    }
  };

  const handleScanResult = (isbn: string) => {
    setIsbnInput(isbn);
    setLookupEnabled(true);
    setScannerOpen(false);
  };

  // When ISBN data arrives, pre-fill the form
  if (isbnData && lookupEnabled) {
    const pf: Partial<CreateBookPayload> = {
      isbn: isbnInput,
      title: isbnData.title,
      author: isbnData.author ?? '',
      cover_url: isbnData.cover_url ?? '',
      publish_year: isbnData.publish_year ?? null,
      page_count: isbnData.page_count ?? null,
    };
    setPrefilled(pf);
    setLookupEnabled(false);
  }

  const handleSelectTitleResult = (result: BookMetadata) => {
    setPrefilled({
      isbn: result.isbn,
      title: result.title,
      author: result.author ?? '',
      cover_url: result.cover_url ?? '',
      publish_year: result.publish_year ?? null,
      page_count: result.page_count ?? null,
    });
    setTitleSearchEnabled(false);
    setTitleQuery('');
  };

  const handleSubmit = useCallback(
    (values: CreateBookPayload) => {
      createBook.mutate(values, {
        onSuccess: () => {
          addNotification(t('books.addBook.success', 'Book listed successfully!'), { variant: 'success' });
          void navigate(PATHS.MY_SHELF);
        },
        onError: () => {
          addNotification(t('books.addBook.error', 'Failed to list book. Please try again.'), { variant: 'error' });
        },
      });
    },
    [createBook, addNotification, t, navigate],
  );

  const inputBase =
    'block w-full px-3 py-3 border border-[#28382D] rounded-xl text-base sm:text-sm bg-[#152018] text-white placeholder-[#5A6A60] transition-colors focus:ring-[#E4B643] focus:border-[#E4B643]';

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <SEOHead
        title={routeMetadata[PATHS.ADD_BOOK].title}
        description={routeMetadata[PATHS.ADD_BOOK].description}
        path={PATHS.ADD_BOOK}
        noIndex
      />
      {/* Barcode scanner modal */}
      {scannerOpen && (
        <BarcodeScanner
          onScan={handleScanResult}
          onClose={() => setScannerOpen(false)}
        />
      )}

      {/* Back link */}
      <button
        type="button"
        onClick={() => navigate(PATHS.MY_SHELF)}
        className="inline-flex items-center gap-1 text-sm text-[#8C9C92] hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" aria-hidden="true" />
        {t('books.addBook.backToShelf', 'Back to My Shelf')}
      </button>

      <div className="bg-[#1A251D] rounded-2xl border border-[#28382D] p-8 space-y-8">
        <h1 className="text-2xl font-bold text-white">
          {t('books.addBook.title', 'Add Book')}
        </h1>

        {/* ISBN Lookup */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-3">
            {t('books.addBook.isbnStep', 'Find Your Book')}
          </h2>
          <div className="flex gap-3">
            <input
              type="text"
              value={isbnInput}
              onChange={e => {
                setIsbnInput(e.target.value);
                setLookupEnabled(false);
              }}
              placeholder={t('books.addBook.isbnPlaceholder', 'Enter ISBN to auto-fill details…')}
              className={inputBase}
              aria-label={t('books.addBook.isbnLabel', 'ISBN')}
            />
            <button
              type="button"
              onClick={() => setScannerOpen(true)}
              aria-label={t('books.addBook.scanBarcode', 'Scan barcode with camera')}
              // RESP-026 (Sprint C): icon-only button bumped to 44×44 min
              // tap target so it clears WCAG 2.5.5 alongside the ISBN
              // input.
              className="inline-flex items-center justify-center min-w-[44px] min-h-[44px] gap-2 px-3 bg-[#28382D] hover:bg-[#354A3A] text-[#E4B643] text-sm font-medium rounded-xl transition-colors whitespace-nowrap"
            >
              <Camera className="w-4 h-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={handleLookup}
              disabled={isbnInput.length < 10 || isbnLoading}
              className="flex items-center gap-2 px-4 py-3 bg-[#28382D] hover:bg-[#354A3A] text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50 whitespace-nowrap"
            >
              {isbnLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              ) : (
                <Search className="w-4 h-4" aria-hidden="true" />
              )}
              {t('books.addBook.isbnLookup', 'Look Up')}
            </button>
          </div>
          {isbnError && (
            <p className="mt-2 text-sm text-amber-400">
              {t('books.addBook.isbnNotFound', 'Book not found. Fill in the details manually.')}
            </p>
          )}
          {prefilled && (
            <p className="mt-2 text-sm text-green-400">
              {t('books.addBook.isbnFound', 'Book found! Details have been auto-filled.')}
            </p>
          )}
        </div>

        {/* Title search */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-3">
            {t('books.addBook.titleSearchStep', 'Or Search by Title')}
          </h2>
          <div className="flex gap-3">
            <input
              type="text"
              value={titleQuery}
              onChange={e => {
                setTitleQuery(e.target.value);
                setTitleSearchEnabled(false);
              }}
              placeholder={t('books.addBook.titleSearchPlaceholder', 'Search by title or author…')}
              className={inputBase}
              aria-label={t('books.addBook.titleSearchLabel', 'Title or author')}
            />
            <button
              type="button"
              onClick={() => setTitleSearchEnabled(true)}
              disabled={titleQuery.trim().length < 2 || titleSearching}
              className="flex items-center gap-2 px-4 py-3 bg-[#28382D] hover:bg-[#354A3A] text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50 whitespace-nowrap"
            >
              {titleSearching ? (
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              ) : (
                <Search className="w-4 h-4" aria-hidden="true" />
              )}
              {t('books.addBook.titleSearch', 'Search')}
            </button>
          </div>
          {titleResults && titleResults.length > 0 && (
            <ul className="mt-3 space-y-2 max-h-60 overflow-y-auto">
              {titleResults.map((r, i) => (
                <li key={r.isbn || i}>
                  <button
                    type="button"
                    onClick={() => handleSelectTitleResult(r)}
                    className="w-full flex items-center gap-3 p-3 bg-[#152018] border border-[#28382D] rounded-xl hover:border-[#E4B643]/50 transition-colors text-left"
                  >
                    {r.cover_url ? (
                      <img src={r.cover_url} alt="" className="w-10 h-14 rounded object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-10 h-14 rounded bg-[#28382D] flex-shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white truncate">{r.title}</p>
                      <p className="text-xs text-[#8C9C92] truncate">{r.author}</p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {titleResults && titleResults.length === 0 && titleSearchEnabled && (
            <p className="mt-2 text-sm text-amber-400">
              {t('books.addBook.titleNotFound', 'No results found. Try a different search or fill in details manually.')}
            </p>
          )}
        </div>

        <hr className="border-[#28382D]" />

        {/* Book form */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">
            {t('books.addBook.detailsStep', 'Book Details')}
          </h2>
          <BookForm
            key={prefilled ? JSON.stringify(prefilled) : 'empty'}
            defaultValues={prefilled ?? {}}
            onSubmit={handleSubmit}
            isSubmitting={createBook.isPending}
          />
        </div>
      </div>
    </div>
  );
}
