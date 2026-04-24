import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { LocaleLink } from '@components/common/LocaleLink/LocaleLink';
import type { BrowseBook } from '@features/discovery/types/discovery.types';
import { InfoWindow, Marker } from '@vis.gl/react-google-maps';
import { ArrowLeft, BookOpen, MapPin, X } from 'lucide-react';

export interface BookMarkerProps {
  locationKey: string;
  books: BrowseBook[];
  position: google.maps.LatLngLiteral;
  isSelected: boolean;
  onSelect: (key: string | null) => void;
  selectedBookId?: string | null;
}

export function BookMarker({
  locationKey,
  books,
  position,
  isSelected,
  onSelect,
  selectedBookId,
}: BookMarkerProps) {
  const { t } = useTranslation();

  const orderedBooks = useMemo(() => {
    if (!selectedBookId) return books;
    const idx = books.findIndex((b) => b.id === selectedBookId);
    if (idx <= 0) return books;
    return [books[idx]!, ...books.slice(0, idx), ...books.slice(idx + 1)];
  }, [books, selectedBookId]);

  const handleClick = useCallback(() => {
    onSelect(isSelected ? null : locationKey);
  }, [isSelected, locationKey, onSelect]);

  return (
    <>
      <Marker position={position} onClick={handleClick} />

      {isSelected && (
        <InfoWindow
          position={position}
          onClose={() => onSelect(null)}
          maxWidth={340}
          headerDisabled
        >
          <div
            style={{
              padding: 0,
              overflow: 'hidden',
              minWidth: 280,
              maxWidth: 320,
              fontFamily: 'system-ui, -apple-system, sans-serif',
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: '12px 16px 10px',
                borderBottom: '1px solid #28382D',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 6,
                    background: 'rgba(228,182,67,0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <MapPin style={{ width: 13, height: 13, color: '#E4B643' }} />
                </div>
                <span
                  style={{
                    color: '#fff',
                    fontSize: 13,
                    fontWeight: 700,
                    letterSpacing: '-0.01em',
                  }}
                >
                  {books.length === 1
                    ? t('map.popup.oneBook', '1 book here')
                    : t('map.popup.nBooks', '{{count}} books here', {
                        count: books.length,
                      })}
                </span>
              </div>
              <button
                type="button"
                onClick={() => onSelect(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 4,
                  lineHeight: 0,
                  borderRadius: 6,
                  color: '#5A6A60',
                }}
                aria-label={t('map.popup.close', 'Close')}
              >
                <X style={{ width: 14, height: 14 }} />
              </button>
            </div>

            {/* Book list */}
            <div style={{ maxHeight: 300, overflowY: 'auto' }}>
              {orderedBooks.slice(0, 5).map((book, i) => (
                <LocaleLink
                  key={book.id}
                  to={`/books/${book.id}`}
                  style={{
                    display: 'flex',
                    gap: 12,
                    padding: '12px 16px',
                    textDecoration: 'none',
                    borderTop: i > 0 ? '1px solid rgba(40,56,45,0.6)' : 'none',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background =
                      'rgba(26,37,29,0.8)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background =
                      'transparent';
                  }}
                >
                  <div
                    style={{
                      width: 44,
                      height: 58,
                      flexShrink: 0,
                      borderRadius: 6,
                      overflow: 'hidden',
                      border: '1px solid #28382D',
                      background: '#1A251D',
                    }}
                  >
                    {(book.primary_photo ?? book.cover_url) ? (
                      <img
                        src={book.primary_photo ?? book.cover_url}
                        alt=""
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '100%',
                          height: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#5A6A60',
                        }}
                      >
                        <BookOpen style={{ width: 16, height: 16 }} />
                      </div>
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 13,
                        fontWeight: 600,
                        color: '#fff',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        lineHeight: '1.3',
                      }}
                    >
                      {book.title}
                    </p>
                    <p
                      style={{
                        margin: '2px 0 0',
                        fontSize: 11,
                        color: '#8C9C92',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {book.author}
                    </p>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        marginTop: 4,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 500,
                          color: '#152018',
                          background: 'rgba(228,182,67,0.2)',
                          border: '1px solid rgba(228,182,67,0.3)',
                          padding: '1px 6px',
                          borderRadius: 99,
                          textTransform: 'capitalize',
                        }}
                      >
                        {book.condition.replace('_', ' ')}
                      </span>
                      {book.distance != null && (
                        <span
                          style={{
                            fontSize: 10,
                            color: '#E4B643',
                            fontWeight: 500,
                          }}
                        >
                          {book.distance < 1 ? '< 1 km' : `${book.distance} km`}
                        </span>
                      )}
                    </div>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      color: '#5A6A60',
                      flexShrink: 0,
                    }}
                  >
                    <ArrowLeft
                      style={{
                        width: 14,
                        height: 14,
                        transform: 'rotate(180deg)',
                      }}
                    />
                  </div>
                </LocaleLink>
              ))}
            </div>

            {/* Footer for overflow */}
            {books.length > 5 && (
              <div
                style={{
                  padding: '8px 16px 10px',
                  borderTop: '1px solid #28382D',
                  textAlign: 'center',
                }}
              >
                <span style={{ fontSize: 11, color: '#5A6A60' }}>
                  +{books.length - 5}{' '}
                  {t('map.popup.moreBooks', 'more books at this location')}
                </span>
              </div>
            )}
          </div>
        </InfoWindow>
      )}
    </>
  );
}
