import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

interface TypingIndicatorProps {
  username: string;
}

export function TypingIndicator({ username }: TypingIndicatorProps): ReactElement {
  const { t } = useTranslation('messaging');

  return (
    <div className="flex items-center gap-2 px-4 py-1.5 text-xs text-[#8C9C92]">
      <span>{t('chat.typing', { name: username })}</span>
      <span className="flex gap-0.5" aria-hidden="true">
        <span className="w-1 h-1 bg-[#8C9C92] rounded-full animate-bounce [animation-delay:0ms]" />
        <span className="w-1 h-1 bg-[#8C9C92] rounded-full animate-bounce [animation-delay:150ms]" />
        <span className="w-1 h-1 bg-[#8C9C92] rounded-full animate-bounce [animation-delay:300ms]" />
      </span>
    </div>
  );
}
