import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useRoute, useNavigation, type RouteProp } from '@react-navigation/native';
import {
  ArrowLeftRight,
  BookOpen,
  Globe,
  Sparkles,
  Tag,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { useColors, useIsDark } from '@/hooks/useColors';
import { spacing, radius, shadows } from '@/constants/theme';
import { getMockBookById } from '../data/mockBooks';

type Route = RouteProp<{ BookDetail: { bookId: string } }, 'BookDetail'>;

const CONDITION_LABELS: Record<string, string> = {
  new: 'New',
  like_new: 'Like New',
  good: 'Good',
  fair: 'Fair',
  poor: 'Poor',
};

const AVATAR_GRADIENTS = ['#6366F1', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981'];

export function BookDetailScreen() {
  const { t } = useTranslation();
  const c = useColors();
  const isDark = useIsDark();
  const navigation = useNavigation();
  const { params } = useRoute<Route>();

  const book = getMockBookById(params.bookId);

  const bg = isDark ? c.auth.bg : c.neutral[50];
  const cardBg = isDark ? c.auth.card : c.surface.white;
  const cardBorder = isDark ? c.auth.cardBorder : c.border.default;
  const accent = c.auth.golden;

  if (!book) {
    return (
      <View style={[s.centered, { backgroundColor: bg }]}>
        <Text style={[s.notFound, { color: c.text.secondary }]}>
          {t('books.notFound', 'Book not found')}
        </Text>
      </View>
    );
  }

  return (
    <View style={[s.root, { backgroundColor: bg }]}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {/* ── Cover Hero ── */}
        <View style={[s.coverHero, { backgroundColor: book.coverBg }]}>
          <Text style={s.coverTitle} numberOfLines={3}>{book.title}</Text>
          <Text style={s.coverAuthor}>{book.author}</Text>
          {book.available && (
            <View style={[s.availBadge, { backgroundColor: accent }]}>
              <Text style={s.availBadgeText}>
                {t('books.available', 'Available')}
              </Text>
            </View>
          )}
        </View>

        {/* ── Title + Author ── */}
        <View style={s.titleSection}>
          <Text style={[s.title, { color: c.text.primary }]}>{book.title}</Text>
          <Text style={[s.author, { color: c.text.secondary }]}>{book.author}</Text>
        </View>

        {/* ── Meta pills ── */}
        <View style={s.metaRow}>
          <View style={[s.metaPill, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <Tag size={14} color={accent} />
            <Text style={[s.metaText, { color: c.text.primary }]}>{book.genre}</Text>
          </View>
          <View style={[s.metaPill, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <Sparkles size={14} color={accent} />
            <Text style={[s.metaText, { color: c.text.primary }]}>
              {CONDITION_LABELS[book.condition] ?? book.condition}
            </Text>
          </View>
          <View style={[s.metaPill, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <Globe size={14} color={accent} />
            <Text style={[s.metaText, { color: c.text.primary }]}>{book.language}</Text>
          </View>
        </View>

        {/* ── Description ── */}
        <View style={[s.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <View style={s.cardHeader}>
            <BookOpen size={16} color={accent} />
            <Text style={[s.cardLabel, { color: c.text.secondary }]}>
              {t('books.description', 'Description')}
            </Text>
          </View>
          <Text style={[s.description, { color: c.text.primary }]}>
            {book.description}
          </Text>
        </View>

        {/* ── Owner Card ── */}
        <View style={[s.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <Text style={[s.cardLabel, { color: c.text.secondary, marginBottom: spacing.sm }]}>
            {t('books.listedBy', 'Listed by')}
          </Text>
          <View style={s.ownerRow}>
            <View
              style={[
                s.ownerAvatar,
                { backgroundColor: AVATAR_GRADIENTS[book.id.charCodeAt(0) % AVATAR_GRADIENTS.length] },
              ]}
            >
              <Text style={s.ownerInitial}>{book.owner.initial}</Text>
            </View>
            <View style={s.ownerInfo}>
              <Text style={[s.ownerName, { color: c.text.primary }]}>{book.owner.name}</Text>
              <Text style={[s.ownerSub, { color: c.text.secondary }]}>
                {t('books.memberSince', 'Member since 2024')}
              </Text>
            </View>
          </View>
        </View>

        <View style={s.bottomSpacer} />
      </ScrollView>

      {/* ── Bottom CTA ── */}
      {book.available && (
        <View style={[s.ctaWrap, { backgroundColor: bg }]}>
          <Pressable
            style={({ pressed }) => [s.ctaBtn, { backgroundColor: accent, opacity: pressed ? 0.9 : 1 }]}
          >
            <ArrowLeftRight size={18} color="#fff" />
            <Text style={s.ctaBtnText}>
              {t('books.requestSwap', 'Request Swap')}
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingBottom: 16 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  notFound: { fontSize: 16 },

  // Cover hero
  coverHero: {
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    position: 'relative',
  },
  coverTitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  coverAuthor: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  availBadge: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  availBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800', letterSpacing: 0.8, textTransform: 'uppercase' },

  // Title section
  titleSection: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, marginBottom: spacing.md },
  title: { fontSize: 24, fontWeight: '800', letterSpacing: -0.3, marginBottom: 4 },
  author: { fontSize: 15 },

  // Meta pills
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, paddingHorizontal: spacing.lg, marginBottom: spacing.lg },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  metaText: { fontSize: 13, fontWeight: '600' },

  // Card
  card: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.md + 4,
    borderRadius: radius.xl,
    borderWidth: 1,
    ...shadows.card,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: spacing.sm },
  cardLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },

  // Description
  description: { fontSize: 15, lineHeight: 24 },

  // Owner
  ownerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  ownerAvatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  ownerInitial: { color: '#fff', fontSize: 18, fontWeight: '700' },
  ownerInfo: { flex: 1 },
  ownerName: { fontSize: 16, fontWeight: '700' },
  ownerSub: { fontSize: 12, marginTop: 2 },

  // Bottom CTA
  ctaWrap: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: 120,
  },
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: 16,
    borderRadius: radius.xl,
  },
  ctaBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  bottomSpacer: { height: 20 },
});
