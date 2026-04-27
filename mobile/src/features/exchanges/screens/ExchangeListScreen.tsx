import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AlertTriangle, ArrowLeftRight, Bell, BookOpen, MessageCircle } from 'lucide-react-native';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeIn,
} from 'react-native-reanimated';

import { radius, spacing } from '@/constants/theme';
import { ANIMATION } from '@/constants/animation';
import { useColors, useIsDark } from '@/hooks/useColors';
import { useAuthStore } from '@/stores/authStore';
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
type Tab = 'chats' | 'active' | 'pending' | 'history';

const TAB_FILTERS: Record<Exclude<Tab, 'chats'>, string[]> = {
  active: ACTIVE_STATUSES,
  pending: PENDING_STATUSES,
  history: HISTORY_STATUSES,
};

function filterByTab(items: ExchangeListItem[], tab: Tab): ExchangeListItem[] {
  if (tab === 'chats') {
    return items
      .filter((e) => !!e.last_message_at)
      .sort((a, b) => {
        const ta = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
        const tb = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;
        return tb - ta;
      });
  }
  const statuses = TAB_FILTERS[tab];
  return items.filter((e) => statuses.includes(e.status));
}

export function ExchangeListScreen() {
  const { t } = useTranslation();
  const c = useColors();
  const isDark = useIsDark();
  const navigation = useNavigation<Nav>();
  const currentUserId = useAuthStore((st) => st.user?.id);

  useExchangeWsRefresh();
  const { data: exchanges, isLoading, isError, isRefetching, refetch } = useExchanges();
  const { data: incomingCount } = useIncomingCount();
  const [activeTab, setActiveTab] = useState<Tab>('chats');

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  const bg = isDark ? c.auth.bg : c.neutral[50];
  const accent = c.auth.golden;

  const all = exchanges ?? [];
  const filtered = useMemo(() => filterByTab(all, activeTab), [all, activeTab]);

  const totalUnread = useMemo(
    () => all.reduce((sum, e) => sum + (e.unread_count ?? 0), 0),
    [all],
  );

  const chatsCount = useMemo(
    () => all.filter((e) => !!e.last_message_at).length,
    [all],
  );

  const tabs: { key: Tab; label: string; count: number }[] = useMemo(() => [
    { key: 'chats', label: t('exchanges.chats', 'Chats'), count: totalUnread },
    { key: 'active', label: t('exchanges.active', 'Active'), count: filterByTab(all, 'active').length },
    { key: 'pending', label: t('exchanges.pending', 'Pending'), count: filterByTab(all, 'pending').length },
    { key: 'history', label: t('exchanges.history', 'History'), count: filterByTab(all, 'history').length },
  ], [t, totalUnread, all]);

  const tabIndicatorX = useSharedValue(0);
  const tabIndicatorW = useSharedValue(0);
  const tabLayoutsRef = useRef<Map<number, { x: number; width: number }>>(new Map());
  const hasTabLayout = useRef(false);

  const updateTabIndicator = useCallback((tabIndex: number, animate: boolean) => {
    const layout = tabLayoutsRef.current.get(tabIndex);
    if (!layout) return;
    if (animate) {
      tabIndicatorX.value = withSpring(layout.x, ANIMATION.spring.default);
      tabIndicatorW.value = withSpring(layout.width, ANIMATION.spring.default);
    } else {
      tabIndicatorX.value = layout.x;
      tabIndicatorW.value = layout.width;
    }
  }, [tabIndicatorX, tabIndicatorW]);

  const activeTabIndex = tabs.findIndex((t) => t.key === activeTab);

  const onTabItemLayout = useCallback((index: number, e: LayoutChangeEvent) => {
    const { x, width } = e.nativeEvent.layout;
    tabLayoutsRef.current.set(index, { x, width });
    if (index === activeTabIndex) {
      const animate = hasTabLayout.current;
      hasTabLayout.current = true;
      updateTabIndicator(index, animate);
    }
  }, [activeTabIndex, updateTabIndicator]);

  React.useEffect(() => {
    if (activeTabIndex >= 0) {
      updateTabIndicator(activeTabIndex, hasTabLayout.current);
    }
  }, [activeTabIndex, updateTabIndicator]);

  const tabIndicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tabIndicatorX.value }],
    width: tabIndicatorW.value,
  }));

  const goToDetail = useCallback(
    (exchangeId: string) => navigation.navigate('ExchangeDetail', { exchangeId }),
    [navigation],
  );

  const goToChat = useCallback(
    (item: ExchangeListItem) => {
      const isOwner = currentUserId === item.owner.id;
      const other = isOwner ? item.requester : item.owner;
      navigation.navigate('Chat', {
        exchangeId: item.id,
        partnerName: other.username,
        partnerAvatar: other.avatar,
        exchangeStatus: item.status,
      });
    },
    [navigation, currentUserId],
  );

  const goToIncoming = useCallback(
    () => navigation.navigate('IncomingRequests'),
    [navigation],
  );

  const renderItem = useCallback(
    ({ item }: { item: ExchangeListItem }) => (
      <ExchangeCard
        exchange={item}
        onPress={() => activeTab === 'chats' ? goToChat(item) : goToDetail(item.id)}
      />
    ),
    [goToDetail, goToChat, activeTab],
  );

  const emptyProps = useMemo(() => {
    if (activeTab === 'chats') {
      return {
        icon: MessageCircle,
        title: t('exchanges.noChats', 'No conversations yet'),
        subtitle: t('exchanges.noChatsHint', 'Start a swap and chat with your exchange partner.'),
      };
    }
    if (activeTab === 'history') {
      return {
        icon: BookOpen,
        title: t('exchanges.noHistory', 'No exchange history'),
        subtitle: t('exchanges.noHistorySub', 'Your completed exchanges will appear here.'),
      };
    }
    return {
      icon: ArrowLeftRight,
      title: t('exchanges.noExchanges', 'No exchanges yet'),
      subtitle: t('exchanges.browseToStart', 'Browse books nearby to start swapping!'),
    };
  }, [activeTab, t]);

  return (
    <View style={[s.root, { backgroundColor: bg }]}>
      {/* Incoming requests banner */}
      {(incomingCount ?? 0) > 0 && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('exchanges.incomingBanner', '{{count}} incoming request(s)', { count: incomingCount })}
          onPress={goToIncoming}
          style={[s.incomingBanner, { backgroundColor: accent + '15', borderColor: accent + '30' }]}
        >
          <Bell size={16} color={accent} />
          <Text style={[s.incomingText, { color: accent }]}>
            {t('exchanges.incomingBanner', '{{count}} incoming request(s)', { count: incomingCount })}
          </Text>
        </Pressable>
      )}

      {/* Tab bar */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={s.tabScroll}
        contentContainerStyle={s.tabRow}
      >
        <Animated.View
          style={[
            s.tabIndicator,
            { backgroundColor: accent + '15', borderColor: accent },
            tabIndicatorStyle,
          ]}
        />
        {tabs.map(({ key, label, count }, index) => {
          const isActive = activeTab === key;
          const showDot = key === 'chats' && totalUnread > 0 && !isActive;
          return (
            <Pressable
              key={key}
              accessibilityRole="button"
              accessibilityLabel={label}
              accessibilityState={{ selected: isActive }}
              onPress={() => setActiveTab(key)}
              onLayout={(e) => onTabItemLayout(index, e)}
              style={s.tab}
            >
              <Text style={[s.tabLabel, { color: isActive ? accent : c.text.secondary }]}>
                {label}
              </Text>
              {count > 0 && (
                <View style={[s.tabBadge, { backgroundColor: isActive ? accent : c.text.placeholder + '30' }]}>
                  <Text style={[s.tabBadgeText, { color: isActive ? '#fff' : c.text.secondary }]}>
                    {count}
                  </Text>
                </View>
              )}
              {showDot && (
                <View style={[s.unreadDot, { backgroundColor: accent }]} />
              )}
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Content */}
      {isLoading ? (
        <View style={s.list}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </View>
      ) : isError ? (
        <EmptyState
          icon={AlertTriangle}
          title={t('common.error', 'Something went wrong')}
          subtitle={t('common.retryHint', 'Check your connection and try again.')}
          actionLabel={t('common.retry', 'Retry')}
          onAction={() => refetch()}
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={emptyProps.icon}
          title={emptyProps.title}
          subtitle={emptyProps.subtitle}
        />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(e) => e.id}
          renderItem={renderItem}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          onRefresh={refetch}
          refreshing={isRefetching}
          windowSize={5}
          maxToRenderPerBatch={8}
          removeClippedSubviews
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

  tabScroll: {
    flexGrow: 0,
  },
  tabRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  tabIndicator: {
    position: 'absolute',
    top: spacing.md,
    bottom: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill,
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
  unreadDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    position: 'absolute',
    top: 4,
    right: 4,
  },

  list: { paddingHorizontal: spacing.lg, gap: spacing.sm },
});
