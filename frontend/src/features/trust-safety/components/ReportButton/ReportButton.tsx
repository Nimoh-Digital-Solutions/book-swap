import { useState, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import { Flag } from 'lucide-react';

import { ReportDialog } from '../ReportDialog/ReportDialog';

interface ReportButtonProps {
  reportedUserId: string;
  reportedBookId?: string;
  reportedExchangeId?: string;
}

export function ReportButton({
  reportedUserId,
  reportedBookId,
  reportedExchangeId,
}: ReportButtonProps): ReactElement {
  const { t } = useTranslation('trust-safety');
  const [showDialog, setShowDialog] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setShowDialog(true)}
        className="inline-flex items-center gap-1.5 text-sm text-[#8C9C92] hover:text-[#E4B643] transition-colors"
      >
        <Flag className="w-4 h-4" aria-hidden="true" />
        {t('report.button')}
      </button>

      {showDialog && (
        <ReportDialog
          reportedUserId={reportedUserId}
          reportedBookId={reportedBookId}
          reportedExchangeId={reportedExchangeId}
          onClose={() => setShowDialog(false)}
        />
      )}
    </>
  );
}
