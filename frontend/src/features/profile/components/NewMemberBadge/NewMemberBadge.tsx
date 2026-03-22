import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import { Sparkles } from 'lucide-react';

export function NewMemberBadge(): ReactElement {
  const { t } = useTranslation();

  return (
    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#E4B643]/10 border border-[#E4B643]/30 text-xs font-bold text-[#E4B643]">
      <Sparkles className="w-3 h-3" aria-hidden="true" />
      {t('profile.newMember', 'New Member')}
    </span>
  );
}
