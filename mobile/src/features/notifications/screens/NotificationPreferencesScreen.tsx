import React from 'react';
import {
  View,
  Text,
  Switch,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  AlertTriangle,
  Mail,
  UserPlus,
  UserCheck,
  UserX,
  MessageSquare,
  ArrowLeftRight,
  Star,
} from 'lucide-react-native';

import { useColors, useIsDark } from '@/hooks/useColors';
import { spacing, radius } from '@/constants/theme';
import { EmptyState } from '@/components/EmptyState';
import { BrandedLoader } from '@/components/BrandedLoader';
import type { NotificationPreferences } from '@/types';
import {
  useNotificationPreferences,
  usePatchNotificationPreferences,
} from '@/features/notifications/hooks/useNotificationPreferences';

type PrefKey = keyof NotificationPreferences;

const PREF_ROWS: {
  key: PrefKey;
  icon: typeof Mail;
  labelKey: string;
  fallback: string;
  descKey: string;
  descFallback: string;
}[] = [
  {
    key: 'email_new_request',
    icon: UserPlus,
    labelKey: 'notifications.pref.newRequest',
    fallback: 'New swap requests',
    descKey: 'notifications.pref.newRequestDesc',
    descFallback: 'When someone requests to swap with you',
  },
  {
    key: 'email_request_accepted',
    icon: UserCheck,
    labelKey: 'notifications.pref.requestAccepted',
    fallback: 'Request accepted',
    descKey: 'notifications.pref.requestAcceptedDesc',
    descFallback: 'When your swap request is accepted',
  },
  {
    key: 'email_request_declined',
    icon: UserX,
    labelKey: 'notifications.pref.requestDeclined',
    fallback: 'Request declined',
    descKey: 'notifications.pref.requestDeclinedDesc',
    descFallback: 'When your swap request is declined',
  },
  {
    key: 'email_new_message',
    icon: MessageSquare,
    labelKey: 'notifications.pref.newMessage',
    fallback: 'New messages',
    descKey: 'notifications.pref.newMessageDesc',
    descFallback: 'When you receive a new chat message',
  },
  {
    key: 'email_exchange_completed',
    icon: ArrowLeftRight,
    labelKey: 'notifications.pref.exchangeCompleted',
    fallback: 'Exchange completed',
    descKey: 'notifications.pref.exchangeCompletedDesc',
    descFallback: 'When a swap is successfully completed',
  },
  {
    key: 'email_rating_received',
    icon: Star,
    labelKey: 'notifications.pref.ratingReceived',
    fallback: 'Rating received',
    descKey: 'notifications.pref.ratingReceivedDesc',
    descFallback: 'When someone rates you after a swap',
  },
];

export function NotificationPreferencesScreen() {
  const { t } = useTranslation();
  const c = useColors();
  const isDark = useIsDark();
  const { data: prefs, isLoading, isError, refetch } = useNotificationPreferences();
  const patch = usePatchNotificationPreferences();

  const bg = isDark ? c.auth.bg : c.neutral[50];
  const cardBg = isDark ? c.auth.card : c.surface.white;
  const cardBorder = isDark ? c.auth.cardBorder : c.border.default;
  const dividerColor = isDark ? c.auth.cardBorder + '50' : c.neutral[100];
  const accent = c.auth.golden;
  const iconBg = isDark ? c.auth.golden + '14' : c.neutral[50];

  if (isLoading) {
    return (
      <View style={[s.root, s.center, { backgroundColor: bg }]}>
        <BrandedLoader size="lg" />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={[s.root, s.center, { backgroundColor: bg }]}>
        <EmptyState
          icon={AlertTriangle}
          title={t('common.loadError', 'Something went wrong')}
          subtitle={t('common.loadErrorHint', 'Check your connection and try again.')}
          actionLabel={t('common.retry', 'Retry')}
          onAction={() => refetch()}
        />
      </View>
    );
  }

  return (
    <View style={[s.root, { backgroundColor: bg }]}>
      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Header description */}
        <View style={s.headerSection}>
          <View style={[s.headerIcon, { backgroundColor: accent + '18' }]}>
            <Mail size={22} color={accent} />
          </View>
          <Text style={[s.headerTitle, { color: c.text.primary }]}>
            {t('notifications.pref.title', 'Email Notifications')}
          </Text>
          <Text style={[s.headerDesc, { color: c.text.secondary }]}>
            {t(
              'notifications.pref.description',
              "Choose which email notifications you'd like to receive. You can change these at any time.",
            )}
          </Text>
        </View>

        {/* Preference toggles */}
        <View style={[s.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          {PREF_ROWS.map((row, index) => {
            const Icon = row.icon;
            const checked = prefs?.[row.key] ?? true;
            const isLast = index === PREF_ROWS.length - 1;

            return (
              <React.Fragment key={row.key}>
                <View style={s.row}>
                  <View style={s.rowLeft}>
                    <View style={[s.iconCircle, { backgroundColor: iconBg }]}>
                      <Icon
                        size={18}
                        color={isDark ? accent : c.text.secondary}
                      />
                    </View>
                    <View style={s.rowTextWrap}>
                      <Text style={[s.rowTitle, { color: c.text.primary }]}>
                        {t(row.labelKey, row.fallback)}
                      </Text>
                      <Text style={[s.rowDesc, { color: c.text.secondary }]}>
                        {t(row.descKey, row.descFallback)}
                      </Text>
                    </View>
                  </View>
                  <Switch
                    value={checked}
                    onValueChange={(value) =>
                      patch.mutate({ [row.key]: value })
                    }
                    accessibilityRole="switch"
                    accessibilityLabel={t(row.labelKey, row.fallback)}
                    trackColor={{
                      true: accent,
                      false: isDark ? c.auth.cardBorder : c.neutral[200],
                    }}
                    thumbColor="#fff"
                    disabled={patch.isPending}
                  />
                </View>
                {!isLast && (
                  <View
                    style={[s.divider, { backgroundColor: dividerColor }]}
                  />
                )}
              </React.Fragment>
            );
          })}
        </View>

        {/* Footer hint */}
        <Text style={[s.footerHint, { color: c.text.subtle }]}>
          {t(
            'notifications.pref.footerHint',
            'You can also unsubscribe from emails using the link at the bottom of any notification email.',
          )}
        </Text>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  center: { justifyContent: 'center', alignItems: 'center' },
  scroll: {
    paddingHorizontal: spacing.md + 4,
    paddingTop: spacing.lg,
    paddingBottom: 20,
  },

  headerSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  headerDesc: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },

  card: {
    borderRadius: radius.xl,
    borderWidth: 1,
    overflow: 'hidden',
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md + 4,
    paddingVertical: spacing.md,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
    marginRight: spacing.sm,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTextWrap: { flex: 1 },
  rowTitle: { fontSize: 15, fontWeight: '600' },
  rowDesc: { fontSize: 12, marginTop: 2, lineHeight: 16 },
  divider: { height: 1, marginHorizontal: spacing.md },

  footerHint: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: spacing.lg,
    paddingHorizontal: spacing.md,
  },
});
