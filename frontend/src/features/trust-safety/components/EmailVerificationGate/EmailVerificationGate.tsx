import { type ReactElement, type ReactNode, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { CheckCircle, Mail, RefreshCw } from 'lucide-react';

import { useEmailVerificationGate } from '../../../auth/hooks/useEmailVerificationGate';
import { authService } from '../../../auth/services/auth.service';

type ResendState = 'idle' | 'sending' | 'sent' | 'error';

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
  const [resendState, setResendState] = useState<ResendState>('idle');

  const handleResend = useCallback(async () => {
    setResendState('sending');
    try {
      await authService.resendVerificationEmail();
      setResendState('sent');
    } catch {
      setResendState('error');
    }
  }, []);

  if (isVerified) return <>{children}</>;

  if (!showPrompt) return <>{children}</>;

  return (
    <div className="bg-[#1A251D] rounded-xl border border-[#28382D] p-6 text-center space-y-3">
      <Mail className="w-8 h-8 text-[#E4B643] mx-auto" aria-hidden="true" />
      <h3 className="text-lg font-bold text-white">{t('emailGate.title')}</h3>
      <p className="text-sm text-[#8C9C92]">
        {t('emailGate.message', { action })}
      </p>

      {resendState === 'sent' ? (
        <div className="inline-flex items-center gap-2 text-sm text-green-400" role="status">
          <CheckCircle className="w-4 h-4" aria-hidden="true" />
          {t('emailGate.resent')}
        </div>
      ) : (
        <button
          type="button"
          onClick={handleResend}
          disabled={resendState === 'sending'}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#28382D] text-[#E4B643] text-sm font-semibold hover:bg-[#354a3d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw
            className={`w-4 h-4 ${resendState === 'sending' ? 'animate-spin' : ''}`}
            aria-hidden="true"
          />
          {resendState === 'sending'
            ? t('emailGate.resending')
            : t('emailGate.resend')}
        </button>
      )}

      {resendState === 'error' && (
        <p className="text-sm text-red-400" role="alert">
          {t('emailGate.resendError')}
        </p>
      )}
    </div>
  );
}
