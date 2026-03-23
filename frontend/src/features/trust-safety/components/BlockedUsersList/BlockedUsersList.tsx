import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import { useBlocks } from '../../hooks/useBlocks';
import { UnblockButton } from '../UnblockButton/UnblockButton';

export function BlockedUsersList(): ReactElement {
  const { t } = useTranslation('trust-safety');
  const { data, isLoading } = useBlocks();

  if (isLoading) {
    return (
      <p className="text-sm text-[#8C9C92]">{t('blockedUsers.loading')}</p>
    );
  }

  const results = data && 'results' in data ? data.results : [];

  if (results.length === 0) {
    return (
      <p className="text-sm text-[#8C9C92]">{t('blockedUsers.empty')}</p>
    );
  }

  return (
    <div className="space-y-3">
      {results.map((block) => (
        <div
          key={block.id}
          className="flex items-center justify-between bg-[#152018] rounded-xl border border-[#28382D] p-4"
        >
          <div className="flex items-center gap-3">
            {block.blocked_user.avatar ? (
              <img
                src={block.blocked_user.avatar}
                alt={block.blocked_user.username}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-[#1A251D] border border-[#28382D] flex items-center justify-center text-sm font-bold text-[#E4B643]">
                {block.blocked_user.first_name.charAt(0) || block.blocked_user.username.charAt(0)}
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-white">
                {block.blocked_user.first_name || block.blocked_user.username}
              </p>
              <p className="text-xs text-[#5A6A60]">@{block.blocked_user.username}</p>
            </div>
          </div>
          <UnblockButton userId={block.blocked_user.id} />
        </div>
      ))}
    </div>
  );
}
