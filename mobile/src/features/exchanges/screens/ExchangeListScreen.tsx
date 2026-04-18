import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ArrowLeftRight, Bell, BookOpen, Inbox } from 'lucide-react-native';
import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { radius, spacing } from '@/constants/theme';
import { useColors, useIsDark } from '@/hooks/useColors';
import { SkeletonCard } from '@/components/Skeleton';
import { EmptyState } from '@/components/EmptyState';
import type { MessagesStackParamList } from '@/navigation/types';
import type { ExchangeListItem } from '@/types';
import {
  ExchangeCard,
} from '../components/ExchangeCard';
import {
  ACTIVE_STATUSES,
  HISTORY_STATUSES,
  PENDING_STATUSES,
} from '../constants';
import { useExchangeWsRefresh } from '../hooks/useExchangeWsRefresh';
import {
  useExchanges,
  useIncomingCount,
} from '../hooks/useExchanges';

type Nav = NativeStackNavigationProp<MessagesStackParamList, 'ExchangeList'>;
type Tab = 'active' | 'pending' | 'history';

const TAB_FILTERS: Record<Tab, string[]> = {
  active: ACTIVE_STATUSES,
  pending: PENDING_STATUSES,
  history: HISTORY_STATUSES,
};

function filterByTab(items: ExchangeListItem[], tab: Tab): ExchangeListItem[] {
  const statuses = TAB_FILTERS[tab];
  return items.filter((e) => statuses.includes(e.status));
}

export function ExchangeListScreen() {
  const { t } = useTranslation();
  const c = useColors();
  const isDark = useIsDark();
  const navigation = useNavigation<Nav>();

  useExchangeWsRefresh();
  const { data: exchanges, isLoading, refetch } = useExchanges();
  const { data: incomingCount } = useIncomingCount();
  const [activeTab, setActiveTab] = useState<Tab>('active');

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  const bg = isDark ? c.auth.bg : c.neutral[50];
  const cardBg = isDark ? c.auth.card : c.surface.white;
  const cardBorder = isDark ? c.auth.cardBorder : c.border.default;
  const accent = c.auth.golden;

  const all = exchanges ?? [];
  const filtered = useMemo(() => filterByTab(all, activeTab), [all, activeTab]);

  const tabs: { key: Tab; label: string }[] = [
    { key: 'active', label: t('exchanges.active', 'Active') },
    { key: 'pending', label: t('exchanges.pending', 'Pending') },
    { key: 'history', label: t('exchanges.history', 'History') },
  ];

  const tabCounts = useMemo(
    () => ({
      active: filterByTab(all, 'active').length,
      pending: filterByTab(all, 'pending').length,
      history: filterByTab(all, 'history').length,
    }),
    [all],
  );

  const goToDetail = useCallback(
    (exchangeId: string) => navigation.navigate('ExchangeDetail', { exchangeId }),
    [navigation],
  );

  const goToIncoming = useCallback(
    () => navigation.navigate('IncomingRequests' as any),
    [navigation],
  );

  const renderItem = useCallback(
    ({ item }: { item: ExchangeListItem }) => (
      <ExchangeCard exchange={item} onPress={() => goToDetail(item.id)} />
    ),
    [goToDetail],
  );

  return (
    <View style={[s.root, { backgroundColor: bg }]}>
      {/* Incoming requests banner */}
      {(incomingCount ?? 0) > 0 && (
        <Pressable
          onPress={goToIncoming}
          style={[s.incomingBanner, { backgroundColor: accent + '15', borderColor: accent + '30' }]}
        >
          <Bell size={16} color={accent} />
          <Text style={[s.incomingText, { color: accent }]}>
            {t('exchanges.incomingRequests', '{{count}} incoming request(s)', { count: incomingCount })}
          </Text>
        </Pressable>
      )}

      {/* Tab bar */}
      <View style={s.tabRow}>
        {tabs.map(({ key, label }) => {
          const isActive = activeTab === key;
          return (
            <Pressable
              key={key}
              onPress={() => setActiveTab(key)}
              style={[
                s.tab,
                {
                  backgroundColor: isActive ? accent + '15' : 'transparent',
                  borderColor: isActive ? accent : 'transparent',
                },
              ]}
            >
              <Text style={[s.tabLabel, { color: isActive ? accent : c.text.secondary }]}>
                {label}
              </Text>
              {tabCounts[key] > 0 && (
                <View style={[s.tabBadge, { backgroundColor: isActive ? accent : c.text.placeholder + '30' }]}>
                  <Text style={[s.tabBadgeText, { color: isActive ? '#fff' : c.text.secondary }]}>
                    {tabCounts[key]}
                  </Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </View>

      {/* Content */}
      {isLoading ? (
        <View style={s.list}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </View>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={activeTab === 'history' ? BookOpen : ArrowLeftRight}
          title={t('exchanges.noExchanges', 'No exchanges yet')}
          subtitle={
            activeTab !== 'history'
              ? t('exchanges.browseToStart', 'Browse books nearby to start swapping!')
              : t('exchanges.noHistory', 'Your completed exchanges will appear here.')
          }
        />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(e) => e.id}
          renderItem={renderItem}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={<View style={{ height: 20 }} />}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },

  incomingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    padding: spacing.sm + 2,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  incomingText: { fontSize: 13, fontWeight: '600' },

  tabRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  tabLabel: { fontSize: 13, fontWeight: '600' },
  tabBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  tabBadgeText: { fontSize: 10, fontWeight: '700' },

  loader: { marginTop: 40 },

  empty: { alignItems: 'center', paddingTop: 60, paddingHorizontal: spacing.xl },
  emptyTitle: { fontSize: 17, fontWeight: '700', marginTop: spacing.md },
  emptySub: { fontSize: 13, textAlign: 'center', marginTop: 4, lineHeight: 18 },

  list: { paddingHorizontal: spacing.lg, gap: spacing.sm },
});
