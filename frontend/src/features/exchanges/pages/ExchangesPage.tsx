import { type ReactElement, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { SEOHead } from '@components';
import { BrandedLoader, EmptyPlaceholder } from '@components/common';
import { PATHS, routeMetadata } from '@routes/config/paths';
import { ArrowRightLeft, Clock, Inbox } from 'lucide-react';

import { ExchangeCard } from '../components/ExchangeCard/ExchangeCard';
import { useExchanges } from '../hooks/useExchanges';
import { useIncomingRequestCount } from '../hooks/useIncomingRequestCount';
import type { ExchangeListItem, ExchangeStatus } from '../types/exchange.types';

type Tab = 'active' | 'pending' | 'history';

const ACTIVE_STATUSES: ExchangeStatus[] = ['accepted', 'conditions_pending', 'active', 'swap_confirmed'];
const PENDING_STATUSES: ExchangeStatus[] = ['pending'];
const HISTORY_STATUSES: ExchangeStatus[] = ['completed', 'declined', 'cancelled', 'expired', 'return_requested', 'returned'];

function filterByTab(items: ExchangeListItem[], tab: Tab): ExchangeListItem[] {
  const statuses = tab === 'active' ? ACTIVE_STATUSES : tab === 'pending' ? PENDING_STATUSES : HISTORY_STATUSES;
  return items.filter(e => statuses.includes(e.status));
}

export default function ExchangesPage(): ReactElement {
  const { t } = useTranslation('exchanges');
  const [activeTab, setActiveTab] = useState<Tab>('active');

  const { data, isLoading, isError } = useExchanges();
  const { data: incomingCount } = useIncomingRequestCount();

  const allExchanges = useMemo(() => data?.results ?? [], [data]);
  const filtered = useMemo(() => filterByTab(allExchanges, activeTab), [allExchanges, activeTab]);

  const counts = useMemo(() => ({
    active: filterByTab(allExchanges, 'active').length,
    pending: filterByTab(allExchanges, 'pending').length,
    history: filterByTab(allExchanges, 'history').length,
  }), [allExchanges]);

  if (isLoading) {
    return (
      <div className="min-h-[50vh]">
        <BrandedLoader size="md" label={t('common.loading', 'Loading…')} />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-16">
        <p className="text-red-400">{t('error.load', 'Unable to load exchanges.')}</p>
      </div>
    );
  }

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: 'active', label: t('tabs.active', 'Active'), count: counts.active },
    { key: 'pending', label: t('tabs.pending', 'Pending'), count: counts.pending },
    { key: 'history', label: t('tabs.history', 'History'), count: counts.history },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <SEOHead
        title={routeMetadata[PATHS.EXCHANGES].title}
        description={routeMetadata[PATHS.EXCHANGES].description}
        path={PATHS.EXCHANGES}
        noIndex
      />
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">{t('page.title', 'My Exchanges')}</h1>
          <p className="text-[#8C9C92] mt-1">{t('page.description', 'Track and manage your book swaps.')}</p>
        </div>
        <Link
          to={PATHS.INCOMING_REQUESTS}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#28382D] hover:bg-[#344a3a] text-white font-medium text-sm rounded-full transition-colors"
        >
          <Inbox className="w-4 h-4" aria-hidden="true" />
          {t('incoming.title', 'Incoming Requests')}
          {(incomingCount?.count ?? 0) > 0 && (
            <span className="ml-1 bg-[#E4B643] text-[#152018] text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {incomingCount!.count}
            </span>
          )}
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-8 border-b border-[#28382D]" role="tablist">
        {tabs.map(tab => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab.key
                ? 'border-[#E4B643] text-[#E4B643]'
                : 'border-transparent text-[#8C9C92] hover:text-white'
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className="ml-2 text-xs bg-[#28382D] text-[#8C9C92] px-2 py-0.5 rounded-full">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab panel */}
      <div role="tabpanel">
        {filtered.length === 0 ? (
          <EmptyPlaceholder
            icon={activeTab === 'history' ? Clock : activeTab === 'pending' ? Inbox : ArrowRightLeft}
            title={t(`empty.${activeTab}`, 'No exchanges here yet')}
            description={
              activeTab === 'active'
                ? t('empty.activeHint', 'When you have active swaps, they will appear here.')
                : activeTab === 'pending'
                ? t('empty.pendingHint', 'Browse the catalogue to find books and request a swap.')
                : t('empty.historyHint', 'Your completed and past exchanges will show up here.')
            }
            {...(activeTab !== 'history'
              ? { action: { label: t('empty.browseCta', 'Browse books'), href: PATHS.CATALOGUE } }
              : {})}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(exchange => (
              <ExchangeCard key={exchange.id} exchange={exchange} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
