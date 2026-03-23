import type { ReactElement, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { Mail } from 'lucide-react';

import { useEmailVerificationGate } from '../../../auth/hooks/useEmailVerificationGate';

interface EmailVerificationGateProps {
  /** Description of the gated action, e.g. "list books" */
  action: string;
  children: ReactNode;
}

export function EmailVerificationGate({
  action,
  children,
}: EmailVerificationGateProps): ReactElement {
  const { t } = useTranslation('trust-safety');
  const { isVerified, showPrompt } = useEmailVerificationGate();

  if (isVerified) return <>{children}</>;

  if (!showPrompt) return <>{children}</>;

  return (
    <div className="bg-[#1A251D] rounded-xl border border-[#28382D] p-6 text-center space-y-3">
      <Mail className="w-8 h-8 text-[#E4B643] mx-auto" aria-hidden="true" />
      <h3 className="text-lg font-bold text-white">{t('emailGate.title')}</h3>
      <p className="text-sm text-[#8C9C92]">
        {t('emailGate.message', { action })}
      </p>
    </div>
  );
}
