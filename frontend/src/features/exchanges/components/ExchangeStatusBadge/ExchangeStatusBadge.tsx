import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import type { ExchangeStatus } from '../../types/exchange.types';

const STATUS_STYLES: Record<ExchangeStatus, string> = {
  pending: 'bg-yellow-500/20 text-yellow-400',
  counter_proposed: 'bg-purple-500/20 text-purple-400',
  accepted: 'bg-blue-500/20 text-blue-400',
  conditions_pending: 'bg-blue-500/20 text-blue-400',
  active: 'bg-green-500/20 text-green-400',
  swap_confirmed: 'bg-emerald-500/20 text-emerald-400',
  completed: 'bg-emerald-500/20 text-emerald-400',
  declined: 'bg-red-500/20 text-red-400',
  cancelled: 'bg-neutral-500/20 text-neutral-400',
  expired: 'bg-neutral-500/20 text-neutral-400',
  return_requested: 'bg-orange-500/20 text-orange-400',
  returned: 'bg-teal-500/20 text-teal-400',
};

interface ExchangeStatusBadgeProps {
  status: ExchangeStatus;
}

export function ExchangeStatusBadge({ status }: ExchangeStatusBadgeProps): ReactElement {
  const { t } = useTranslation('exchanges');
  const styles = STATUS_STYLES[status] ?? 'bg-neutral-500/20 text-neutral-400';

  return (
    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${styles}`}>
      {t(`status.${status}`, status)}
    </span>
  );
}
