import { type ReactElement,useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useAppStore } from '@data/useAppStore';

import { useReportUser } from '../../hooks/useReportUser';
import type { ReportCategory } from '../../types/trustSafety.types';

const CATEGORIES: ReportCategory[] = [
  'inappropriate',
  'fake_listing',
  'no_show',
  'misrepresented',
  'harassment',
  'spam',
  'other',
];

interface ReportDialogProps {
  reportedUserId: string;
  reportedBookId?: string | undefined;
  reportedExchangeId?: string | undefined;
  onClose: () => void;
}

export function ReportDialog({
  reportedUserId,
  reportedBookId,
  reportedExchangeId,
  onClose,
}: ReportDialogProps): ReactElement {
  const { t } = useTranslation('trust-safety');
  const addNotification = useAppStore((s) => s.addNotification);
  const reportMutation = useReportUser();

  const [category, setCategory] = useState<ReportCategory>('spam');
  const [description, setDescription] = useState('');

  const handleSubmit = useCallback(() => {
    if (category === 'other' && !description.trim()) return;

    reportMutation.mutate(
      {
        reported_user_id: reportedUserId,
        reported_book_id: reportedBookId,
        reported_exchange_id: reportedExchangeId,
        category,
        description: description.trim() || undefined,
      },
      {
        onSuccess: () => {
          addNotification(t('report.success'), { variant: 'success' });
          onClose();
        },
        onError: () => {
          addNotification(t('report.error'), { variant: 'error' });
        },
      },
    );
  }, [
    category,
    description,
    reportedUserId,
    reportedBookId,
    reportedExchangeId,
    reportMutation,
    addNotification,
    t,
    onClose,
  ]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      role="dialog"
      aria-modal="true"
      aria-label={t('report.title')}
    >
      <div className="bg-[#1A251D] rounded-2xl border border-[#28382D] p-6 max-w-md mx-4 w-full space-y-4">
        <h2 className="text-lg font-bold text-white">{t('report.title')}</h2>

        {/* Category Select */}
        <div>
          <label
            htmlFor="report-category"
            className="block text-sm font-medium text-[#8C9C92] mb-1"
          >
            {t('report.categoryLabel')}
          </label>
          <select
            id="report-category"
            value={category}
            onChange={(e) => setCategory(e.target.value as ReportCategory)}
            className="w-full bg-[#152018] border border-[#28382D] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#E4B643]"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {t(`report.categories.${cat}`)}
              </option>
            ))}
          </select>
        </div>

        {/* Description */}
        <div>
          <label
            htmlFor="report-description"
            className="block text-sm font-medium text-[#8C9C92] mb-1"
          >
            {t('report.descriptionLabel')}
            {category === 'other' && (
              <span className="text-red-400 ml-1">*</span>
            )}
          </label>
          <textarea
            id="report-description"
            value={description}
            onChange={(e) => setDescription(e.target.value.slice(0, 500))}
            maxLength={500}
            rows={3}
            placeholder={t('report.descriptionPlaceholder')}
            className="w-full bg-[#152018] border border-[#28382D] rounded-lg px-3 py-2 text-sm text-white placeholder:text-[#5A6A60] focus:outline-none focus:ring-2 focus:ring-[#E4B643] resize-none"
          />
          <p className="text-xs text-[#5A6A60] mt-1 text-right">
            {description.length}/500
          </p>
          {category === 'other' && !description.trim() && (
            <p className="text-xs text-red-400 mt-1">
              {t('report.descriptionRequired')}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-[#8C9C92] hover:text-white transition-colors"
          >
            {t('report.cancel')}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={
              reportMutation.isPending ||
              (category === 'other' && !description.trim())
            }
            className="px-4 py-2 text-sm bg-[#E4B643] text-[#0D1A12] rounded-lg hover:bg-[#D4A633] transition-colors font-medium disabled:opacity-50"
          >
            {reportMutation.isPending ? '…' : t('report.submit')}
          </button>
        </div>
      </div>
    </div>
  );
}
