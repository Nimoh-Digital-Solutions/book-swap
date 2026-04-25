import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import { MapPin, MessageCircle } from 'lucide-react';

interface ChatHeaderProps {
  partnerName: string;
  partnerAvatar: string | null;
  isConnected: boolean;
  onSuggestMeetup: () => void;
  showMeetupButton?: boolean;
}

export function ChatHeader({
  partnerName,
  partnerAvatar,
  isConnected,
  onSuggestMeetup,
  showMeetupButton = true,
}: ChatHeaderProps): ReactElement {
  const { t } = useTranslation('messaging');

  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-[#28382D]">
      <div className="flex items-center gap-3">
        {/* Avatar */}
        {partnerAvatar ? (
          <img
            src={partnerAvatar}
            alt={partnerName}
            className="w-9 h-9 rounded-full object-cover"
          />
        ) : (
          <div className="w-9 h-9 rounded-full bg-[#28382D] flex items-center justify-center text-sm font-bold text-[#8C9C92]">
            {partnerName[0]?.toUpperCase()}
          </div>
        )}

        <div>
          <p className="text-sm font-medium text-white flex items-center gap-2">
            <MessageCircle className="w-3.5 h-3.5 text-[#8C9C92]" aria-hidden="true" />
            {partnerName}
          </p>
          <p className="text-[10px] flex items-center gap-1">
            <span
              className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-green-400' : 'bg-[#8C9C92]'}`}
              aria-hidden="true"
            />
            <span className={isConnected ? 'text-green-400' : 'text-[#8C9C92]'}>
              {isConnected ? t('chat.connected') : t('chat.connecting')}
            </span>
          </p>
        </div>
      </div>

      {/* Meetup suggestion button.
        *
        * RESP-024 (Sprint C): on `<sm` the partner name + status indicator
        * + this CTA easily exceeded 320 px and pushed the button off-screen.
        * Below `sm:` we collapse to icon-only (44×44 tap target) and keep
        * the accessible name via `aria-label`. At `sm:` the full text label
        * returns. */}
      {showMeetupButton && (
        <button
          type="button"
          onClick={onSuggestMeetup}
          aria-label={t('meetup.suggest')}
          className="inline-flex items-center justify-center min-w-[44px] min-h-[44px] gap-1.5 sm:px-3 sm:py-1.5 rounded-full bg-[#28382D] hover:bg-[#344a3a] text-sm text-[#8C9C92] hover:text-white transition-colors"
        >
          <MapPin className="w-3.5 h-3.5" aria-hidden="true" />
          <span className="hidden sm:inline">{t('meetup.suggest')}</span>
        </button>
      )}
    </div>
  );
}
