import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { Heart, Plus, Trash2 } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { EmptyState } from '@/components/EmptyState';
import { useColors, useIsDark } from '@/hooks/useColors';
import { spacing, radius, shadows } from '@/constants/theme';
import { useWishlist, useRemoveWishlistItem } from '@/features/books/hooks/useWishlist';
import { AddWishlistSheet } from '@/features/books/components/AddWishlistSheet';
import type { WishlistItem } from '@/types';

const COVER_COLORS = ['#2D5F3F', '#3B4F7A', '#6B3A5E', '#7A5C2E', '#2B4E5F'];

function WishlistCard({
  item,
  onRemove,
}: {
  item: WishlistItem;
  onRemove: (id: string) => void;
}) {
  const c = useColors();
  const isDark = useIsDark();
  const accent = c.auth.golden;

  const cardBg = isDark ? c.auth.card : c.surface.white;
  const cardBorder = isDark ? c.auth.cardBorder : c.border.default;
  const coverBg = COVER_COLORS[item.id.charCodeAt(0) % COVER_COLORS.length];

  return (
    <View style={[s.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
      <View style={[s.coverWrap, { backgroundColor: coverBg }]}>
        {item.cover_url ? (
          <Image
            source={{ uri: item.cover_url }}
            style={s.coverImg}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <Text style={s.coverInitial} numberOfLines={2}>
            {item.title?.slice(0, 2).toUpperCase() || '?'}
          </Text>
        )}
      </View>

      <View style={s.cardBody}>
        <Text style={[s.cardTitle, { color: c.text.primary }]} numberOfLines={2}>
          {item.title || 'Untitled'}
        </Text>
        {!!item.author && (
          <Text style={[s.cardAuthor, { color: c.text.secondary }]} numberOfLines={1}>
            {item.author}
          </Text>
        )}
        <View style={s.cardMeta}>
          {!!item.genre && (
            <View style={[s.pillSmall, { backgroundColor: accent + '18' }]}>
              <Text style={[s.pillSmallText, { color: accent }]}>{item.genre}</Text>
            </View>
          )}
          {!!item.isbn && (
            <Text style={[s.cardIsbn, { color: c.text.placeholder }]}>
              ISBN {item.isbn}
            </Text>
          )}
        </View>
      </View>

      <Pressable
        onPress={() => onRemove(item.id)}
        hitSlop={12}
        style={({ pressed }) => [s.removeBtn, pressed && { opacity: 0.6 }]}
      >
        <Trash2 size={18} color={c.status.error} />
      </Pressable>
    </View>
  );
}

export function WishlistScreen() {
  const { t } = useTranslation();
  const c = useColors();
  const isDark = useIsDark();

  const bg = isDark ? c.auth.bg : c.neutral[50];
  const accent = c.auth.golden;

  const { data, isLoading, refetch, isRefetching } = useWishlist();
  const removeItem = useRemoveWishlistItem();
  const [sheetOpen, setSheetOpen] = useState(false);

  const items = useMemo(() => data?.results ?? [], [data]);

  const handleRemove = useCallback(
    (id: string) => {
      Alert.alert(
        t('books.wishlist.removeTitle', 'Remove Item'),
        t('books.wishlist.removeMsg', 'Are you sure you want to remove this from your wishlist?'),
        [
          { text: t('common.cancel', 'Cancel'), style: 'cancel' },
          {
            text: t('common.remove', 'Remove'),
            style: 'destructive',
            onPress: () => removeItem.mutate({ id }),
          },
        ],
      );
    },
    [removeItem, t],
  );

  const renderItem = useCallback(
    ({ item }: { item: WishlistItem }) => (
      <WishlistCard item={item} onRemove={handleRemove} />
    ),
    [handleRemove],
  );

  const keyExtractor = useCallback((item: WishlistItem) => item.id, []);

  if (isLoading) {
    return (
      <View style={[s.root, { backgroundColor: bg }]}>
        <ActivityIndicator
          size="large"
          color={accent}
          style={{ marginTop: 80 }}
        />
      </View>
    );
  }

  return (
    <View style={[s.root, { backgroundColor: bg }]}>
      {items.length === 0 ? (
        <EmptyState
          icon={Heart}
          title={t('books.wishlist.emptyTitle', 'No Wishlist Items')}
          subtitle={t(
            'books.wishlist.emptyHint',
            "Tap the + button to add books you're looking for.",
          )}
        />
      ) : (
        <FlatList
          data={items}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          onRefresh={refetch}
          refreshing={isRefetching}
        />
      )}

      {/* ── FAB ── */}
      <Pressable
        onPress={() => setSheetOpen(true)}
        style={({ pressed }) => [
          s.fab,
          { backgroundColor: accent, opacity: pressed ? 0.9 : 1 },
        ]}
      >
        <Plus size={24} color="#152018" strokeWidth={2.5} />
      </Pressable>

      <AddWishlistSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  list: { padding: spacing.md, paddingBottom: 20, gap: spacing.sm },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.sm + 2,
    gap: spacing.sm,
    ...shadows.card,
  },
  coverWrap: {
    width: 56,
    height: 78,
    borderRadius: radius.md,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverImg: { width: '100%', height: '100%' },
  coverInitial: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },

  cardBody: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  cardAuthor: { fontSize: 13, marginBottom: 4 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pillSmall: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  pillSmallText: { fontSize: 11, fontWeight: '700' },
  cardIsbn: { fontSize: 11 },

  removeBtn: { padding: spacing.sm },

  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
});
