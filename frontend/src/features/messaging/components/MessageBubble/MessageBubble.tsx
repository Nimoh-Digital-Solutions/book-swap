import type { ReactElement } from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Check, CheckCheck } from 'lucide-react';

import type { ChatMessage } from '../../types/messaging.types';

interface MessageBubbleProps {
  message: ChatMessage;
  isOwn: boolean;
}

function formatTime(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function MessageBubble({ message, isOwn }: MessageBubbleProps): ReactElement {
  const { t } = useTranslation('messaging');
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-2`}>
      {/* Avatar for partner messages */}
      {!isOwn && (
        <div className="flex-shrink-0 mr-2">
          {message.sender.avatar ? (
            <img
              src={message.sender.avatar}
              alt={message.sender.username}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-[#28382D] flex items-center justify-center text-xs font-bold text-[#8C9C92]">
              {message.sender.username[0]?.toUpperCase()}
            </div>
          )}
        </div>
      )}

      <div className={`max-w-[85%] sm:max-w-[75%] ${isOwn ? 'order-1' : ''}`}>
        <div
          className={`rounded-2xl px-4 py-2.5 ${
            isOwn
              ? 'bg-[#E4B643] text-[#152018] rounded-br-md'
              : 'bg-[#28382D] text-white rounded-bl-md'
          }`}
        >
          {/* Image */}
          {message.image && (
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              className="block mb-1"
              aria-label={t('chat.expand')}
            >
              <img
                src={message.image}
                alt={t('chat.imageAlt', { name: message.sender.username })}
                className={`rounded-lg object-cover ${
                  expanded ? 'max-w-full' : 'max-w-[200px] max-h-[150px]'
                }`}
              />
            </button>
          )}

          {/* Text content */}
          {message.content && (
            <p className="text-sm whitespace-pre-wrap break-anywhere">{message.content}</p>
          )}
        </div>

        {/* Timestamp + read receipt */}
        <div className={`flex items-center gap-1 mt-0.5 ${isOwn ? 'justify-end' : 'justify-start'}`}>
          <span className="text-[10px] text-[#8C9C92]">{formatTime(message.created_at)}</span>
          {isOwn && (
            message.read_at ? (
              <CheckCheck className="w-3 h-3 text-[#E4B643]" aria-label={t('chat.readReceipt')} />
            ) : (
              <Check className="w-3 h-3 text-[#8C9C92]" aria-label={t('chat.sent')} />
            )
          )}
        </div>
      </div>
    </div>
  );
}
