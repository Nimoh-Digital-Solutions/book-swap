import React, { useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, MessageSquareQuote } from 'lucide-react-native';

import { useAuthStore } from '@/stores/authStore';
import { useUserRatings } from '@/features/ratings/hooks/useRatings';
import { RatingCard } from '@/features/ratings/components/RatingCard';
import { EmptyState } from '@/components/EmptyState';
import { BrandedLoader } from '@/components/BrandedLoader';
import { useColors, useIsDark } from '@/hooks/useColors';
import { spacing, radius } from '@/constants/theme';
import type { Rating } from '@/types';

export function MyReviewsScreen() {
  const { t } = useTranslation();
  const c = useColors();
  const isDark = useIsDark();
  const user = useAuthStore((s) => s.user);
  const accent = c.auth.golden;

  const { data, isLoading, isError, refetch, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useUserRatings(user?.id ?? '');

  const ratings = useMemo(
    () => data?.pages.flatMap((p) => p.results) ?? [],
    [data],
  );

  const bg = isDark ? c.auth.bg : c.neutral[50];

  if (!user) return null;

  const renderItem = ({ item }: { item: Rating }) => (
    <RatingCard rating={item} />
  );

  const renderFooter = () => {
    if (!hasNextPage) return null;
    return (
      <Pressable
        onPress={() => fetchNextPage()}
        disabled={isFetchingNextPage}
        style={({ pressed }) => [
          s.loadMoreBtn,
          {
            borderColor: isDark ? c.auth.cardBorder : c.border.default,
            opacity: pressed ? 0.7 : 1,
          },
        ]}
      >
        {isFetchingNextPage ? (
          <ActivityIndicator size="small" color={accent} />
        ) : (
          <Text style={[s.loadMoreText, { color: accent }]}>
            {t('profile.loadMore', 'Load more')}
          </Text>
        )}
      </Pressable>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[s.safe, { backgroundColor: bg }]} edges={['bottom']}>
        <View style={s.center}>
          <BrandedLoader size="lg" />
        </View>
      </SafeAreaView>
    );
  }

  if (isError) {
    return (
      <SafeAreaView style={[s.safe, { backgroundColor: bg }]} edges={['bottom']}>
        <View style={s.center}>
          <EmptyState
            icon={AlertTriangle}
            title={t('common.loadError', 'Something went wrong')}
            subtitle={t('common.loadErrorHint', 'Check your connection and try again.')}
            actionLabel={t('common.retry', 'Retry')}
            onAction={() => refetch()}
          />
        </View>
      </SafeAreaView>
    );
  }

  if (ratings.length === 0) {
    return (
      <SafeAreaView style={[s.safe, { backgroundColor: bg }]} edges={['bottom']}>
        <View style={s.center}>
          <EmptyState
            icon={MessageSquareQuote}
            title={t('profile.noReviews', 'No reviews yet')}
            subtitle={t('profile.noReviewsHint', 'Complete swaps to receive ratings from other users.')}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: bg }]} edges={['bottom']}>
      <FlatList
        data={ratings}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={s.list}
        showsVerticalScrollIndicator={false}
        windowSize={5}
        maxToRenderPerBatch={8}
        removeClippedSubviews
        onRefresh={refetch}
        refreshing={false}
        ListHeaderComponent={
          <Text style={[s.count, { color: c.text.secondary }]}>
            {t('reviews.count', '{{count}} review(s)', { count: ratings.length })}
          </Text>
        }
        ListFooterComponent={renderFooter}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) fetchNextPage();
        }}
        onEndReachedThreshold={0.3}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  list: {
    paddingHorizontal: spacing.md + 4,
    paddingTop: spacing.md,
    paddingBottom: 20,
    gap: spacing.sm,
  },
  count: { fontSize: 13, fontWeight: '600', marginBottom: spacing.xs },
  loadMoreBtn: {
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginTop: spacing.sm,
  },
  loadMoreText: { fontSize: 14, fontWeight: '600' },
});
