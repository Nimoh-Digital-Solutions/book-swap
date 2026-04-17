import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { radius, shadows, spacing } from '@/constants/theme';
import { useColors, useIsDark } from '@/hooks/useColors';

const AVATAR_COLORS = ['#6366F1', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981'];

interface Participant {
  username: string;
  swap_count: number;
}

interface Props {
  requester: Participant;
  owner: Participant;
  label: string;
  requesterRole: string;
  ownerRole: string;
}

export function DetailParticipants({ requester, owner, label, requesterRole, ownerRole }: Props) {
  const c = useColors();
  const isDark = useIsDark();
  const cardBg = isDark ? c.auth.card : c.surface.white;
  const cardBorder = isDark ? c.auth.cardBorder : c.border.default;

  const reqColor = AVATAR_COLORS[requester.username.charCodeAt(0) % AVATAR_COLORS.length];
  const ownColor = AVATAR_COLORS[owner.username.charCodeAt(0) % AVATAR_COLORS.length];

  return (
    <View style={[s.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
      <Text style={[s.cardLabel, { color: c.text.placeholder }]}>{label}</Text>

      <View style={s.row}>
        <View style={[s.avatar, { backgroundColor: reqColor + '20' }]}>
          <Text style={[s.avatarText, { color: reqColor }]}>
            {requester.username.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={s.info}>
          <Text style={[s.name, { color: c.text.primary }]}>@{requester.username}</Text>
          <Text style={[s.role, { color: c.text.secondary }]}>
            {requesterRole} · {requester.swap_count} swaps
          </Text>
        </View>
      </View>

      <View style={[s.divider, { backgroundColor: cardBorder + '50' }]} />

      <View style={s.row}>
        <View style={[s.avatar, { backgroundColor: ownColor + '20' }]}>
          <Text style={[s.avatarText, { color: ownColor }]}>
            {owner.username.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={s.info}>
          <Text style={[s.name, { color: c.text.primary }]}>@{owner.username}</Text>
          <Text style={[s.role, { color: c.text.secondary }]}>
            {ownerRole} · {owner.swap_count} swaps
          </Text>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: radius.xl,
    borderWidth: 1,
    ...shadows.card,
  },
  cardLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: 8 },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 16, fontWeight: '700' },
  info: { flex: 1 },
  name: { fontSize: 14, fontWeight: '700' },
  role: { fontSize: 11, marginTop: 1 },
  divider: { height: 1, marginVertical: 2 },
});
